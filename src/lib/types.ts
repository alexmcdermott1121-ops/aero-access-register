export type AccessStatus =
  | "Pending approval"
  | "Approved"
  | "Active"
  | "Expiring soon"
  | "Overdue return"
  | "Returned"
  | "Revoked"
  | "Lost"
  | "Archived";

export type HolderType =
  | "Committee"
  | "Building Manager"
  | "Strata Manager"
  | "Contractor"
  | "Consultant"
  | "Engineer"
  | "Lawyer"
  | "Resident"
  | "Other";

export type AccessType =
  | "Key only"
  | "Fob only"
  | "Remote only"
  | "Key + Fob"
  | "Garage remote + fob"
  | "Common area access"
  | "Contractor / temporary access"
  | "Inspection access"
  | "Digital / system access"
  | "Full building access - common areas, garage and services areas"
  | "Other";

export type AccessArea =
  | "Common areas"
  | "Basement / car park"
  | "Garage"
  | "Garbage / waste areas"
  | "Plant room"
  | "Roof"
  | "Fire services area"
  | "Storage / common area"
  | "Building management areas"
  | "Unit access by consent"
  | "Full building access - common areas, garage and services areas"
  | "Other";

export type AuthoritySource =
  | "Committee approval"
  | "Strata instruction"
  | "Building manager instruction"
  | "Emergency access"
  | "Owner/occupier consent"
  | "Other";

export interface AccessRecord {
  id: string;
  holder_name: string;
  holder_type: HolderType;
  company: string | null;
  contact_details: string | null;
  access_type: AccessType;
  access_area: AccessArea;
  purpose: string;
  approved_by: string | null;
  authority_source: AuthoritySource;
  approval_date: string | null;
  start_date: string | null;
  expiry_date: string | null;
  return_due_date: string | null;
  returned_date: string | null;
  status: AccessStatus;
  conditions: string | null;
  notes: string | null;
  attachment_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface AuditLog {
  id: string;
  access_record_id: string | null;
  action: string;
  details: string | null;
  created_at: string;
  created_by: string | null;
}

export interface AllowedUser {
  id: string;
  email: string;
  role: "admin" | "viewer";
}

export const holderTypes: HolderType[] = [
  "Committee",
  "Building Manager",
  "Strata Manager",
  "Contractor",
  "Consultant",
  "Engineer",
  "Lawyer",
  "Resident",
  "Other",
];

export const accessTypes: AccessType[] = [
  "Key only",
  "Fob only",
  "Remote only",
  "Key + Fob",
  "Garage remote + fob",
  "Common area access",
  "Contractor / temporary access",
  "Inspection access",
  "Digital / system access",
  "Full building access - common areas, garage and services areas",
  "Other",
];

export const accessAreas: AccessArea[] = [
  "Common areas",
  "Basement / car park",
  "Garage",
  "Garbage / waste areas",
  "Plant room",
  "Roof",
  "Fire services area",
  "Storage / common area",
  "Building management areas",
  "Unit access by consent",
  "Full building access - common areas, garage and services areas",
  "Other",
];

export const authoritySources: AuthoritySource[] = [
  "Committee approval",
  "Strata instruction",
  "Building manager instruction",
  "Emergency access",
  "Owner/occupier consent",
  "Other",
];

export const statuses: AccessStatus[] = [
  "Pending approval",
  "Approved",
  "Active",
  "Expiring soon",
  "Overdue return",
  "Returned",
  "Revoked",
  "Lost",
  "Archived",
];
