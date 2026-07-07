import crypto from "crypto";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.SESSION_SECRET;
if (!JWT_SECRET) {
  throw new Error("SESSION_SECRET environment variable is required but was not set.");
}
// After the guard above JWT_SECRET is always a string at runtime.
const SECRET: string = JWT_SECRET;
const SALT_BYTES = 16;
const KEY_LEN = 64;

export function hashPassword(password: string): { hash: string; salt: string } {
  const salt = crypto.randomBytes(SALT_BYTES).toString("hex");
  const hash = crypto.scryptSync(password, salt, KEY_LEN).toString("hex");
  return { hash, salt };
}

export function verifyPassword(
  password: string,
  hash: string,
  salt: string,
): boolean {
  try {
    const derived = crypto.scryptSync(password, salt, KEY_LEN).toString("hex");
    return crypto.timingSafeEqual(
      Buffer.from(derived, "hex"),
      Buffer.from(hash, "hex"),
    );
  } catch {
    return false;
  }
}

export interface TokenPayload {
  userId: string;
  username: string;
}

export function signToken(userId: string, username: string): string {
  return jwt.sign({ userId, username } satisfies TokenPayload, SECRET, {
    expiresIn: "30d",
  });
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, SECRET) as unknown as TokenPayload;
  } catch {
    return null;
  }
}
