/** Finite vocabulary: no captured substring or user-controlled text can leave this module. */
export const professionalFacts = {
  user_research: "Kandydat deklaruje prowadzenie badań z użytkownikami.",
  automation_delivery: "Kandydat deklaruje wdrożenie automatyzacji.",
  service_time_reduction: "Kandydat deklaruje skrócenie czasu obsługi.",
  prototype_testing: "Kandydat deklaruje prowadzenie testów prototypu.",
  engineering_collaboration: "Kandydat deklaruje współpracę z inżynierami.",
  product_management: "Kandydat deklaruje zarządzanie produktem.",
  data_analysis: "Kandydat deklaruje analizowanie danych.",
  project_delivery: "Kandydat deklaruje prowadzenie projektów.",
  frontend_development: "Kandydat deklaruje tworzenie interfejsów w React.",
} as const;
export type ProfessionalFact = keyof typeof professionalFacts;

const clauses: Readonly<Record<string, readonly ProfessionalFact[]>> = {
  "prowadziłam badania z użytkownikami": ["user_research"],
  "prowadziłem badania z użytkownikami": ["user_research"],
  "wdrożyłam automatyzację": ["automation_delivery"],
  "wdrożyłem automatyzację": ["automation_delivery"],
  "prowadziłam badania z użytkownikami i wdrożyłam automatyzację": [
    "user_research",
    "automation_delivery",
  ],
  "prowadziłem badania z użytkownikami i wdrożyłem automatyzację": [
    "user_research",
    "automation_delivery",
  ],
  "czas obsługi skrócił się o 30%": ["service_time_reduction"],
  "skróciłam czas obsługi": ["service_time_reduction"],
  "skróciłem czas obsługi": ["service_time_reduction"],
  "prowadziłam testy prototypu": ["prototype_testing"],
  "prowadziłem testy prototypu": ["prototype_testing"],
  "współpracowałam z inżynierami": ["engineering_collaboration"],
  "współpracowałem z inżynierami": ["engineering_collaboration"],
  "zarządzałam produktem": ["product_management"],
  "zarządzałem produktem": ["product_management"],
  "analizowałam dane": ["data_analysis"],
  "analizowałem dane": ["data_analysis"],
  "prowadziłam projekty": ["project_delivery"],
  "prowadziłem projekty": ["project_delivery"],
  "tworzyłam interfejsy w react": ["frontend_development"],
  "tworzyłem interfejsy w react": ["frontend_development"],
};

// A standalone affirmative clause is required. Keywords, quotations, uncertainty and
// negation never count as evidence. This conservative synthetic-only vocabulary can
// omit valid experience; users retain retry/skip and their original editable answer.
const uncertainty =
  /\b(?:nie|bez|not|never|no|maybe|perhaps|if|czy|chyba|gdyby|jeśli|jesli|może|moze|chcę|chce|planuję|planuje|zamierzam)\b|[?"„”«»]/iu;
export function prepareProfessionalFacts(
  text: string,
  source: "answer" | "cv",
): ProfessionalFact[] {
  if (!text.trim() || text.length > 12000 || uncertainty.test(text)) return [];
  const parts = text
    .normalize("NFC")
    .toLocaleLowerCase("pl")
    .split(/[.!;\n]+/u)
    .map((part) => part.trim().replace(/\s+/gu, " "))
    .filter(Boolean);
  // CV is omitted completely if any clause cannot be positively recognized.
  if (source === "cv" && parts.some((part) => !Object.hasOwn(clauses, part))) return [];
  return [...new Set(parts.flatMap((part) => (Object.hasOwn(clauses, part) ? clauses[part] : [])))];
}
