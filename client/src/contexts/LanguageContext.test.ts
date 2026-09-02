import { describe, expect, it } from "vitest";
import { translateValue } from "./LanguageContext";

describe("LanguageContext", () => {
  it("translates shared navigation and authentication labels", () => {
    expect(translateValue("en", "Configurações")).toBe("Settings");
    expect(translateValue("es", "Caixa de entrada")).toBe("Bandeja de entrada");
    expect(translateValue("pt-BR", "Configurações")).toBe("Configurações");
  });

  it("translates the settings page strings in every supported language", () => {
    expect(translateValue("en", "Sistema / configurações")).toBe("System / settings");
    expect(translateValue("en", "Ajuste o sistema ao")).toBe("Tune the system to");
    expect(translateValue("en", "seu ritmo.")).toBe("your rhythm.");
    expect(translateValue("en", "01 / Capacidade")).toBe("01 / Capacity");
    expect(translateValue("en", "Não configurado")).toBe("Not configured");
    expect(translateValue("en", "Sincronizando")).toBe("Syncing");
    expect(translateValue("en", "Não foi possível carregar")).toBe("Could not load");
    expect(translateValue("en", "Nome do ambiente conectado")).toBe("Connected environment name");
    expect(translateValue("es", "Sistema / configurações")).toBe("Sistema / configuración");
    expect(translateValue("es", "02 / Segurança")).toBe("02 / Seguridad");
    expect(translateValue("es", "Verificar conexão")).toBe("Verificar conexión");
    expect(translateValue("es", "Sincronizando")).toBe("Sincronizando");
    expect(translateValue("es", "Não foi possível carregar")).toBe("No se pudo cargar");
  });

  it("keeps dynamic or unknown values unchanged", () => {
    expect(translateValue("en", "cliente@altx.io")).toBe("cliente@altx.io");
  });
});
