import "server-only"

import type { Session } from "next-auth"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { DASHBOARD_ADMIN_EMAIL } from "@/lib/dashboard-admin-constants"

export { DASHBOARD_ADMIN_EMAIL }

export async function requireDashboardAdmin(): Promise<
  | { ok: true; session: Session }
  | { ok: false; status: 401 | 403; error: string }
> {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return { ok: false, status: 401, error: "Unauthorized" }
  }
  if (session.user.email !== DASHBOARD_ADMIN_EMAIL) {
    return { ok: false, status: 403, error: "Forbidden" }
  }
  return { ok: true, session }
}
