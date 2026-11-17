import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { initialState } from "../../src/features/prototype/model";
import { STORAGE_KEY } from "../../src/features/prototype/storage";

for (const width of [1280, 390, 320]) {
  test(`recruiter sees complete deepening snapshots and distinct note sections at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    const state = initialState();
    state.activePersonId = "employer-brightlabs";
    const application = state.applications[0];
    const job = state.jobs.find((item) => item.id === application.jobId)!;
    application.answer =
      "Samodzielnie zintegrowałem system księgowy.\nSprawdziłem spójność danych po wdrożeniu.";
    application.deepening = {
      status: "completed",
      revision: {
        jobId: job.id,
        jobRevision: 1,
        aspectRevision: 1,
        title: job.title,
        summary: job.summary,
        description: job.description,
        aspects: [
          {
            id: "integration",
            title: "Integracja systemów bankowych",
            explanation: "Wyjaśnij własny wkład w zapewnienie spójności i niezawodności danych.",
            author: "employer",
            order: 0,
          },
          {
            id: "tools",
            title: "Narzędzia deweloperskie",
            explanation: "Opisz wybór narzędzi i ich wpływ na sposób pracy zespołu.",
            author: "ai",
            order: 1,
          },
        ],
      },
      responses: [
        {
          aspectId: "integration",
          question: "Jak sprawdziłeś spójność danych pomiędzy systemami?",
          answer: "Przygotowałem testy uzgodnień.\nRozbieżności trafiały do osobnej kolejki.",
          refused: false,
          order: 0,
        },
        {
          aspectId: "tools",
          question: "Które narzędzia wybrałeś samodzielnie?",
          answer: "",
          refused: true,
          order: 1,
        },
      ],
    };
    job.deepening = { enabled: false, revision: 2, aspects: [] };
    application.sourceNotes = "Legacy source must remain hidden";
    application.generatedAnswer = "Legacy generated draft must remain hidden";
    await page.goto("/");
    await page.evaluate(({ key, state }) => localStorage.setItem(key, JSON.stringify(state)), {
      key: STORAGE_KEY,
      state,
    });
    await page.goto(`/#/app/kandydaci/${application.id}`);
    await page.reload();
    const answer = page.getByRole("tabpanel", { name: "Odpowiedź", exact: true });
    await expect(answer).toContainText("Dlaczego pasujesz do tej roli?");
    await expect(answer).toContainText(application.answer);
    const deepening = page.getByRole("region", { name: "Pogłębienie", exact: true });
    for (const aspect of application.deepening.revision.aspects)
      await expect(deepening).toContainText(aspect.explanation);
    await expect(deepening).toContainText("Aspekt 1 z 2");
    await expect(deepening).toContainText("Aspekt 2 z 2");
    await expect(deepening).toContainText(application.deepening.responses[0].question);
    await expect(deepening).toContainText(application.deepening.responses[0].answer);
    await expect(deepening).toContainText("Nie chcę odpowiadać");
    const note = page.getByRole("region", { name: "Notatka rekrutacyjna", exact: true });
    await expect(note).toBeVisible();
    const spacing = await deepening.evaluate((element) => {
      const note = document.querySelector('[aria-labelledby="recruiting-note-heading"]')!;
      const last = element.querySelector(".submitted-deepening-response:last-child p:last-child")!;
      const heading = note.querySelector("h3")!;
      return {
        nestedDividers: Array.from(
          element.parentElement!.closest(".record-sheet")!.querySelectorAll(".record-section"),
        ).some((section) => !!section.querySelector(".record-section")),
        gap: heading.getBoundingClientRect().top - last.getBoundingClientRect().bottom,
        border: getComputedStyle(note).borderTopWidth,
      };
    });
    expect(spacing.nestedDividers).toBe(false);
    expect(spacing.gap).toBeGreaterThanOrEqual(40);
    expect(spacing.border).toBe("1px");
    const input = note.getByRole("textbox");
    await input.fill("Dopytać o uzgodnienia danych podczas rozmowy.");
    await page.getByRole("tab", { name: "CV", exact: true }).click();
    await expect(page.getByRole("tabpanel", { name: "CV", exact: true })).toContainText(
      "CV z momentu aplikowania",
    );
    await expect(input).toHaveValue("Dopytać o uzgodnienia danych podczas rozmowy.");
    await page.getByRole("tab", { name: "Odpowiedź", exact: true }).click();
    await expect(page.locator("main")).not.toContainText("Legacy source");
    await expect(page.locator("main")).not.toContainText("Legacy generated");
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    expect((await new AxeBuilder({ page }).include("main").analyze()).violations).toEqual([]);
    await page.screenshot({
      path: `artifacts/recruiter-record/recruiter-${width}.png`,
      fullPage: true,
    });
    await page.goto("/#/auth/sign-in");
    await page.getByRole("button", { name: "Wejdź jako Marek Nowak", exact: true }).click();
    await page.goto(`/#/app/aplikacje/${application.id}`);
    await expect(page.getByRole("region", { name: "Pogłębienie", exact: true })).toContainText(
      application.deepening.revision.aspects[0].explanation,
    );
    await expect(
      page.getByRole("region", { name: "Notatka rekrutacyjna", exact: true }),
    ).toHaveCount(0);
    await expect(page.locator("main")).not.toContainText(
      "Dopytać o uzgodnienia danych podczas rozmowy.",
    );
  });
}
