import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Eye, Plus } from "lucide-react";
import { StatusBadge } from "../components/StatusBadge";
import { useData } from "../lib/DataContext";
import { accessTypes, holderTypes, statuses } from "../lib/types";
import { formatDate, formatDateTime, isExpiringSoon, isOverdueReturn } from "../lib/utils";

export function Register() {
  const { records } = useData();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [accessType, setAccessType] = useState("");
  const [holderType, setHolderType] = useState("");
  const [expiringSoon, setExpiringSoon] = useState(false);
  const [overdueReturn, setOverdueReturn] = useState(false);

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
        (!holderType || record.holder_type === holderType) &&
        (!expiringSoon || isExpiringSoon(record)) &&
        (!overdueReturn || isOverdueReturn(record))
      );
    });
  }, [records, search, status, accessType, holderType, expiringSoon, overdueReturn]);

  return (
    <section>
      <div className="page-heading">
        <div>
          <h1>Access Register</h1>
          <p>No passcodes, alarm codes, lockbox codes, safe codes, or sensitive key cuts are stored.</p>
        </div>
        <Link className="primary icon-text" to="/records/new"><Plus size={18} />Add record</Link>
      </div>

      <div className="filters">
        <label>Search<input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Holder, company, area, purpose" /></label>
        <label>Status<select value={status} onChange={(event) => setStatus(event.target.value)}><option value="">All</option>{statuses.map((item) => <option key={item}>{item}</option>)}</select></label>
        <label>Access type<select value={accessType} onChange={(event) => setAccessType(event.target.value)}><option value="">All</option>{accessTypes.map((item) => <option key={item}>{item}</option>)}</select></label>
        <label>Holder type<select value={holderType} onChange={(event) => setHolderType(event.target.value)}><option value="">All</option>{holderTypes.map((item) => <option key={item}>{item}</option>)}</select></label>
        <label className="check"><input checked={expiringSoon} onChange={(event) => setExpiringSoon(event.target.checked)} type="checkbox" />Expiring soon</label>
        <label className="check"><input checked={overdueReturn} onChange={(event) => setOverdueReturn(event.target.checked)} type="checkbox" />Overdue return</label>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Status</th><th>Access holder</th><th>Role/company</th><th>Access type</th><th>Access area</th><th>Purpose</th><th>Approved by</th><th>Authority source</th><th>Start date</th><th>Expiry date</th><th>Return due date</th><th>Returned date</th><th>Conditions</th><th>Notes</th><th>Last updated</th><th></th>
            </tr>
          </thead>
          <tbody>
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
                <td>{formatDate(record.start_date)}</td>
                <td>{formatDate(record.expiry_date)}</td>
                <td>{formatDate(record.return_due_date)}</td>
                <td>{formatDate(record.returned_date)}</td>
                <td>{record.conditions || "-"}</td>
                <td>{record.notes || "-"}</td>
                <td>{formatDateTime(record.updated_at)}</td>
                <td><Link className="icon-only" to={`/records/${record.id}`} aria-label={`View ${record.holder_name}`}><Eye size={17} /></Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
