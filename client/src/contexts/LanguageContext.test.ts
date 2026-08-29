import { describe, expect, it } from "vitest";
import { translateValue } from "./LanguageContext";

describe("LanguageContext", () => {
  it("translates shared navigation and authentication labels", () => {
    expect(translateValue("en", "Configurações")).toBe("Settings");
    expect(translateValue("es", "Caixa de entrada")).toBe("Bandeja de entrada");
    expect(translateValue("pt-BR", "Configurações")).toBe("Configurações");
  });

  it("keeps dynamic or unknown values unchanged", () => {
    expect(translateValue("en", "cliente@altx.io")).toBe("cliente@altx.io");
  });
});
