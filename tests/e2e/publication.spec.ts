import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { readFile } from "node:fs/promises";
import { initialState } from "../../src/features/prototype/model";
import { STORAGE_KEY } from "../../src/features/prototype/storage";

test("imported markup stays text and a script URL is not rendered as a company action", async ({
  page,
}) => {
  const state = initialState();
  const job = state.jobs[0];
  const company = state.companies.find((item) => item.id === job.companyId)!;
  const hostile = '<img src=x onerror="window.__importExecuted=true">';
  job.description = `Treść testowa. ${hostile} <script>window.__importExecuted=true</script>`;
  company.websiteUrl = "javascript:window.__importExecuted=true";
  await page.goto("/#/app/settings");
  await page.getByLabel("Importuj plik scenariusza").setInputFiles({
    name: "synthetic-markup.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(state)),
  });
  await page.getByRole("button", { name: "Importuj", exact: true }).click();
  await page.goto(`/#/oferty/${job.slug}`);
  await expect(page.getByRole("main")).toContainText(hostile);
  await expect(page.locator('main img[src="x"]')).toHaveCount(0);
  await page.goto(`/#/firmy/${company.slug}`);
  await expect(page.locator('a[href^="javascript:"]')).toHaveCount(0);
  expect(
    await page.evaluate(() => (window as Window & { __importExecuted?: boolean }).__importExecuted),
  ).toBeUndefined();
});

test("one editing tab owns persistence; another can export and takes over only after reload", async ({
  page,
  context,
}) => {
  await page.goto("/#/auth/sign-in");
  await page.getByRole("button", { name: "Wejdź jako Anna Kowalska", exact: true }).click();
  const before = await page.evaluate((key) => localStorage.getItem(key), STORAGE_KEY);
  const second = await context.newPage();
  await second.goto("/#/app/settings");
  await expect(second.getByRole("status").first()).toContainText("w innej karcie");
  await second.getByRole("button", { name: "Resetuj scenariusz", exact: true }).click();
  await second
    .getByRole("alertdialog")
    .getByRole("button", { name: "Resetuj", exact: true })
    .click();
  await expect(second.getByRole("alert")).toContainText("w innej karcie");
  await expect(second.getByText("Przywrócono scenariusz początkowy.", { exact: true })).toHaveCount(
    0,
  );
  expect(await second.evaluate((key) => localStorage.getItem(key), STORAGE_KEY)).toBe(before);
  const download = second.waitForEvent("download");
  await second.getByRole("button", { name: "Eksportuj dane", exact: true }).click();
  expect(JSON.parse(await readFile((await (await download).path())!, "utf8"))).toEqual(
    JSON.parse(before!),
  );
  await page.close();
  await second.reload();
  await expect(second.getByText(/Scenariusz jest otwarty do edycji/)).toHaveCount(0);
  await second.getByRole("button", { name: "Resetuj scenariusz", exact: true }).click();
  await second
    .getByRole("alertdialog")
    .getByRole("button", { name: "Resetuj", exact: true })
    .click();
  await expect
    .poll(
      async () =>
        JSON.parse((await second.evaluate((key) => localStorage.getItem(key), STORAGE_KEY))!)
          .activePersonId,
    )
    .toBeNull();
});

test("an external storage change stops the writer without overwriting either scenario", async ({
  page,
  context,
}) => {
  await page.goto("/#/auth/sign-in");
  await page.getByRole("button", { name: "Wejdź jako Anna Kowalska", exact: true }).click();
  const outside = await context.newPage();
  await outside.goto("/#/app/settings");
  const replacement = initialState();
  replacement.activePersonId = "candidate-marek";
  await outside.evaluate(({ key, value }) => localStorage.setItem(key, value), {
    key: STORAGE_KEY,
    value: JSON.stringify(replacement),
  });
  await expect(page.getByRole("status").first()).toContainText("zmienił się poza tą kartą");
  await page.goto("/#/auth/sign-in");
  await page.getByRole("button", { name: "Wejdź jako Anna Kowalska", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("zmienił się poza tą kartą");
  expect(
    JSON.parse((await page.evaluate((key) => localStorage.getItem(key), STORAGE_KEY))!),
  ).toEqual(replacement);
});

test("without Web Locks the scenario remains readable and cannot be reset", async ({ page }) => {
  await page.addInitScript(() => Object.defineProperty(navigator, "locks", { value: undefined }));
  await page.goto("/#/app/settings");
  await expect(page.getByRole("status").first()).toContainText("bezpiecznej blokady zapisu");
  await page.getByRole("button", { name: "Resetuj scenariusz", exact: true }).click();
  await page.getByRole("alertdialog").getByRole("button", { name: "Resetuj", exact: true }).click();
  expect(await page.evaluate((key) => localStorage.getItem(key), STORAGE_KEY)).toBeNull();
  await expect(page.getByText("Przywrócono scenariusz początkowy.", { exact: true })).toHaveCount(
    0,
  );
});

for (const width of [1280, 390, 320]) {
  test(`render failure offers private recovery, keyboard actions and reflow at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    const messages: string[] = [];
    page.on("console", (message) => messages.push(message.text()));
    page.on("pageerror", (error) => messages.push(error.message));
    await page.goto("/#/oferty");
    const saved = JSON.stringify(initialState());
    await page.evaluate(
      ({ key, saved }) => {
        localStorage.setItem(key, saved);
        // Simulate a failing browser API at the render boundary, without a product test hook.
        Object.defineProperty(Intl.DateTimeFormat.prototype, "format", {
          configurable: true,
          get() {
            return () => {
              throw new Error("PRIVATE-ERROR-CONTENT");
            };
          },
        });
      },
      { key: STORAGE_KEY, saved },
    );
    await page.goto("/#/oferty/ai-product-manager");
    await expect(
      page.getByRole("heading", { name: "Nie udało się wyświetlić strony", exact: true }),
    ).toBeVisible();
    const version = await (await page.request.get("/version.json")).json();
    await expect(page.getByLabel("Informacja do zgłoszenia problemu")).toHaveValue(
      `Błąd: APP-RENDER\nWersja: ${version.id}`,
    );
    expect(await page.evaluate((key) => localStorage.getItem(key), STORAGE_KEY)).toBe(saved);
    const download = page.waitForEvent("download");
    await page.getByRole("button", { name: "Pobierz zapis do odzyskania", exact: true }).click();
    expect(await readFile((await (await download).path())!, "utf8")).toBe(saved);
    await page
      .getByRole("button", { name: "Zaznacz informację do skopiowania", exact: true })
      .focus();
    await page.keyboard.press("Enter");
    await expect(page.getByLabel("Informacja do zgłoszenia problemu")).toBeFocused();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
    expect(messages.join("\n")).not.toContain("PRIVATE-ERROR-CONTENT");
    await page.screenshot({ path: `artifacts/publication/recovery-${width}.png`, fullPage: true });
    await page.getByRole("button", { name: "Odśwież stronę", exact: true }).click();
    await expect(
      page.getByRole("heading", { name: "Nie udało się wyświetlić strony", exact: true }),
    ).toHaveCount(0);
  });
}
