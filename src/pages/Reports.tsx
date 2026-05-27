import { Download, Printer } from "lucide-react";
import { StatusBadge } from "../components/StatusBadge";
import { useData } from "../lib/DataContext";
import { formatDate, isExpiringSoon, isOverdueReturn, toCsv } from "../lib/utils";

export function Reports() {
  const { records, error, loading } = useData();
  const currentRecords = records.filter((record) => record.status !== "Archived");
  const reports = [
    ["Active access report", currentRecords.filter((record) => ["Approved", "Issued", "Active"].includes(record.status))],
    ["Expiring soon report", currentRecords.filter(isExpiringSoon)],
    ["Overdue return report", currentRecords.filter(isOverdueReturn)],
    ["Contractor access report", currentRecords.filter((record) => record.holder_type === "Contractor" || record.access_type === "Contractor / temporary access")],
  ] as const;

  function exportCsv(name: string, rows: typeof records) {
    const blob = new Blob([toCsv(rows)], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${name.toLowerCase().replaceAll(" ", "-")}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <section>
      <div className="page-heading print-hide">
        <div>
          <h1>Reports</h1>
          <p>Print-friendly summaries and CSV export for committee review.</p>
        </div>
        <button className="primary icon-text" onClick={() => window.print()} type="button"><Printer size={17} />Print</button>
      </div>
      {error ? <pre className="error-box print-hide">{error}</pre> : null}
      {loading ? <p className="print-hide">Loading reports...</p> : null}
      {reports.map(([title, rows]) => (
        <article className="report-section" key={title}>
          <div className="report-heading">
            <h2>{title}</h2>
            <button className="secondary icon-text print-hide" onClick={() => exportCsv(title, rows)} type="button"><Download size={16} />CSV</button>
          </div>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Status</th><th>Holder</th><th>Role/company</th><th>Access</th><th>Area</th><th>Expiry</th><th>Return due</th><th>Conditions</th></tr></thead>
              <tbody>
                {rows.map((record) => (
                  <tr key={record.id}>
                    <td><StatusBadge status={record.status} /></td>
                    <td>{record.holder_name}</td>
                    <td>{record.company || record.holder_type}</td>
                    <td>{record.access_type}</td>
                    <td>{record.access_area}</td>
                    <td>{formatDate(record.expiry_date)}</td>
                    <td>{formatDate(record.return_due_date)}</td>
                    <td>{record.conditions || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>
      ))}
    </section>
  );
}
