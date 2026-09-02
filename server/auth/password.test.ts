import { describe, expect, it } from "vitest";
import { createOpaqueToken, hashOpaqueToken, hashPassword, verifyPassword } from "./password";

describe("password auth helpers", () => {
  it("hashes and verifies a password without storing it in plaintext", async () => {
    const password = "Senha-Segura-123";
    const encoded = await hashPassword(password);

    expect(encoded).not.toContain(password);
    expect(await verifyPassword(password, encoded)).toBe(true);
    expect(await verifyPassword("senha-incorreta", encoded)).toBe(false);
  });

  it("creates opaque reset tokens whose stored hash differs from the token", () => {
    const token = createOpaqueToken();
    const tokenHash = hashOpaqueToken(token);

    expect(token).toHaveLength(64);
    expect(tokenHash).toHaveLength(64);
    expect(tokenHash).not.toBe(token);
  });

  it("rejects passwords shorter than eight characters", async () => {
    await expect(hashPassword("1234567")).rejects.toThrow("8 caracteres");
  });
});
