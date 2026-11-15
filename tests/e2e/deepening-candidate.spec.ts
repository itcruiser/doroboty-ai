import { expect, test, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { initialState } from "../../src/features/prototype/model";
import { STORAGE_KEY } from "../../src/features/prototype/storage";

const answer =
  "Prowadziłam badania z użytkownikami i wdrożyłam automatyzację. Czas obsługi skrócił się o 30%.";
const aspectTitles = ["Badania z użytkownikami", "Współpraca z inżynierami", "Efekty wdrożenia"];

async function seed(page: Page, draft = false) {
  const state = initialState();
  state.activePersonId = "candidate-anna";
  const job = state.jobs.find((item) => item.slug === "ai-product-manager")!;
  const description =
    "Prowadzisz badania z użytkownikami. Współpracujesz z inżynierami. Mierzysz efekty wdrożenia.";
  Object.assign(job, {
    revision: 3,
    description,
    deepening: {
      enabled: true,
      revision: 2,
      aspects: aspectTitles.map((title, order) => ({
        id: `aspect-${order}`,
        title,
        explanation: `Chcemy poznać Twój wkład: ${title.toLocaleLowerCase("pl")}.`,
        excerpt: description.split(". ")[order].replace(/\.$/, ""),
        author: order ? "employer" : "ai",
        order,
      })),
    },
  });
  if (draft)
    state.drafts.push({
      candidateId: "candidate-anna",
      jobId: job.id,
      answer,
      notes: "Legacy private source notes",
      generated: "Legacy unapproved generation",
    });
  await page.goto("/");
  await page.evaluate(({ key, state }) => localStorage.setItem(key, JSON.stringify(state)), {
    key: STORAGE_KEY,
    state,
  });
  await page.goto(`/#/aplikuj/${job.slug}`);
  await page.reload();
  return job;
}

async function questions(page: Page) {
  const requests: { aspectIds: string[]; revision: { jobRevision: number } }[] = [];
  await page.route("**/api/deepening/questions", async (route) => {
    const body = route.request().postDataJSON();
    requests.push(body);
    await route.fulfill({
      json: {
        questions: body.aspectIds.map((aspectId: string) => ({
          aspectId,
          question:
            aspectId === "aspect-0"
              ? "Jeśli chcesz rozwinąć opis badań, jaką decyzję podjęłaś samodzielnie?"
              : `Pytanie ${requests.length}: jaki był Twój wkład w ${aspectId}?`,
        })),
      },
    });
  });
  return requests;
}

async function enter(page: Page) {
  await page.getByLabel("Dlaczego pasujesz do tej roli?").fill(answer);
  await page.getByRole("checkbox", { name: "Zatwierdzam treść i przesłanie aplikacji" }).check();
  await page.getByRole("button", { name: "Dalej: pogłębienie", exact: true }).click();
}

function aspect(page: Page, index: number) {
  return page.getByRole("region", { name: aspectTitles[index], exact: true });
}

test("entering deepening removes the draft without submitting; refresh starts the whole form again", async ({
  page,
}) => {
  const requests = await questions(page);
  const job = await seed(page, true);
  await expect(page.getByText("2. Pogłębienie", { exact: true })).toBeVisible();
  await expect(page.locator("main")).toContainText(/odświeżenie.*usun/i);
  await enter(page);
  await expect(aspect(page, 0)).toBeVisible();
  const state = await page.evaluate((key) => JSON.parse(localStorage.getItem(key)!), STORAGE_KEY);
  expect(state.drafts.filter((item: { jobId: string }) => item.jobId === job.id)).toEqual([]);
  expect(
    state.applications.filter(
      (item: { candidateId: string }) => item.candidateId === "candidate-anna",
    ),
  ).toEqual([]);
  const outbound = JSON.stringify(requests);
  expect(outbound).not.toContain(answer);
  for (const forbidden of [
    "Anna Kowalska",
    "candidate-anna",
    "Legacy private",
    "Legacy unapproved",
    "Anna Kowalska — Product Manager",
  ])
    expect(outbound).not.toContain(forbidden);
  await aspect(page, 0)
    .getByLabel("Twoja odpowiedź", { exact: true })
    .fill("Moja własna decyzja projektowa.");
  await page.reload();
  await expect(page.getByLabel("Dlaczego pasujesz do tej roli?")).toHaveValue("");
  await expect(aspect(page, 0)).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Wyślij aplikację", exact: true })).toHaveCount(0);
});

test("decided questions survive edits; one immutable application contains final answers, refusal and CV", async ({
  page,
}) => {
  const requests = await questions(page);
  await seed(page);
  await enter(page);
  await expect(aspect(page, 0)).toContainText("Jeśli chcesz rozwinąć");
  await aspect(page, 0)
    .getByLabel("Twoja odpowiedź", { exact: true })
    .fill("Samodzielnie wybrałam nowy przepływ po badaniach.");
  await aspect(page, 1).getByRole("checkbox", { name: "Nie chcę odpowiadać" }).check();
  const original = await aspect(page, 1).textContent();
  await page.getByRole("button", { name: "Wróć do zgłoszenia", exact: true }).click();
  await page
    .getByLabel("Dlaczego pasujesz do tej roli?")
    .fill(`${answer} Prowadziłam testy prototypu.`);
  await page.getByRole("checkbox", { name: "Zatwierdzam treść i przesłanie aplikacji" }).check();
  await page.getByRole("button", { name: "Dalej: pogłębienie", exact: true }).click();
  await expect.poll(() => requests.length).toBe(2);
  expect(requests[1].aspectIds).toEqual(["aspect-2"]);
  await expect(aspect(page, 1)).toHaveText(original!);
  await expect(aspect(page, 0).getByLabel("Twoja odpowiedź", { exact: true })).toHaveValue(
    "Samodzielnie wybrałam nowy przepływ po badaniach.",
  );
  const send = page.getByRole("button", { name: "Wyślij aplikację", exact: true });
  await expect(send).toBeDisabled();
  await aspect(page, 2)
    .getByLabel("Twoja odpowiedź", { exact: true })
    .fill("Czas obsługi skrócił się o 30%.");
  await expect(send).toBeEnabled();
  await send.dblclick();
  await expect(page.getByText("Aplikacja została wysłana.", { exact: false })).toBeVisible();
  const apps = await page.evaluate(
    (key) =>
      JSON.parse(localStorage.getItem(key)!).applications.filter(
        (item: { candidateId: string }) => item.candidateId === "candidate-anna",
      ),
    STORAGE_KEY,
  );
  expect(apps).toHaveLength(1);
  expect(apps[0].deepening).toMatchObject({
    status: "completed",
    revision: { jobRevision: 3, aspectRevision: 2 },
    responses: [
      { aspectId: "aspect-0", refused: false },
      { aspectId: "aspect-1", refused: true, answer: "" },
      { aspectId: "aspect-2", refused: false },
    ],
  });
  await page.getByRole("link", { name: "AI Product Manager", exact: true }).click();
  await expect(page.getByRole("region", { name: "Pogłębienie", exact: true })).toContainText(
    "Nie chcę odpowiadać",
  );
  await expect(
    page.getByRole("button", { name: /Dokończ|Wróć do pogłębienia|Edytuj odpowiedź/ }),
  ).toHaveCount(0);
  await page.goto("/#/auth/sign-in");
  await page.getByRole("button", { name: "Wejdź jako Karolina Wiśniewska", exact: true }).click();
  await page.goto(`/#/app/kandydaci/${apps[0].id}`);
  await page.reload();
  await expect(page.getByRole("region", { name: "Pogłębienie", exact: true })).toContainText(
    "Samodzielnie wybrałam nowy przepływ po badaniach.",
  );
  await expect(
    page.getByRole("region", { name: "Pogłębienie", exact: true }).getByRole("textbox"),
  ).toHaveCount(0);
  await expect(page.getByText("Match Score: 84%", { exact: true })).toBeVisible();
});

test("failed replacement preserves the previous question and decisions", async ({ page }) => {
  await questions(page);
  await seed(page);
  await enter(page);
  const previous = await aspect(page, 2).textContent();
  await page.route("**/api/deepening/questions", (route) =>
    route.fulfill({ status: 503, json: { error: "unavailable" } }),
  );
  await aspect(page, 2)
    .getByRole("button", { name: "Wygeneruj inne pytanie", exact: true })
    .click();
  await expect(page.getByRole("alert")).toBeVisible();
  await expect(aspect(page, 2)).toHaveText(previous!);
  for (let index = 0; index < 3; index++)
    await aspect(page, index).getByRole("checkbox", { name: "Nie chcę odpowiadać" }).check();
  await expect(page.getByRole("button", { name: "Wyślij aplikację", exact: true })).toBeEnabled();
});

test("missing companion and malformed generation recover through one failure-skip submission", async ({
  page,
}) => {
  await page.route("**/api/deepening/questions", (route) => route.abort("connectionfailed"));
  await seed(page);
  await enter(page);
  await expect(page.getByRole("button", { name: "Spróbuj ponownie", exact: true })).toBeVisible();
  await page.route("**/api/deepening/questions", (route) =>
    route.fulfill({
      json: { questions: [{ aspectId: "unknown", question: "Nieprawidłowe pytanie" }] },
    }),
  );
  await page.getByRole("button", { name: "Spróbuj ponownie", exact: true }).click();
  await expect(page.getByText("Nieprawidłowe pytanie", { exact: true })).toHaveCount(0);
  await page.getByRole("button", { name: "Wyślij bez pogłębienia", exact: true }).click();
  await expect(page.getByText("Aplikacja została wysłana.", { exact: false })).toBeVisible();
  const apps = await page.evaluate(
    (key) =>
      JSON.parse(localStorage.getItem(key)!).applications.filter(
        (item: { candidateId: string }) => item.candidateId === "candidate-anna",
      ),
    STORAGE_KEY,
  );
  expect(apps).toHaveLength(1);
  expect(apps[0].deepening).toMatchObject({ status: "skipped", reason: "generation_failed" });
  expect(apps[0].deepening).not.toHaveProperty("responses");
  await page.getByRole("link", { name: "AI Product Manager", exact: true }).click();
  await expect(page.getByRole("region", { name: "Pogłębienie", exact: true })).toContainText(
    /nie udało się|bez pogłębienia/i,
  );
});

test("unsupported identifying answer is blocked before any generation request", async ({
  page,
}) => {
  let calls = 0;
  await page.route("**/api/deepening/questions", (route) => {
    calls++;
    return route.abort();
  });
  await seed(page);
  await page
    .getByLabel("Dlaczego pasujesz do tej roli?")
    .fill("Nazywam się Anna Kowalska. anna@example.test, telefon +48 123 456 789.");
  await page.getByRole("checkbox", { name: "Zatwierdzam treść i przesłanie aplikacji" }).check();
  await page.getByRole("button", { name: "Dalej: pogłębienie", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Wyślij bez pogłębienia", exact: true }),
  ).toBeVisible();
  expect(calls).toBe(0);
});

for (const width of [1280, 390, 320]) {
  test(`focused application and long deepening questions support keyboard and reflow at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 1000 });
    await questions(page);
    await seed(page);
    await enter(page);
    await aspect(page, 0).getByRole("checkbox", { name: "Nie chcę odpowiadać" }).focus();
    await page.keyboard.press("Space");
    await expect(
      aspect(page, 0).getByRole("checkbox", { name: "Nie chcę odpowiadać" }),
    ).toBeChecked();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    const result = await new AxeBuilder({ page }).include(".application-page").analyze();
    expect(result.violations).toEqual([]);
    await page.screenshot({ path: `artifacts/deepening/candidate-${width}.png`, fullPage: true });
  });
}
