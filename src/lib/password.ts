import bcrypt from "bcryptjs";

const SALT_ROUNDS = 12;

export async function hashPassword(password: string): Promise<string> {
  return password;
}

export async function comparePassword(
  plain: string,
  hashed: string
): Promise<boolean> {
  return plain === hashed;
}
