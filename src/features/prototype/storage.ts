import { initialState, stateSchema, transition, type State } from "./model";
export const STORAGE_KEY = "doroboty.prototype.v1";
export const MAX_IMPORT_BYTES = 2_000_000;
export interface StoragePort {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}
export function parseState(raw: string): State {
  if (new TextEncoder().encode(raw).length > MAX_IMPORT_BYTES)
    throw new Error("Plik jest za duży (maksymalnie 2 MB).");
  try {
    const input = JSON.parse(raw);
    if (input?.version === 1) {
      input.version = 2;
      if (Array.isArray(input.jobs))
        input.jobs = input.jobs.map((job: Record<string, unknown>) => ({
          ...job,
          revision: 1,
          deepening: { enabled: false, revision: 0, aspects: [] },
        }));
      if (Array.isArray(input.applications))
        input.applications = input.applications.map((application: Record<string, unknown>) => {
          const legacy = { ...application };
          delete legacy.deepening;
          return legacy;
        });
    }
    return stateSchema.parse(input);
  } catch {
    throw new Error(
      "Nieprawidłowy plik lub nieobsługiwana wersja danych. Dotychczasowy stan pozostaje bez zmian.",
    );
  }
}
export function serializeState(state: State) {
  return JSON.stringify(state, null, 2);
}
/** Old version-2 aspect fields are discarded by the shared object schemas. */
function hasRetiredAspectFields(raw: string): boolean {
  const input = JSON.parse(raw) as {
    jobs: Array<{ deepening?: { aspects?: unknown } }>;
    applications: Array<{ deepening?: { revision?: { aspects?: unknown } } }>;
  };
  return [
    ...input.jobs.map((job) => job.deepening?.aspects),
    ...input.applications.map((application) => application.deepening?.revision?.aspects),
  ].some(
    (aspects) =>
      Array.isArray(aspects) &&
      aspects.some(
        (aspect) => aspect && typeof aspect === "object" && Object.hasOwn(aspect, "excerpt"),
      ),
  );
}
export function readState(storage: StoragePort | null, normalize = true) {
  if (!storage)
    return {
      state: initialState(),
      issue:
        "Zapis w przeglądarce jest niedostępny. Zmiany zachowasz przez eksport w ustawieniach.",
      blocked: false,
      original: null,
    };
  let raw: string | null = null;
  try {
    raw = storage.getItem(STORAGE_KEY);
    const state = raw ? parseState(raw) : initialState();
    let issue = "";
    if (normalize && raw && hasRetiredAspectFields(raw)) {
      try {
        saveState(storage, state);
      } catch (error) {
        issue = (error as Error).message;
      }
    }
    return { state, issue, blocked: false, original: null };
  } catch {
    return {
      state: initialState(),
      issue:
        "Nie udało się odczytać zapisu. Dotychczasowe dane nie zostaną nadpisane. Pobierz je w ustawieniach, a następnie zaimportuj poprawny plik lub zresetuj scenariusz.",
      blocked: true,
      original: raw,
    };
  }
}
export function saveState(storage: StoragePort | null, state: State) {
  if (!storage)
    throw new Error(
      "Zapis w przeglądarce jest niedostępny. Wyeksportuj zmiany przed zamknięciem strony.",
    );
  const raw = serializeState(state);
  if (new TextEncoder().encode(raw).length > MAX_IMPORT_BYTES)
    throw new Error("Dane przekraczają 2 MB. Wyeksportuj je, aby zachować zmiany.");
  try {
    storage.setItem(STORAGE_KEY, raw);
  } catch {
    throw new Error(
      "Nie udało się zapisać zmian w przeglądarce. Wyeksportuj dane przed zamknięciem strony.",
    );
  }
}

/** Return only after any saved draft has been durably removed. */
export function enterDeepeningState(
  storage: StoragePort | null,
  state: State,
  jobId: string,
  options: { blocked?: boolean; persistedDraft?: boolean } = {},
): { state: State; persisted: boolean } {
  if (options.blocked)
    throw new Error(
      "Nie można usunąć szkicu z nieczytelnego zapisu. Pobierz dane w ustawieniach, a następnie zaimportuj poprawny plik lub zresetuj scenariusz.",
    );
  const next = transition(state, { type: "drop_draft", jobId });
  if (!storage) {
    if (options.persistedDraft)
      throw new Error(
        "Nie udało się usunąć zapisanego szkicu. Przywróć dostęp do zapisu lub zresetuj scenariusz w ustawieniach przed przejściem do pogłębienia.",
      );
    return { state: next, persisted: false };
  }
  let persisted: State | null;
  try {
    const raw = storage.getItem(STORAGE_KEY);
    persisted = raw ? parseState(raw) : null;
  } catch {
    throw new Error(
      "Nie można sprawdzić i usunąć zapisanego szkicu. Pobierz dane w ustawieniach, a następnie zaimportuj poprawny plik lub zresetuj scenariusz.",
    );
  }
  if (
    persisted?.drafts.some(
      (draft) => draft.candidateId === state.activePersonId && draft.jobId === jobId,
    )
  ) {
    saveState(storage, next);
    return { state: next, persisted: true };
  }
  return { state: next, persisted: false };
}
