import { Component, useEffect, useRef, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { downloadText } from "./download";
import { STORAGE_KEY } from "./storage";

export class ApplicationErrorBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? <ApplicationRecovery /> : this.props.children;
  }
}

function ApplicationRecovery() {
  const [message, setMessage] = useState("");
  const diagnostic = useRef<HTMLTextAreaElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    heading.current?.focus();
  }, []);
  function exportSave() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw === null) {
        setMessage("W tej przeglądarce nie ma zapisanego scenariusza.");
        return;
      }
      downloadText("doroboty-zapis-do-odzyskania.txt", raw, "text/plain");
      setMessage("Pobrano zapis. Zawiera cały scenariusz i notatki — zachowaj go dla siebie.");
    } catch {
      setMessage(
        "Nie można odczytać zapisu. Nie usuwaj danych witryny; zgłoś problem prowadzącemu.",
      );
    }
  }
  return (
    <main className="prototype-section" aria-labelledby="recovery-title">
      <section className="prototype-panel prototype-form max-w-3xl">
        <h1 id="recovery-title" ref={heading} tabIndex={-1}>
          Nie udało się wyświetlić strony
        </h1>
        <p>
          Zapis w przeglądarce nie został zresetowany. Najpierw pobierz jego kopię, a następnie
          odśwież stronę. Niezapisane zmiany formularza mogą zostać utracone.
        </p>
        <div className="flex flex-wrap gap-3">
          <Button className="max-w-full whitespace-normal" onClick={exportSave}>
            Pobierz zapis do odzyskania
          </Button>
          <Button
            className="max-w-full whitespace-normal"
            variant="outline"
            onClick={() => window.location.reload()}
          >
            Odśwież stronę
          </Button>
        </div>
        <p role="status">{message}</p>
        <label className="field">
          <span>Informacja do zgłoszenia problemu</span>
          <Textarea
            ref={diagnostic}
            readOnly
            rows={3}
            value={`Błąd: APP-RENDER\nWersja: ${__BUILD_ID__}`}
          />
        </label>
        <Button
          className="max-w-full whitespace-normal"
          variant="outline"
          onClick={() => {
            diagnostic.current?.focus();
            diagnostic.current?.select();
          }}
        >
          Zaznacz informację do skopiowania
        </Button>
        <p>
          Przekaż kod i wersję prowadzącemu pokaz, wraz z opisem kroków oraz nazwą przeglądarki. Nie
          dołączaj CV, odpowiedzi, notatek ani pliku zapisu. Informacja powyżej nie zawiera treści
          formularzy ani adresu odwiedzanej strony.
        </p>
      </section>
    </main>
  );
}
