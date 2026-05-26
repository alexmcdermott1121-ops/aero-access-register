import { AlertTriangle, Archive, Building2, CheckCircle2, Clock, FileWarning, Hourglass, Users } from "lucide-react";
import { useData } from "../lib/DataContext";
import { isExpiringSoon, isOverdueReturn } from "../lib/utils";

export function Dashboard() {
  const { records, loading, error } = useData();
  const cards = [
    ["Total access records", records.length, Building2],
    ["Active access", records.filter((record) => record.status === "Active").length, CheckCircle2],
    ["Pending approval", records.filter((record) => record.status === "Pending approval").length, Hourglass],
    ["Expiring within 30 days", records.filter(isExpiringSoon).length, Clock],
    ["Overdue return", records.filter(isOverdueReturn).length, AlertTriangle],
    ["Revoked/returned access", records.filter((record) => ["Revoked", "Returned"].includes(record.status)).length, Archive],
    ["Contractor access records", records.filter((record) => record.holder_type === "Contractor" || record.access_type === "Contractor / temporary access").length, FileWarning],
    ["Committee/authorised representative access records", records.filter((record) => ["Committee", "Building Manager", "Strata Manager"].includes(record.holder_type)).length, Users],
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
