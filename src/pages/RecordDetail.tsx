import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Archive, CheckCircle2, Edit, RotateCcw, ShieldOff, Trash2, XCircle } from "lucide-react";
import { StatusBadge } from "../components/StatusBadge";
import { useData } from "../lib/DataContext";
import { describeSupabaseError, supabase } from "../lib/supabase";
import type { AccessStatus, AuditLog, AccessRecord } from "../lib/types";
import { formatDate, formatDateTime } from "../lib/utils";

export function RecordDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { records, auditLogs, updateStatus, deleteRecord, canEdit, currentUser, getRecordById } = useData();
  const localRecord = records.find((item) => item.id === id);
  const [fetchedRecord, setFetchedRecord] = useState<AccessRecord | null>(null);
  const [fetchedAuditLogs, setFetchedAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(Boolean(id && !localRecord));
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [deleting, setDeleting] = useState(false);
  const record = localRecord ?? fetchedRecord;
  const isAdmin = currentUser?.role === "admin";

  useEffect(() => {
    let cancelled = false;

    async function loadRecord() {
      if (!id || localRecord || fetchedRecord) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");
      try {
        const loadedRecord = await getRecordById(id);
        if (!cancelled) {
          setFetchedRecord(loadedRecord);
          if (!loadedRecord) {
            setError("No access register record was found for this id. It may have been deleted, archived elsewhere, or blocked by permissions.");
          }
        }
      } catch (err) {
        if (!cancelled) setError(describeSupabaseError(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadRecord();
    return () => {
      cancelled = true;
    };
  }, [id, localRecord, fetchedRecord, getRecordById]);

  useEffect(() => {
    let cancelled = false;

    async function loadAuditLogs() {
      if (!id || !supabase || auditLogs.some((log) => log.access_record_id === id)) return;
      const { data, error: auditError } = await supabase
        .from("access_audit_log")
        .select("*")
        .eq("access_record_id", id)
        .order("created_at", { ascending: false });
      if (cancelled) return;
      if (auditError) {
        setError(describeSupabaseError(auditError));
        return;
      }
      setFetchedAuditLogs((data ?? []) as AuditLog[]);
    }

    void loadAuditLogs();
    return () => {
      cancelled = true;
    };
  }, [id, auditLogs]);

  const recordAuditLogs = useMemo(
    () => {
      const localLogs = auditLogs.filter((log) => log.access_record_id === record?.id);
      return localLogs.length > 0 ? localLogs : fetchedAuditLogs;
    },
    [auditLogs, fetchedAuditLogs, record?.id],
  );

  if (loading) return <p>Loading access record...</p>;
  if (!record) {
    return (
      <section className="empty-state">
        <h1>Record not found</h1>
        <p>{error || "This access record could not be loaded from Supabase."}</p>
        <Link className="primary icon-text" to="/register">Back to Access Register</Link>
      </section>
    );
  }

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

  async function handleDelete() {
    if (!record || !isAdmin) return;
    const confirmed = window.confirm("This will permanently delete this record. This should only be used for test records or incorrect entries. Continue?");
    if (!confirmed) return;

    setDeleting(true);
    setError("");
    setMessage("");
    try {
      await deleteRecord(record.id);
      navigate("/register", {
        replace: true,
        state: {
          savedMessage: `Access record for ${record.holder_name} was permanently deleted.`,
        },
      });
    } catch (err) {
      setError(describeSupabaseError(err));
    } finally {
      setDeleting(false);
    }
  }

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
        {isAdmin ? (
          <button className="danger icon-text" disabled={deleting} onClick={() => void handleDelete()} type="button">
            <Trash2 size={16} />{deleting ? "Deleting..." : "Delete permanently"}
          </button>
        ) : null}
      </div>
      {message ? <div className="success-banner" role="status">{message}</div> : null}
      {error ? <pre className="error-box">{error}</pre> : null}
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
          {recordAuditLogs.length === 0 ? <p>No audit entries have been recorded for this access record yet.</p> : null}
          {recordAuditLogs.map((log) => (
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
