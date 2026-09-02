// @vitest-environment happy-dom
import React, { useLayoutEffect } from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it } from "vitest";
import QueryStateNotice from "../components/QueryStateNotice";
import { LanguageProvider, useLanguage, type Language } from "./LanguageContext";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

type LanguageProbeProps = { requestedLanguage?: Language };

function LanguageProbe({ requestedLanguage }: LanguageProbeProps) {
  const { language, setLanguage } = useLanguage();

  useLayoutEffect(() => {
    if (requestedLanguage && requestedLanguage !== language) setLanguage(requestedLanguage);
  }, [language, requestedLanguage, setLanguage]);

  return (
    <div>
      <span data-testid="language">{language}</span>
      <h1>Ajuste o sistema ao <em>seu ritmo.</em></h1>
      <QueryStateNotice isLoading label="configurações" />
    </div>
  );
}

describe("LanguageProvider integration", () => {
  let root: Root | undefined;

  afterEach(async () => {
    await act(async () => {
      root?.unmount();
    });
    root = undefined;
    document.body.innerHTML = "";
    localStorage.clear();
  });

  it("changes and reverses the translated DOM on the same mounted Provider", async () => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);

    const renderProbe = async (requestedLanguage?: Language) => {
      await act(async () => {
        root?.render(<LanguageProvider><LanguageProbe requestedLanguage={requestedLanguage} /></LanguageProvider>);
      });
    };

    await renderProbe();
    expect(container.querySelector('[data-testid="language"]')?.textContent).toBe("pt-BR");
    expect(container.textContent).toContain("Sincronizando configurações…");

    await renderProbe("en");
    expect(container.querySelector('[data-testid="language"]')?.textContent).toBe("en");
    expect(container.textContent).toContain("Tune the system to your rhythm.");
    expect(container.textContent).toContain("Syncing Settings…");

    await renderProbe("es");
    expect(container.querySelector('[data-testid="language"]')?.textContent).toBe("es");
    expect(container.textContent).toContain("Ajusta el sistema a tu ritmo.");
    expect(container.textContent).toContain("Sincronizando Configuración…");

    await renderProbe("pt-BR");
    expect(container.querySelector('[data-testid="language"]')?.textContent).toBe("pt-BR");
    expect(container.textContent).toContain("Ajuste o sistema ao seu ritmo.");
    expect(container.textContent).toContain("Sincronizando configurações…");
  });
});
