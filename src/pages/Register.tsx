import { useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Archive, Download, Eye, Plus } from "lucide-react";
import { StatusBadge } from "../components/StatusBadge";
import { useData } from "../lib/DataContext";
import { accessAreas, accessTypes, holderTypes, statuses } from "../lib/types";
import { describeSupabaseError } from "../lib/supabase";
import { formatDate, formatDateTime, isExpiringSoon, isOverdueReturn, toCsv } from "../lib/utils";

export function Register() {
  const { records, error, loading, refresh, archiveRecord, canEdit } = useData();
  const location = useLocation();
  const navigate = useNavigate();
  const savedMessage = (location.state as { savedMessage?: string } | null)?.savedMessage;
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [accessType, setAccessType] = useState("");
  const [accessArea, setAccessArea] = useState("");
  const [holderType, setHolderType] = useState("");
  const [company, setCompany] = useState("");
  const [archiveFilter, setArchiveFilter] = useState("not_archived");
  const [expiringSoon, setExpiringSoon] = useState(false);
  const [overdueReturn, setOverdueReturn] = useState(false);
  const [actionMessage, setActionMessage] = useState("");

  const filtered = useMemo(() => {
    const query = search.toLowerCase();
    return records.filter((record) => {
      const text = [
        record.holder_name,
        record.company,
        record.contact_details,
        record.access_type,
        record.access_area,
        record.purpose,
        record.approved_by,
        record.authority_source,
        record.conditions,
        record.notes,
      ].join(" ").toLowerCase();
      return (
        (!query || text.includes(query)) &&
        (!status || record.status === status) &&
        (!accessType || record.access_type === accessType) &&
        (!accessArea || record.access_area === accessArea) &&
        (!holderType || record.holder_type === holderType) &&
        (!company || (record.company ?? "").toLowerCase().includes(company.toLowerCase())) &&
        (!expiringSoon || isExpiringSoon(record)) &&
        (!overdueReturn || isOverdueReturn(record)) &&
        (archiveFilter === "all" ||
          (archiveFilter === "archived" ? record.status === "Archived" : record.status !== "Archived"))
      );
    });
  }, [records, search, status, accessType, accessArea, holderType, company, expiringSoon, overdueReturn, archiveFilter]);

  function exportCsv() {
    const blob = new Blob([toCsv(filtered)], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "access-register.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  async function handleArchive(id: string, holderName: string) {
    setActionMessage("");
    try {
      await archiveRecord(id);
      setActionMessage(`Access record for ${holderName} was archived.`);
    } catch (err) {
      setActionMessage(describeSupabaseError(err));
    }
  }

  return (
    <section>
      <div className="page-heading">
        <div>
          <h1>Access Register</h1>
          <p>No passcodes, alarm codes, lockbox codes, safe codes, or sensitive key cuts are stored.</p>
        </div>
        <div className="heading-actions">
          <button className="secondary icon-text" onClick={exportCsv} type="button"><Download size={17} />Export CSV</button>
          <Link className="primary icon-text" to="/records/new"><Plus size={18} />Add record</Link>
        </div>
      </div>
      {savedMessage ? (
        <div className="success-banner" role="status">
          <span>{savedMessage}</span>
          <button className="secondary" onClick={() => navigate("/register", { replace: true })} type="button">Dismiss</button>
        </div>
      ) : null}
      {error ? <pre className="error-box">{error}</pre> : null}
      {actionMessage ? <div className={actionMessage.startsWith("Message:") ? "error-box" : "success-banner"} role="status">{actionMessage}</div> : null}
      {loading ? <p>Loading access register records...</p> : null}

      <div className="filters">
        <label>Search<input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Holder, company, area, purpose" /></label>
        <label>Status<select value={status} onChange={(event) => setStatus(event.target.value)}><option value="">All</option>{statuses.map((item) => <option key={item}>{item}</option>)}</select></label>
        <label>Access type<select value={accessType} onChange={(event) => setAccessType(event.target.value)}><option value="">All</option>{accessTypes.map((item) => <option key={item}>{item}</option>)}</select></label>
        <label>Access area<select value={accessArea} onChange={(event) => setAccessArea(event.target.value)}><option value="">All</option>{accessAreas.map((item) => <option key={item}>{item}</option>)}</select></label>
        <label>Holder type<select value={holderType} onChange={(event) => setHolderType(event.target.value)}><option value="">All</option>{holderTypes.map((item) => <option key={item}>{item}</option>)}</select></label>
        <label>Company<input value={company} onChange={(event) => setCompany(event.target.value)} placeholder="Company" /></label>
        <label>Archived<select value={archiveFilter} onChange={(event) => setArchiveFilter(event.target.value)}><option value="not_archived">Not archived</option><option value="archived">Archived only</option><option value="all">All records</option></select></label>
        <label className="check"><input checked={expiringSoon} onChange={(event) => setExpiringSoon(event.target.checked)} type="checkbox" />Expiring soon</label>
        <label className="check"><input checked={overdueReturn} onChange={(event) => setOverdueReturn(event.target.checked)} type="checkbox" />Overdue return</label>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Status</th><th>Access holder</th><th>Role/company</th><th>Access type</th><th>Access area</th><th>Purpose</th><th>Approved by</th><th>Authority source</th><th>Approval reference</th><th>Start date</th><th>Expiry date</th><th>Return due date</th><th>Returned date</th><th>Conditions</th><th>Notes</th><th>Last updated</th><th></th>
            </tr>
          </thead>
          <tbody>
            {!loading && filtered.length === 0 ? (
              <tr>
                <td colSpan={17}>
                  No access register records are currently visible to this signed-in user. If records exist in Supabase, check the error message above for RLS or select-query details.
                </td>
              </tr>
            ) : null}
            {filtered.map((record) => (
              <tr key={record.id}>
                <td><StatusBadge status={record.status} /></td>
                <td>{record.holder_name}</td>
                <td>{record.company || record.holder_type}</td>
                <td>{record.access_type}</td>
                <td>{record.access_area}</td>
                <td>{record.purpose}</td>
                <td>{record.approved_by || "-"}</td>
                <td>{record.authority_source}</td>
                <td>{record.approval_reference || "-"}</td>
                <td>{formatDate(record.start_date)}</td>
                <td>{formatDate(record.expiry_date)}</td>
                <td>{formatDate(record.return_due_date)}</td>
                <td>{formatDate(record.returned_date)}</td>
                <td>{record.conditions || "-"}</td>
                <td>{record.notes || "-"}</td>
                <td>{formatDateTime(record.updated_at)}</td>
                <td>
                  <div className="row-actions">
                    <Link className="icon-only" to={`/records/${record.id}`} aria-label={`View ${record.holder_name}`}><Eye size={17} /></Link>
                    {record.status !== "Archived" ? (
                      <button className="icon-only" disabled={!canEdit} onClick={() => void handleArchive(record.id, record.holder_name)} type="button" aria-label={`Archive ${record.holder_name}`}>
                        <Archive size={17} />
                      </button>
                    ) : null}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="form-actions refresh-actions">
        <button className="secondary" onClick={() => void refresh()} type="button">Reload records</button>
      </div>
    </section>
  );
}
