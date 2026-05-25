import { FormEvent, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Save } from "lucide-react";
import { useData } from "../lib/DataContext";
import { accessAreas, accessTypes, authoritySources, holderTypes, statuses } from "../lib/types";
import type { AccessRecord } from "../lib/types";

type RecordInput = Omit<AccessRecord, "id" | "created_at" | "updated_at">;

const blankRecord: RecordInput = {
  holder_name: "",
  holder_type: "Committee",
  company: "",
  contact_details: "",
  access_type: "Key",
  access_area: "Common areas",
  purpose: "",
  approved_by: "",
  authority_source: "Committee approval",
  approval_date: "",
  start_date: "",
  expiry_date: "",
  return_due_date: "",
  returned_date: "",
  status: "Pending approval",
  conditions: "",
  notes: "",
  attachment_url: "",
};

function toRecordInput(record?: AccessRecord): RecordInput {
  if (!record) return blankRecord;
  return {
    holder_name: record.holder_name,
    holder_type: record.holder_type,
    company: record.company,
    contact_details: record.contact_details,
    access_type: record.access_type,
    access_area: record.access_area,
    purpose: record.purpose,
    approved_by: record.approved_by,
    authority_source: record.authority_source,
    approval_date: record.approval_date,
    start_date: record.start_date,
    expiry_date: record.expiry_date,
    return_due_date: record.return_due_date,
    returned_date: record.returned_date,
    status: record.status,
    conditions: record.conditions,
    notes: record.notes,
    attachment_url: record.attachment_url,
  };
}

function cleanRecord(record: RecordInput): RecordInput {
  return {
    ...record,
    company: record.company || null,
    contact_details: record.contact_details || null,
    approved_by: record.approved_by || null,
    approval_date: record.approval_date || null,
    start_date: record.start_date || null,
    expiry_date: record.expiry_date || null,
    return_due_date: record.return_due_date || null,
    returned_date: record.returned_date || null,
    conditions: record.conditions || null,
    notes: record.notes || null,
    attachment_url: record.attachment_url || null,
  };
}

export function RecordForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { records, saveRecord, canEdit } = useData();
  const existing = useMemo(() => records.find((record) => record.id === id), [records, id]);
  const [form, setForm] = useState<RecordInput>(toRecordInput(existing));
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  if (id && !existing) return <p>Record not found.</p>;

  function update<K extends keyof RecordInput>(field: K, value: RecordInput[K]) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!canEdit) {
      setMessage("Your account has read-only access.");
      return;
    }
    setSaving(true);
    setMessage("");
    try {
      const savedId = await saveRecord(cleanRecord(form), id);
      navigate(`/records/${savedId}`);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Could not save this record.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section>
      <div className="page-heading">
        <div>
          <h1>{id ? "Edit Access Record" : "Add Access Record"}</h1>
          <p>Use descriptive labels only. Do not enter passcodes, alarm codes, lockbox codes, safe codes, or sensitive key cuts.</p>
        </div>
      </div>
      <form className="record-form" onSubmit={handleSubmit}>
        <label>Access holder name<input required value={form.holder_name} onChange={(event) => update("holder_name", event.target.value)} /></label>
        <label>Holder type<select value={form.holder_type} onChange={(event) => update("holder_type", event.target.value as RecordInput["holder_type"])}>{holderTypes.map((item) => <option key={item}>{item}</option>)}</select></label>
        <label>Company<input value={form.company ?? ""} onChange={(event) => update("company", event.target.value)} /></label>
        <label>Contact details<input value={form.contact_details ?? ""} onChange={(event) => update("contact_details", event.target.value)} /></label>
        <label>Access type<select value={form.access_type} onChange={(event) => update("access_type", event.target.value as RecordInput["access_type"])}>{accessTypes.map((item) => <option key={item}>{item}</option>)}</select></label>
        <label>Access area<select value={form.access_area} onChange={(event) => update("access_area", event.target.value as RecordInput["access_area"])}>{accessAreas.map((item) => <option key={item}>{item}</option>)}</select></label>
        <label className="wide">Purpose of access<input required value={form.purpose} onChange={(event) => update("purpose", event.target.value)} /></label>
        <label>Approved by<input value={form.approved_by ?? ""} onChange={(event) => update("approved_by", event.target.value)} /></label>
        <label>Authority source<select value={form.authority_source} onChange={(event) => update("authority_source", event.target.value as RecordInput["authority_source"])}>{authoritySources.map((item) => <option key={item}>{item}</option>)}</select></label>
        <label>Approval date<input type="date" value={form.approval_date ?? ""} onChange={(event) => update("approval_date", event.target.value)} /></label>
        <label>Start date<input type="date" value={form.start_date ?? ""} onChange={(event) => update("start_date", event.target.value)} /></label>
        <label>Expiry date<input type="date" value={form.expiry_date ?? ""} onChange={(event) => update("expiry_date", event.target.value)} /></label>
        <label>Return due date<input type="date" value={form.return_due_date ?? ""} onChange={(event) => update("return_due_date", event.target.value)} /></label>
        <label>Returned date<input type="date" value={form.returned_date ?? ""} onChange={(event) => update("returned_date", event.target.value)} /></label>
        <label>Status<select value={form.status} onChange={(event) => update("status", event.target.value as RecordInput["status"])}>{statuses.map((item) => <option key={item}>{item}</option>)}</select></label>
        <label className="wide">Access conditions<textarea value={form.conditions ?? ""} onChange={(event) => update("conditions", event.target.value)} /></label>
        <label className="wide">Notes<textarea value={form.notes ?? ""} onChange={(event) => update("notes", event.target.value)} /></label>
        <label className="wide">Approval email or document link<input value={form.attachment_url ?? ""} onChange={(event) => update("attachment_url", event.target.value)} placeholder="https://..." /></label>
        {message ? <p className="error-text wide">{message}</p> : null}
        <div className="form-actions wide">
          <button className="primary icon-text" disabled={saving} type="submit"><Save size={17} />{saving ? "Saving..." : "Save record"}</button>
        </div>
      </form>
    </section>
  );
}
