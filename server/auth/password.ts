import { createHash, randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(scryptCallback);
const SCRYPT_KEY_LENGTH = 64;
const PASSWORD_PREFIX = "scrypt";

export function assertPasswordStrength(password: string) {
  if (password.length < 8) {
    throw new Error("A senha precisa ter pelo menos 8 caracteres");
  }
  if (password.length > 128) {
    throw new Error("A senha não pode ter mais de 128 caracteres");
  }
}

export async function hashPassword(password: string): Promise<string> {
  assertPasswordStrength(password);
  const salt = randomBytes(16).toString("hex");
  const derivedKey = (await scrypt(password, salt, SCRYPT_KEY_LENGTH)) as Buffer;
  return `${PASSWORD_PREFIX}$${salt}$${derivedKey.toString("hex")}`;
}

export async function verifyPassword(password: string, encodedHash: string | null | undefined): Promise<boolean> {
  if (!encodedHash) return false;
  const [prefix, salt, keyHex] = encodedHash.split("$");
  if (prefix !== PASSWORD_PREFIX || !salt || !keyHex || keyHex.length !== SCRYPT_KEY_LENGTH * 2) {
    return false;
  }

  try {
    const expected = Buffer.from(keyHex, "hex");
    const actual = (await scrypt(password, salt, SCRYPT_KEY_LENGTH)) as Buffer;
    return expected.length === actual.length && timingSafeEqual(expected, actual);
  } catch {
    return false;
  }
}

export function createOpaqueToken() {
  return randomBytes(32).toString("hex");
}

export function hashOpaqueToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}
