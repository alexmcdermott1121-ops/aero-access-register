import type { AccessRecord, AccessStatus } from "./types";

const inactiveStatuses: AccessStatus[] = ["Returned", "Expired", "Revoked", "Archived"];

function startOfToday() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

function daysUntil(value: string) {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return Math.ceil((date.getTime() - startOfToday().getTime()) / 86_400_000);
}

export function formatDate(value?: string | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("en-AU", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export function formatDateTime(value?: string | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("en-AU", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function isExpiringSoon(record: AccessRecord) {
  return isExpiringWithin(record, 30);
}

export function isExpiringWithin(record: AccessRecord, days: 7 | 30) {
  if (!record.expiry_date || inactiveStatuses.includes(record.status)) return false;
  const remainingDays = daysUntil(record.expiry_date);
  return remainingDays >= 0 && remainingDays <= days;
}

export function isOverdueReturn(record: AccessRecord) {
  if (!record.return_due_date || record.returned_date || inactiveStatuses.includes(record.status)) {
    return false;
  }
  return daysUntil(record.return_due_date) < 0;
}

export function isExpiredButNotReturned(record: AccessRecord) {
  if (!record.expiry_date || record.returned_date || ["Returned", "Revoked", "Archived"].includes(record.status)) {
    return false;
  }
  return daysUntil(record.expiry_date) < 0 || record.status === "Expired";
}

export function isActiveAccess(record: AccessRecord) {
  return ["Approved", "Issued", "Active"].includes(record.status);
}

export function statusClass(status: AccessStatus) {
  return `badge badge-${status.toLowerCase().replaceAll(" ", "-")}`;
}

export function toCsv(records: AccessRecord[]) {
  const columns: Array<[string, keyof AccessRecord]> = [
    ["holder_name", "holder_name"],
    ["holder_type", "holder_type"],
    ["company", "company"],
    ["access_type", "access_type"],
    ["access_area", "access_area"],
    ["purpose", "purpose"],
    ["approved_by", "approved_by"],
    ["authority_source", "authority_source"],
    ["approval_date", "approval_date"],
    ["start_date", "start_date"],
    ["expiry_date", "expiry_date"],
    ["return_due_date", "return_due_date"],
    ["returned_date", "returned_date"],
    ["status", "status"],
    ["conditions", "conditions"],
    ["notes", "notes"],
    ["attachment_url", "attachment_url"],
    ["created_at", "created_at"],
    ["updated_at", "updated_at"],
  ];
  const escape = (value: unknown) => `"${String(value ?? "").replaceAll('"', '""')}"`;
  return [columns.map(([label]) => escape(label)).join(",")]
    .concat(records.map((record) => columns.map(([, key]) => escape(record[key])).join(",")))
    .join("\n");
}
