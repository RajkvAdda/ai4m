export const ADMIN_EMAILS = new Set([
  "kumarshivaray@gmail.com",
  "naveenbgowda@gmail.com",
  "raj@gmail.com",
]);

export function isAdminUser(user?: {
  email?: string | null;
  role?: string | null;
}) {
  if (!user) return false;

  const role = user.role?.trim().toLowerCase();
  if (role === "admin") return true;

  const email = user.email?.trim().toLowerCase();
  return email ? ADMIN_EMAILS.has(email) : false;
}
