import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { supabase } from "./supabase";
import { demoAuditLog, demoRecords } from "./demoData";
import type { AccessRecord, AccessStatus, AuditLog, AllowedUser } from "./types";

type RecordInput = Omit<AccessRecord, "id" | "created_at" | "updated_at">;

interface DataContextValue {
  records: AccessRecord[];
  auditLogs: AuditLog[];
  currentUser: AllowedUser | null;
  loading: boolean;
  error: string;
  demoMode: boolean;
  canEdit: boolean;
  refresh: () => Promise<void>;
  saveRecord: (record: RecordInput, id?: string) => Promise<string>;
  updateStatus: (id: string, status: AccessStatus) => Promise<void>;
}

const DataContext = createContext<DataContextValue | null>(null);

export function DataProvider({ children }: { children: ReactNode }) {
  const [records, setRecords] = useState<AccessRecord[]>(demoRecords);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(demoAuditLog);
  const [currentUser, setCurrentUser] = useState<AllowedUser | null>(null);
  const [loading, setLoading] = useState(Boolean(supabase));
  const [error, setError] = useState("");

  const demoMode = !supabase;
  const canEdit = demoMode || currentUser?.role === "admin";

  async function loadAllowedUser() {
    if (!supabase) return null;
    const { data: authData } = await supabase.auth.getUser();
    const email = authData.user?.email;
    if (!email) return null;
    const { data, error: userError } = await supabase
      .from("allowed_users")
      .select("id,email,role")
      .eq("email", email.toLowerCase())
      .single();
    if (userError) throw userError;
    return data as AllowedUser;
  }

  async function refresh() {
    if (!supabase) {
      setRecords(demoRecords);
      setAuditLogs(demoAuditLog);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const allowedUser = await loadAllowedUser();
      if (!allowedUser) {
        setCurrentUser(null);
        setRecords([]);
        setAuditLogs([]);
        setError("");
        return;
      }
      setCurrentUser(allowedUser);
      const [{ data: recordData, error: recordError }, { data: logData, error: logError }] = await Promise.all([
        supabase.from("access_register").select("*").order("updated_at", { ascending: false }),
        supabase.from("access_audit_log").select("*").order("created_at", { ascending: false }),
      ]);
      if (recordError) throw recordError;
      if (logError) throw logError;
      setRecords((recordData ?? []) as AccessRecord[]);
      setAuditLogs((logData ?? []) as AuditLog[]);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load Supabase data.");
      setRecords(supabase ? [] : demoRecords);
      setAuditLogs(supabase ? [] : demoAuditLog);
    } finally {
      setLoading(false);
    }
  }

  async function addAudit(access_record_id: string, action: string, details: string) {
    if (!supabase || demoMode) {
      setAuditLogs((logs) => [
        {
          id: crypto.randomUUID(),
          access_record_id,
          action,
          details,
          created_at: new Date().toISOString(),
          created_by: currentUser?.email ?? "demo",
        },
        ...logs,
      ]);
      return;
    }
    await supabase.from("access_audit_log").insert({
      access_record_id,
      action,
      details,
    });
  }

  async function saveRecord(record: RecordInput, id?: string) {
    const now = new Date().toISOString();
    if (!supabase || demoMode) {
      const saved: AccessRecord = id
        ? ({ ...record, id, created_at: records.find((item) => item.id === id)?.created_at ?? now, updated_at: now } as AccessRecord)
        : ({ ...record, id: crypto.randomUUID(), created_at: now, updated_at: now } as AccessRecord);
      setRecords((items) => (id ? items.map((item) => (item.id === id ? saved : item)) : [saved, ...items]));
      await addAudit(saved.id, id ? "Record updated" : "Record created", id ? "Access register entry updated." : "Access register entry created.");
      return saved.id;
    }

    if (id) {
      const { error: updateError } = await supabase.from("access_register").update(record).eq("id", id);
      if (updateError) throw updateError;
      await addAudit(id, "Record updated", "Access register entry updated.");
      await refresh();
      return id;
    }

    const { data, error: insertError } = await supabase.from("access_register").insert(record).select("id").single();
    if (insertError) throw insertError;
    await addAudit(data.id, "Record created", "Access register entry created.");
    await refresh();
    return data.id as string;
  }

  async function updateStatus(id: string, status: AccessStatus) {
    const returned_date = status === "Returned" ? new Date().toISOString().slice(0, 10) : undefined;
    const patch = returned_date ? { status, returned_date } : { status };
    if (!supabase || demoMode) {
      setRecords((items) =>
        items.map((item) =>
          item.id === id ? { ...item, ...patch, updated_at: new Date().toISOString() } : item,
        ),
      );
      await addAudit(id, status, `Marked ${status.toLowerCase()}.`);
      return;
    }
    const { error: updateError } = await supabase.from("access_register").update(patch).eq("id", id);
    if (updateError) throw updateError;
    await addAudit(id, status === "Returned" ? "Returned" : "Status changed", `Marked ${status.toLowerCase()}.`);
    await refresh();
  }

  useEffect(() => {
    void refresh();
    if (!supabase) return;
    const { data } = supabase.auth.onAuthStateChange(() => void refresh());
    return () => data.subscription.unsubscribe();
  }, []);

  const value = useMemo(
    () => ({ records, auditLogs, currentUser, loading, error, demoMode, canEdit, refresh, saveRecord, updateStatus }),
    [records, auditLogs, currentUser, loading, error, demoMode, canEdit],
  );

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const value = useContext(DataContext);
  if (!value) throw new Error("useData must be used inside DataProvider");
  return value;
}
