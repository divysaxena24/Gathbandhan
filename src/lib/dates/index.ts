import { isPast, parseISO } from "date-fns";
import { formatDistanceToNow } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";

const IST = "Asia/Kolkata";

/** Ensure a Date object from a Date | string input */
function toDate(date: Date | string): Date {
  return typeof date === "string" ? parseISO(date) : date;
}

/** "31 Oct 2026, 4:54 PM" */
export function formatDateTime(date: Date | string): string {
  return formatInTimeZone(toDate(date), IST, "d MMM yyyy, h:mm a");
}

/** "31 Oct 2026" */
export function formatDate(date: Date | string): string {
  return formatInTimeZone(toDate(date), IST, "d MMM yyyy");
}

/** "4:54 PM" */
export function formatTime(date: Date | string): string {
  return formatInTimeZone(toDate(date), IST, "h:mm a");
}

/** "2 days ago", "in 3 hours" */
export function formatRelative(date: Date | string): string {
  return formatDistanceToNow(toDate(date), { addSuffix: true });
}

/** Convert a UTC Date to a full IST display string */
export function toIST(date: Date): string {
  return formatInTimeZone(date, IST, "yyyy-MM-dd HH:mm:ss zzz");
}

/** Check if a date is in the past (i.e. overdue) */
export function isOverdue(date: Date | string): boolean {
  return isPast(toDate(date));
}
