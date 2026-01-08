// Admin configuration
// To add multiple admins, add emails to this array
export const ADMIN_EMAILS = [
  process.env.ADMIN_EMAIL || "goldbenchan@gmail.com",
];

export function isAdmin(email?: string | null): boolean {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email);
}
