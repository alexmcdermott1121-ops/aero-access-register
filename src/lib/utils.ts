import type { AccessRecord, AccessStatus } from "./types";

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
  if (!record.expiry_date || ["Returned", "Revoked", "Archived"].includes(record.status)) return false;
  const today = new Date();
  const expiry = new Date(record.expiry_date);
  const days = (expiry.getTime() - today.getTime()) / 86_400_000;
  return days >= 0 && days <= 30;
}

export function isOverdueReturn(record: AccessRecord) {
  if (!record.return_due_date || record.returned_date || ["Returned", "Revoked", "Archived"].includes(record.status)) {
    return false;
  }
  return new Date(record.return_due_date) < new Date();
}

export function statusClass(status: AccessStatus) {
  return `badge badge-${status.toLowerCase().replaceAll(" ", "-")}`;
}

export function toCsv(records: AccessRecord[]) {
  const columns: Array<[string, keyof AccessRecord]> = [
    ["Status", "status"],
    ["Access holder", "holder_name"],
    ["Role/company", "company"],
    ["Access type", "access_type"],
    ["Access area", "access_area"],
    ["Purpose", "purpose"],
    ["Approved by", "approved_by"],
    ["Authority source", "authority_source"],
    ["Start date", "start_date"],
    ["Expiry date", "expiry_date"],
    ["Return due date", "return_due_date"],
    ["Returned date", "returned_date"],
    ["Conditions", "conditions"],
    ["Notes", "notes"],
    ["Last updated", "updated_at"],
  ];
  const escape = (value: unknown) => `"${String(value ?? "").replaceAll('"', '""')}"`;
  return [columns.map(([label]) => escape(label)).join(",")]
    .concat(records.map((record) => columns.map(([, key]) => escape(record[key])).join(",")))
    .join("\n");
}
