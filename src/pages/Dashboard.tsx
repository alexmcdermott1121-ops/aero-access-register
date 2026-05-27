import { AlertTriangle, Archive, Building2, CheckCircle2, Clock, FileWarning, Hourglass, Users } from "lucide-react";
import { useData } from "../lib/DataContext";
import { isActiveAccess, isExpiredButNotReturned, isExpiringWithin, isOverdueReturn } from "../lib/utils";

export function Dashboard() {
  const { records, loading, error } = useData();
  const currentRecords = records.filter((record) => record.status !== "Archived");
  const cards = [
    ["Current access records", currentRecords.length, Building2],
    ["Active access", currentRecords.filter(isActiveAccess).length, CheckCircle2],
    ["Pending approval", currentRecords.filter((record) => record.status === "Pending approval").length, Hourglass],
    ["Expiring within 7 days", currentRecords.filter((record) => isExpiringWithin(record, 7)).length, Clock],
    ["Expiring within 30 days", currentRecords.filter((record) => isExpiringWithin(record, 30)).length, Clock],
    ["Overdue return", currentRecords.filter(isOverdueReturn).length, AlertTriangle],
    ["Expired but not returned", currentRecords.filter(isExpiredButNotReturned).length, AlertTriangle],
    ["Returned access", currentRecords.filter((record) => record.status === "Returned").length, Archive],
    ["Contractor access records", currentRecords.filter((record) => record.holder_type === "Contractor" || record.access_type === "Contractor / temporary access").length, FileWarning],
    ["Committee/authorised representative access records", currentRecords.filter((record) => ["Committee", "Building Manager", "Strata Manager"].includes(record.holder_type)).length, Users],
    ["Archived records", records.filter((record) => record.status === "Archived").length, Archive],
  ] as const;

  return (
    <section>
      <div className="page-heading">
        <div>
          <h1>Governance Dashboard</h1>
          <p>Approved access arrangements, returns, expiries, and committee oversight in one private register.</p>
        </div>
      </div>
      {loading ? <p>Loading register...</p> : null}
      {error ? <pre className="error-box">{error}</pre> : null}
      <div className="metric-grid">
        {cards.map(([label, value, Icon]) => (
          <article className="metric-card" key={label}>
            <Icon size={22} />
            <span>{label}</span>
            <strong>{value}</strong>
          </article>
        ))}
      </div>
    </section>
  );
}
