import { test, expect, type Page } from "@playwright/test";
import { STORAGE_KEY } from "../../src/features/prototype/storage";

async function newPublication(page: Page) {
  await page.goto("/#/auth/sign-in");
  await page.getByRole("button", { name: "Wejdź jako Karolina Wiśniewska", exact: true }).click();
  await page.goto("/#/app/oferty/nowa");
  await page.getByLabel("Nazwa stanowiska").fill("Projektant automatyzacji");
  await page
    .getByLabel("Brief — kogo szukasz i do jakiego zadania?")
    .fill("PRYWATNY brief o badaniach i automatyzacji obsługi klientów.");
  await page.getByRole("button", { name: "Przygotuj opis z AI", exact: true }).click();
  await page.getByRole("button", { name: "Użyj propozycji", exact: true }).click();
  await page.getByRole("button", { name: "Dalej: treść oferty", exact: true }).click();
  await page
    .getByLabel("Krótkie podsumowanie")
    .fill("Badania potrzeb i automatyzacja obsługi klientów.");
  await page
    .getByLabel("Opis oferty", { exact: true })
    .fill(
      "Prowadzenie badań użytkowników. Projektowanie i wdrażanie automatyzacji obsługi klientów.",
    );
  await page.getByRole("button", { name: "Dalej: warunki", exact: true }).click();
  await page.getByLabel("Wynagrodzenie od (PLN brutto / mies.)").fill("12000");
  await page.getByLabel("Wynagrodzenie do (PLN brutto / mies.)").fill("16000");
  await page.getByRole("button", { name: "Dalej: zatwierdzenie", exact: true }).click();
  await page.getByRole("checkbox", { name: "Zatwierdzam treść oferty" }).check();
  await page.getByRole("button", { name: "Opublikuj ofertę", exact: true }).click();
}

test("a staged publication opens deepening once and skipping preserves its complete approved fields", async ({
  page,
}) => {
  await page.route("**/api/deepening/aspects", (route) =>
    route.fulfill({
      status: 503,
      contentType: "application/json",
      body: JSON.stringify({ error: "unavailable" }),
    }),
  );
  await newPublication(page);
  const dialog = page.getByRole("dialog", { name: "Tryb pogłębienia", exact: true });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByText("Oferta jest już opublikowana.", { exact: true })).toBeVisible();
  await dialog.getByRole("button", { name: "Pomiń", exact: true }).click();
  await page.getByRole("link", { name: "Projektant automatyzacji", exact: true }).click();
  await expect(dialog).not.toBeVisible();
  await expect(page.getByLabel("Nazwa stanowiska")).toHaveValue("Projektant automatyzacji");
  const job = await page.evaluate(
    (key) =>
      JSON.parse(localStorage.getItem(key)!).jobs.find(
        (job: { title: string }) => job.title === "Projektant automatyzacji",
      ),
    STORAGE_KEY,
  );
  expect(job).toMatchObject({
    publicationStatus: "published",
    salaryMin: 12000,
    salaryMax: 16000,
    sourceBrief: "PRYWATNY brief o badaniach i automatyzacji obsługi klientów.",
    deepening: { enabled: false },
  });
});
