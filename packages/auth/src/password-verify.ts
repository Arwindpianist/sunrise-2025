import "server-only"
import { compare } from "bcryptjs"

export function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return compare(plain, hash)
}
