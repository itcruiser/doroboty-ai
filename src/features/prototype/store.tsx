import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { initialState, transition, type Action, type State } from "./model";
import {
  parseState,
  readState,
  saveState,
  enterDeepeningState,
  STORAGE_KEY,
  type StoragePort,
} from "./storage";
function browserStorage(): StoragePort | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}
function useStore() {
  const [loaded] = useState(() => readState(browserStorage(), false));
  const [state, setState] = useState(loaded.state);
  const [issue, setIssue] = useState(loaded.issue);
  const [error, setError] = useState("");
  const [blocked, setBlocked] = useState(loaded.blocked);
  const [original, setOriginal] = useState(loaded.original);
  const [writer, setWriter] = useState<
    "pending" | "ready" | "other-tab" | "unavailable" | "changed"
  >("pending");
  const canWrite = useRef(false);
  const latest = useRef(state);
  const persistedDrafts = useRef(loaded.blocked ? [] : loaded.state.drafts);
  useEffect(() => {
    let disposed = false;
    let release: () => void;
    const held = new Promise<void>((resolve) => {
      release = resolve;
    });
    const changed = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY || event.key === null) {
        canWrite.current = false;
        setWriter("changed");
      }
    };
    window.addEventListener("storage", changed);
    const unavailable = () => {
      if (!disposed) setWriter("unavailable");
    };
    if (!navigator.locks) {
      // Persistence stays read-only when an exclusive writer cannot be established.
      void Promise.resolve().then(unavailable);
    } else {
      void navigator.locks
        .request(`${STORAGE_KEY}.writer`, { ifAvailable: true }, async (lock) => {
          if (disposed) return;
          if (!lock) {
            setWriter("other-tab");
            return;
          }
          // Reload after acquiring the lock: another tab may have written during startup.
          const current = readState(browserStorage());
          latest.current = current.state;
          persistedDrafts.current = current.blocked ? [] : current.state.drafts;
          setState(current.state);
          setIssue(current.issue);
          setBlocked(current.blocked);
          setOriginal(current.original);
          canWrite.current = true;
          setWriter("ready");
          await held;
        })
        .catch(unavailable);
    }
    return () => {
      disposed = true;
      canWrite.current = false;
      release!();
      window.removeEventListener("storage", changed);
    };
  }, []);
  const writerIssue =
    writer === "ready"
      ? ""
      : writer === "pending"
        ? "Sprawdzamy dostęp do zapisu scenariusza."
        : writer === "other-tab"
          ? "Scenariusz jest otwarty do edycji w innej karcie. Tutaj możesz go przeglądać i eksportować. Zamknij tamtą kartę, a następnie odśwież tę stronę."
          : writer === "changed"
            ? "Zapis scenariusza zmienił się poza tą kartą. Wstrzymaliśmy edycję, aby go nie nadpisać. Wyeksportuj bieżący widok, a następnie odśwież stronę."
            : "Ta przeglądarka nie udostępnia bezpiecznej blokady zapisu. Możesz przeglądać i eksportować scenariusz. Otwórz stronę przez HTTPS w aktualnej przeglądarce, aby edytować.";
  function writable() {
    if (canWrite.current) return true;
    setError(writerIssue);
    return false;
  }
  function commit(next: State, replace = false) {
    latest.current = next;
    setState(next);
    setError("");
    if (blocked && !replace) return;
    try {
      saveState(browserStorage(), next);
      persistedDrafts.current = next.drafts;
      setIssue("");
      if (replace) setBlocked(false);
    } catch (e) {
      setIssue((e as Error).message);
    }
  }
  function run(action: Action) {
    if (!writable()) return false;
    try {
      commit(transition(latest.current, action));
      return true;
    } catch (e) {
      setError(
        e instanceof Error && e.name !== "ZodError"
          ? e.message
          : "Sprawdź poprawność i długość wprowadzonych danych.",
      );
      return false;
    }
  }
  function enterDeepening(jobId: string) {
    if (!writable()) return false;
    try {
      const result = enterDeepeningState(browserStorage(), latest.current, jobId, {
        blocked,
        persistedDraft: persistedDrafts.current.some(
          (draft) => draft.candidateId === latest.current.activePersonId && draft.jobId === jobId,
        ),
      });
      latest.current = result.state;
      setState(result.state);
      setError("");
      if (result.persisted) {
        persistedDrafts.current = result.state.drafts;
        setIssue("");
      } else
        persistedDrafts.current = persistedDrafts.current.filter(
          (draft) =>
            !(draft.candidateId === latest.current.activePersonId && draft.jobId === jobId),
        );
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Nie udało się usunąć zapisanego szkicu.");
      return false;
    }
  }
  function importState(raw: string) {
    if (!writable()) return false;
    try {
      const next = parseState(raw);
      commit(next, true);
      return true;
    } catch (e) {
      setError((e as Error).message);
      return false;
    }
  }
  useEffect(() => {
    document.documentElement.classList.remove("dark");
  }, []);
  return {
    state,
    issue: writerIssue || issue,
    error,
    blocked,
    original,
    run,
    enterDeepening,
    importState,
    clearError: () => setError(""),
    reset: () => {
      if (!writable()) return false;
      commit(initialState(), true);
      return true;
    },
  };
}
type Store = ReturnType<typeof useStore>;
const Context = createContext<Store | null>(null);
export function PrototypeProvider({ children }: { children: ReactNode }) {
  const store = useStore();
  return <Context.Provider value={store}>{children}</Context.Provider>;
}
export function usePrototype() {
  const store = useContext(Context);
  if (!store) throw new Error("PrototypeProvider is required");
  return store;
}
