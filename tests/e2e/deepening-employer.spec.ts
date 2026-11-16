import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { initialState } from "../../src/features/prototype/model";
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
  await page.getByRole("button", { name: "Dalej: pogłębienie", exact: true }).click();
}

async function publish(page: Page, existing = false) {
  await page.getByRole("button", { name: "Dalej: zatwierdzenie", exact: true }).click();
  await page.getByRole("checkbox", { name: "Zatwierdzam treść oferty" }).check();
  await page
    .getByRole("button", {
      name: existing ? "Zapisz i opublikuj zmiany" : "Opublikuj ofertę",
      exact: true,
    })
    .click();
}
async function editDeepening(page: Page) {
  for (const name of ["Dalej: treść oferty", "Dalej: warunki", "Dalej: pogłębienie"])
    await page.getByRole("button", { name, exact: true }).click();
}

test("deepening is the fourth inline step and publication without it preserves all approved fields", async ({
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
  await expect(page.getByRole("heading", { name: "Pogłębienie", exact: true })).toBeFocused();
  await expect(
    page.getByRole("list", { name: "Etapy tworzenia oferty" }).getByRole("listitem"),
  ).toHaveText(["1Kogo szukasz", "2Treść oferty", "3Warunki", "4Pogłębienie", "5Zatwierdzenie"]);
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.getByRole("checkbox", { name: "Włącz pogłębienie" })).not.toBeChecked();
  expect(
    await page.evaluate(
      (key) =>
        JSON.parse(localStorage.getItem(key)!).jobs.some(
          (job: { title: string }) => job.title === "Projektant automatyzacji",
        ),
      STORAGE_KEY,
    ),
  ).toBe(false);
  await publish(page);
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.getByRole("link", { name: "Projektant automatyzacji", exact: true }).click();
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

test("approved AI and manual aspects keep author, excerpt and order through later configuration and ordinary edits", async ({
  page,
}) => {
  const requests: unknown[] = [];
  await page.route("**/api/deepening/aspects", async (route) => {
    requests.push(route.request().postDataJSON());
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        aspects: [
          {
            title: "Badania",
            explanation: "Poznaj wkład kandydata w badania.",
            excerpt: "Prowadzenie badań użytkowników.",
          },
          {
            title: "Automatyzacja",
            explanation: "Poznaj doświadczenie we wdrożeniach.",
            excerpt: "Projektowanie i wdrażanie automatyzacji obsługi klientów.",
          },
        ],
      }),
    });
  });
  await newPublication(page);
  await page.getByRole("checkbox", { name: "Włącz pogłębienie" }).check();
  const dialog = page.getByRole("region", { name: "Konfiguracja pogłębienia", exact: true });
  await dialog.getByRole("button", { name: "Zaproponuj aspekty z AI", exact: true }).click();
  await expect(dialog.getByRole("region", { name: "Propozycje AI", exact: true })).toBeVisible();
  await expect(
    dialog.getByRole("region", { name: "Zatwierdzone aspekty", exact: true }),
  ).toContainText("Nie wybrano aspektów");
  expect(requests).toEqual([
    {
      title: "Projektant automatyzacji",
      summary: "Badania potrzeb i automatyzacja obsługi klientów.",
      description:
        "Prowadzenie badań użytkowników. Projektowanie i wdrażanie automatyzacji obsługi klientów.",
    },
  ]);
  await dialog.getByRole("button", { name: "Akceptuj propozycję 1", exact: true }).click();
  await dialog.getByLabel("Nazwa aspektu 1", { exact: true }).fill("Badania — własny wkład");
  await dialog.getByRole("button", { name: "Akceptuj propozycję 1", exact: true }).click();
  await dialog.getByRole("button", { name: "Dodaj aspekt ręcznie", exact: true }).click();
  await dialog.getByLabel("Nazwa aspektu 3", { exact: true }).fill("Zakres pracy");
  await dialog
    .getByLabel("Wyjaśnienie aspektu 3", { exact: true })
    .fill("Opisz samodzielny zakres pracy.");
  await dialog
    .getByLabel("Fragment oferty dla aspektu 3", { exact: true })
    .fill("Badania potrzeb i automatyzacja obsługi klientów.");
  await dialog.getByRole("button", { name: "Przesuń aspekt 3 w górę", exact: true }).click();
  await dialog.getByRole("button", { name: "Przesuń aspekt 2 w górę", exact: true }).click();
  await dialog.getByRole("button", { name: "Dodaj aspekt ręcznie", exact: true }).click();
  await expect(dialog.getByRole("alert")).toContainText("maksymalnie 3 aspekty");
  await publish(page);
  await page.getByRole("link", { name: "Projektant automatyzacji", exact: true }).click();
  const original = await page.evaluate(
    (key) =>
      JSON.parse(localStorage.getItem(key)!).jobs.find(
        (job: { title: string }) => job.title === "Projektant automatyzacji",
      ).deepening,
    STORAGE_KEY,
  );
  expect(original).toMatchObject({
    enabled: true,
    revision: 1,
    aspects: [
      {
        title: "Zakres pracy",
        author: "employer",
        order: 0,
        excerpt: "Badania potrzeb i automatyzacja obsługi klientów.",
      },
      {
        title: "Badania — własny wkład",
        author: "employer",
        order: 1,
        excerpt: "Prowadzenie badań użytkowników.",
      },
      {
        title: "Automatyzacja",
        author: "ai",
        order: 2,
        excerpt: "Projektowanie i wdrażanie automatyzacji obsługi klientów.",
      },
    ],
  });
  await editDeepening(page);
  await dialog.getByRole("button", { name: "Przesuń aspekt 1 w dół", exact: true }).click();
  expect(
    await page.evaluate(
      (key) =>
        JSON.parse(localStorage.getItem(key)!).jobs.find(
          (job: { title: string }) => job.title === "Projektant automatyzacji",
        ).deepening,
      STORAGE_KEY,
    ),
  ).toEqual(original);
  await publish(page, true);
  const revised = await page.evaluate(
    (key) =>
      JSON.parse(localStorage.getItem(key)!).jobs.find(
        (job: { title: string }) => job.title === "Projektant automatyzacji",
      ).deepening,
    STORAGE_KEY,
  );
  expect(revised.revision).toBe(2);
  expect(revised.aspects.map((aspect: { id: string }) => aspect.id)).toEqual([
    original.aspects[1].id,
    original.aspects[0].id,
    original.aspects[2].id,
  ]);
  await page.getByRole("link", { name: "Projektant automatyzacji", exact: true }).click();
  await editDeepening(page);
  await publish(page, true);
  await expect(dialog).not.toBeVisible();
  await expect(
    page.getByRole("link", { name: "Projektant automatyzacji", exact: true }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Projektant automatyzacji", exact: true }).click();
  await editDeepening(page);
  await dialog.getByRole("checkbox", { name: "Włącz pogłębienie" }).uncheck();
  await publish(page, true);
});

for (const width of [1280, 390, 320]) {
  test(`inline deepening retains edits, validates excerpts and recovers from unavailable AI at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.route("**/api/deepening/aspects", (route) =>
      route.fulfill({ status: 503, json: {} }),
    );
    await newPublication(page);
    const section = page.getByRole("region", { name: "Konfiguracja pogłębienia", exact: true });
    const toggle = section.getByRole("checkbox", { name: "Włącz pogłębienie" });
    await toggle.focus();
    await page.keyboard.press("Space");
    await section.getByRole("button", { name: "Zaproponuj aspekty z AI", exact: true }).click();
    await expect(section.getByRole("alert")).toContainText("dodaj aspekt ręcznie");
    await section.getByRole("button", { name: "Dodaj aspekt ręcznie", exact: true }).click();
    const longTitle =
      "Bardzo długi tytuł aspektu dotyczącego decyzji podczas wdrażania automatyzacji";
    await section.getByLabel("Nazwa aspektu 1", { exact: true }).fill(longTitle);
    await section
      .getByLabel("Wyjaśnienie aspektu 1", { exact: true })
      .fill("Opisz własny wkład we wdrożenie rozwiązania.");
    const excerpt = section.getByLabel("Fragment oferty dla aspektu 1", { exact: true });
    await excerpt.fill("Fragment spoza publicznej oferty.");
    await page.getByRole("button", { name: "Dalej: zatwierdzenie", exact: true }).click();
    const error = page.getByText("Każdy aspekt musi zawierać dokładny", { exact: false });
    await expect(error).toBeFocused();
    await expect(page.getByRole("dialog")).toHaveCount(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    await excerpt.fill("Prowadzenie badań użytkowników.");
    await page.getByRole("button", { name: "Wstecz", exact: true }).click();
    await page.getByRole("button", { name: "Dalej: pogłębienie", exact: true }).click();
    await expect(section.getByLabel("Nazwa aspektu 1", { exact: true })).toHaveValue(longTitle);
    await expect(excerpt).toHaveValue("Prowadzenie badań użytkowników.");
    expect(
      (await new AxeBuilder({ page }).include(".employer-editor").analyze()).violations,
    ).toEqual([]);
    await page.screenshot({
      path: `artifacts/deepening-inline/employer-${width}.png`,
      fullPage: true,
    });
    await page.getByRole("button", { name: "Dalej: zatwierdzenie", exact: true }).click();
    await expect(
      page.getByRole("region", { name: "Podgląd pogłębienia", exact: true }),
    ).toContainText(longTitle);
    // Returning to public content and removing a citation must require correction before approval.
    for (let i = 0; i < 3; i++)
      await page.getByRole("button", { name: "Wstecz", exact: true }).click();
    await page
      .getByLabel("Opis oferty", { exact: true })
      .fill("Całkowicie zmieniona treść oferty dotycząca projektowania automatyzacji.");
    await page.getByRole("button", { name: "Dalej: warunki", exact: true }).click();
    await page.getByRole("button", { name: "Dalej: pogłębienie", exact: true }).click();
    await page.getByRole("button", { name: "Dalej: zatwierdzenie", exact: true }).click();
    await expect(error).toBeFocused();
    await toggle.uncheck();
    await publish(page);
    await expect(
      page.getByRole("link", { name: "Projektant automatyzacji", exact: true }),
    ).toBeVisible();
    await expect(page.getByRole("dialog")).toHaveCount(0);
  });
}

for (const publicationStatus of ["draft", "review", "published", "hidden", "archived"] as const) {
  test(`existing ${publicationStatus} job uses the inline step and publishes without a popup`, async ({
    page,
  }) => {
    const state = initialState();
    const employer = state.people.find((person) => person.role === "employer")!;
    state.activePersonId = employer.id;
    const job = state.jobs.find((item) => item.companyId === employer.companyId)!;
    job.publicationStatus = publicationStatus;
    await page.goto("/");
    await page.evaluate(({ key, state }) => localStorage.setItem(key, JSON.stringify(state)), {
      key: STORAGE_KEY,
      state,
    });
    await page.goto(`/#/app/oferty/${job.id}`);
    await page.reload();
    await page.getByRole("button", { name: "Dalej: treść oferty", exact: true }).click();
    await page.getByRole("button", { name: "Dalej: warunki", exact: true }).click();
    await page.getByRole("button", { name: "Dalej: pogłębienie", exact: true }).click();
    await page.getByRole("button", { name: "Dalej: zatwierdzenie", exact: true }).click();
    await page.getByRole("checkbox", { name: "Zatwierdzam treść oferty" }).check();
    await page.getByRole("button", { name: "Zapisz i opublikuj zmiany", exact: true }).click();
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await expect(page.getByRole("link", { name: job.title, exact: true })).toBeVisible();
    await page.goto(`/#/oferty/${job.slug}`);
    await expect(
      page.getByRole("heading", { name: job.title, level: 1, exact: true }),
    ).toBeVisible();
    const saved = await page.evaluate(
      ({ key, id }) =>
        JSON.parse(localStorage.getItem(key)!).jobs.find((item: { id: string }) => item.id === id),
      { key: STORAGE_KEY, id: job.id },
    );
    expect(saved).toMatchObject({ publicationStatus: "published", deepening: { enabled: false } });
  });
}
