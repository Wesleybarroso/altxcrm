import { beforeEach, describe, expect, it } from "vitest";
import { decryptWorkspaceSecret, encryptWorkspaceSecret } from "./security/secrets";

describe("workspace Cloudflare secret", () => {
  beforeEach(() => {
    process.env.JWT_SECRET = "test-jwt-secret-for-cloudflare-encryption";
  });

  it("criptografa e recupera a chave sem guardar o valor em claro", () => {
    const apiKey = "cfat_test_key_that_must_not_be_stored_plaintext";
    const encrypted = encryptWorkspaceSecret(apiKey);

    expect(encrypted).not.toContain(apiKey);
    expect(encrypted.split(".")).toHaveLength(4);
    expect(decryptWorkspaceSecret(encrypted)).toBe(apiKey);
  });

  it("rejeita alteração no segredo criptografado", () => {
    const encrypted = encryptWorkspaceSecret("cfat_test_key");
    const parts = encrypted.split(".");
    const ciphertext = parts[3] || "";
    const mutatedCiphertext = `${ciphertext.startsWith("a") ? "b" : "a"}${ciphertext.slice(1)}`;
    const tampered = [parts[0], parts[1], parts[2], mutatedCiphertext].join(".");

    expect(() => decryptWorkspaceSecret(tampered)).toThrow();
  });
});
