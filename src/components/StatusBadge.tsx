import type { AccessStatus } from "../lib/types";
import { statusClass } from "../lib/utils";

export function StatusBadge({ status }: { status: AccessStatus }) {
  return <span className={statusClass(status)}>{status}</span>;
}
