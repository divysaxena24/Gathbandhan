/**
 * Admin Whitelist Configuration
 *
 * Strict access control: Only authorized administrator emails are permitted
 * to enter the Gathbandhan Operations Admin Workspace.
 */

export const PRIMARY_ADMIN_EMAIL = "karankmt2006@gmail.com";

/**
 * Returns the list of emails authorized to access the admin portal.
 */
export function getAuthorizedAdminEmails(): string[] {
  const list = [PRIMARY_ADMIN_EMAIL.toLowerCase()];

  if (process.env.ADMIN_EMAIL) {
    const customAdmins = process.env.ADMIN_EMAIL.split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);
    for (const email of customAdmins) {
      if (!list.includes(email)) {
        list.push(email);
      }
    }
  }

  return list;
}

/**
 * Checks whether the given email address has administrator privileges.
 */
export function isAuthorizedAdminEmail(email?: string | null): boolean {
  if (!email || typeof email !== "string") return false;
  const cleanEmail = email.trim().toLowerCase();
  const authorized = getAuthorizedAdminEmails();
  return authorized.includes(cleanEmail);
}
