import { Link, useParams } from "react-router-dom";
import { Archive, CheckCircle2, Edit, RotateCcw, ShieldOff, XCircle } from "lucide-react";
import { StatusBadge } from "../components/StatusBadge";
import { useData } from "../lib/DataContext";
import { AccessStatus } from "../lib/types";
import { formatDate, formatDateTime } from "../lib/utils";

export function RecordDetail() {
  const { id } = useParams();
  const { records, auditLogs, updateStatus, canEdit } = useData();
  const record = records.find((item) => item.id === id);
  if (!record) return <p>Record not found.</p>;

  const actions: Array<[AccessStatus, typeof CheckCircle2]> = [
    ["Active", CheckCircle2],
    ["Returned", RotateCcw],
    ["Revoked", ShieldOff],
    ["Lost", XCircle],
    ["Archived", Archive],
  ];

  const fields = [
    ["Access holder", record.holder_name],
    ["Holder type", record.holder_type],
    ["Company", record.company],
    ["Contact details", record.contact_details],
    ["Access type", record.access_type],
    ["Access area", record.access_area],
    ["Purpose", record.purpose],
    ["Approved by", record.approved_by],
    ["Authority source", record.authority_source],
    ["Approval date", formatDate(record.approval_date)],
    ["Start date", formatDate(record.start_date)],
    ["Expiry date", formatDate(record.expiry_date)],
    ["Return due date", formatDate(record.return_due_date)],
    ["Returned date", formatDate(record.returned_date)],
    ["Approval/document link", record.attachment_url],
    ["Last updated", formatDateTime(record.updated_at)],
  ];

  return (
    <section>
      <div className="page-heading">
        <div>
          <h1>{record.holder_name}</h1>
          <StatusBadge status={record.status} />
        </div>
        <Link className="secondary icon-text" to={`/records/${record.id}/edit`}><Edit size={17} />Edit</Link>
      </div>
      <div className="action-row">
        {actions.map(([status, Icon]) => (
          <button className="secondary icon-text" disabled={!canEdit} key={status} onClick={() => void updateStatus(record.id, status)} type="button">
            <Icon size={16} />Mark {status.toLowerCase()}
          </button>
        ))}
      </div>
      <div className="detail-grid">
        {fields.map(([label, value]) => (
          <div className="detail-item" key={label}>
            <span>{label}</span>
            <strong>{value || "-"}</strong>
          </div>
        ))}
      </div>
      <article className="conditions-panel">
        <h2>Access Conditions</h2>
        <p>{record.conditions || "No special conditions recorded."}</p>
      </article>
      <article className="conditions-panel">
        <h2>Audit Log</h2>
        <div className="audit-list">
          {auditLogs.filter((log) => log.access_record_id === record.id).map((log) => (
            <div className="audit-item" key={log.id}>
              <strong>{log.action}</strong>
              <span>{formatDateTime(log.created_at)}</span>
              <p>{log.details || "No details recorded."}</p>
            </div>
          ))}
        </div>
      </article>
    </section>
  );
}
