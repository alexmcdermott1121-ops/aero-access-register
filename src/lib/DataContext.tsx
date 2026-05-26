import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { describeSupabaseError, supabase } from "./supabase";
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
  getRecordById: (id: string) => Promise<AccessRecord | null>;
  saveRecord: (record: RecordInput, id?: string) => Promise<AccessRecord>;
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
      .maybeSingle();
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
    setLoading(true);
    const messages: string[] = [];

    try {
      try {
        const allowedUser = await loadAllowedUser();
        setCurrentUser(allowedUser);
        if (!allowedUser) {
          messages.push("Signed in, but this email was not found in allowed_users. Reading access_register will still be attempted so any RLS error is shown below.");
        }
      } catch (allowedUserError) {
        setCurrentUser(null);
        messages.push(`allowed_users lookup failed:\n${describeSupabaseError(allowedUserError)}`);
      }

      const { data: recordData, error: recordError, status, statusText } = await supabase
        .from("access_register")
        .select("*")
        .order("updated_at", { ascending: false })
        .returns<AccessRecord[]>();

      if (recordError) {
        setRecords([]);
        setAuditLogs([]);
        setError(
          [
            "access_register select failed. The app is querying Supabase table: access_register.",
            `HTTP status: ${status}${statusText ? ` ${statusText}` : ""}`,
            describeSupabaseError(recordError),
            ...messages,
          ].join("\n\n"),
        );
        return;
      }

      setRecords(recordData ?? []);

      const { data: logData, error: logError } = await supabase
        .from("access_audit_log")
        .select("*")
        .order("created_at", { ascending: false });

      if (logError) {
        setAuditLogs([]);
        messages.push(`access_audit_log select failed, but access_register rows loaded successfully:\n${describeSupabaseError(logError)}`);
      } else {
        setAuditLogs((logData ?? []) as AuditLog[]);
      }

      setError(messages.join("\n\n"));
    } catch (err) {
      setError(`Unexpected register load error:\n${describeSupabaseError(err)}`);
      setRecords(supabase ? [] : demoRecords);
      setAuditLogs(supabase ? [] : demoAuditLog);
    } finally {
      setLoading(false);
    }
  }

  const getRecordById = useCallback(async (id: string) => {
    const localRecord = records.find((item) => item.id === id);
    if (localRecord) return localRecord;
    if (!supabase || demoMode) return demoRecords.find((item) => item.id === id) ?? null;

      const { data, error: fetchError } = await supabase
        .from("access_register")
        .select("*")
        .eq("id", id)
        .maybeSingle()
        .returns<AccessRecord | null>();

    if (fetchError) {
      throw new Error(describeSupabaseError(fetchError));
    }

    return data ?? null;
  }, [records, demoMode]);

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
    const { error: auditError } = await supabase.from("access_audit_log").insert({
      access_record_id,
      action,
      details,
    });
    if (auditError) setError(`Record saved, but audit log could not be written.\n${describeSupabaseError(auditError)}`);
  }

  async function saveRecord(record: RecordInput, id?: string) {
    const now = new Date().toISOString();
    if (!supabase || demoMode) {
      const saved: AccessRecord = id
        ? ({ ...record, id, created_at: records.find((item) => item.id === id)?.created_at ?? now, updated_at: now } as AccessRecord)
        : ({ ...record, id: crypto.randomUUID(), created_at: now, updated_at: now } as AccessRecord);
      setRecords((items) => (id ? items.map((item) => (item.id === id ? saved : item)) : [saved, ...items]));
      await addAudit(saved.id, id ? "Record updated" : "Record created", id ? "Access register entry updated." : "Access register entry created.");
      return saved;
    }

    if (id) {
      const { data, error: updateError } = await supabase
        .from("access_register")
        .update(record)
        .eq("id", id)
        .select("*")
        .single()
        .returns<AccessRecord>();
      if (updateError) throw new Error(describeSupabaseError(updateError));
      if (!data?.id) throw new Error("Supabase update completed but did not return the updated record id.");
      await addAudit(id, "Record updated", "Access register entry updated.");
      setRecords((items) => items.map((item) => (item.id === id ? data : item)));
      await refresh();
      return data;
    }

    const { data, error: insertError } = await supabase
      .from("access_register")
      .insert(record)
      .select("*")
      .single()
      .returns<AccessRecord>();
    if (insertError) throw new Error(describeSupabaseError(insertError));
    if (!data?.id) throw new Error("Supabase insert completed but did not return the new record id.");
    await addAudit(data.id, "Record created", "Access register entry created.");
    setRecords((items) => [data, ...items.filter((item) => item.id !== data.id)]);
    await refresh();
    return data;
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
    if (updateError) throw new Error(describeSupabaseError(updateError));
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
    () => ({ records, auditLogs, currentUser, loading, error, demoMode, canEdit, refresh, getRecordById, saveRecord, updateStatus }),
    [records, auditLogs, currentUser, loading, error, demoMode, canEdit, getRecordById],
  );

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const value = useContext(DataContext);
  if (!value) throw new Error("useData must be used inside DataProvider");
  return value;
}
