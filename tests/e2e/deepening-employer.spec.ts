import { test, expect, type Page } from "@playwright/test";
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
  const dialog = page.getByRole("dialog", { name: "Tryb pogłębienia", exact: true });
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
  await dialog.getByRole("button", { name: "Włącz pogłębienie", exact: true }).click();
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
  await page.getByRole("button", { name: "Konfiguruj pogłębienie", exact: true }).click();
  await dialog.getByRole("button", { name: "Przesuń aspekt 1 w dół", exact: true }).click();
  await dialog.getByRole("button", { name: "Zapisz pogłębienie", exact: true }).click();
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
  await page.getByRole("button", { name: "Dalej: treść oferty", exact: true }).click();
  await page.getByRole("button", { name: "Dalej: warunki", exact: true }).click();
  await page.getByRole("button", { name: "Dalej: zatwierdzenie", exact: true }).click();
  await page.getByRole("checkbox", { name: "Zatwierdzam treść oferty" }).check();
  await page.getByRole("button", { name: "Zapisz i opublikuj zmiany", exact: true }).click();
  await expect(dialog).not.toBeVisible();
  await expect(
    page.getByRole("link", { name: "Projektant automatyzacji", exact: true }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Projektant automatyzacji", exact: true }).click();
  await page.getByRole("button", { name: "Konfiguruj pogłębienie", exact: true }).click();
  await dialog.getByRole("button", { name: "Wyłącz pogłębienie", exact: true }).click();
  await expect(page.getByText("Tryb pogłębienia: wyłączony.", { exact: false })).toBeVisible();
});

test("generation failure and invalid excerpts leave manual recovery available on mobile and close preserves publication", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 760 });
  await page.route("**/api/deepening/aspects", (route) =>
    route.fulfill({ status: 503, contentType: "application/json", body: "{}" }),
  );
  await newPublication(page);
  const dialog = page.getByRole("dialog", { name: "Tryb pogłębienia", exact: true });
  await dialog.getByRole("button", { name: "Zaproponuj aspekty z AI", exact: true }).click();
  await expect(dialog.getByRole("alert")).toContainText("Oferta pozostaje opublikowana");
  await dialog.getByRole("button", { name: "Dodaj aspekt ręcznie", exact: true }).click();
  await dialog
    .getByLabel("Nazwa aspektu 1", { exact: true })
    .fill("Bardzo długi tytuł aspektu dotyczącego decyzji podczas wdrażania automatyzacji");
  await dialog
    .getByLabel("Wyjaśnienie aspektu 1", { exact: true })
    .fill("Opisz własny wkład we wdrożenie rozwiązania.");
  await dialog
    .getByLabel("Fragment oferty dla aspektu 1", { exact: true })
    .fill("Fragment spoza publicznej oferty.");
  await dialog.getByRole("button", { name: "Włącz pogłębienie", exact: true }).click();
  await expect(
    dialog.getByText("Każdy aspekt musi zawierać dokładny", { exact: false }),
  ).toBeVisible();
  await expect(
    dialog.getByText("Każdy aspekt musi zawierać dokładny", { exact: false }),
  ).toBeFocused();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: "artifacts/deepening-employer-mobile-error.png", fullPage: true });
  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
  await page.getByRole("link", { name: "Projektant automatyzacji", exact: true }).click();
  const trigger = page.getByRole("button", { name: "Konfiguruj pogłębienie", exact: true });
  await trigger.click();
  await page.keyboard.press("Escape");
  await expect(trigger).toBeFocused();
  await expect(page.getByText("Tryb pogłębienia: wyłączony.", { exact: false })).toBeVisible();
});

for (const publicationStatus of ["draft", "review", "published", "hidden", "archived"] as const) {
  test(`existing ${publicationStatus} job prompts only on first publication and stays published after skip`, async ({
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
    await page.getByRole("button", { name: "Dalej: zatwierdzenie", exact: true }).click();
    await page.getByRole("checkbox", { name: "Zatwierdzam treść oferty" }).check();
    await page.getByRole("button", { name: "Zapisz i opublikuj zmiany", exact: true }).click();
    const dialog = page.getByRole("dialog", { name: "Tryb pogłębienia", exact: true });
    if (publicationStatus === "draft" || publicationStatus === "review") {
      await expect(dialog).toBeVisible();
      await expect(
        dialog.getByText("Oferta jest już opublikowana.", { exact: true }),
      ).toBeVisible();
      await dialog.getByRole("button", { name: "Pomiń", exact: true }).click();
    } else {
      await expect(dialog).not.toBeVisible();
    }
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
