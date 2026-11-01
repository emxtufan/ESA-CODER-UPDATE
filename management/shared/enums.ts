/**
 * Liste de valori închise (enums) folosite în schema DB, validarea Zod și interfață.
 * Fiecare listă are un array `as const` și un tip derivat din el.
 * Valorile sunt exact etichetele din docs/SPEC.md, ca să poată fi afișate direct.
 * În DB sunt stocate ca `text` + `.$type<>()` (vezi server/db/schema).
 */

// §5 Projects
export const PROJECT_TYPES = [
  "Custom Website",
  "Landing Page",
  "E-commerce",
  "Shopify Development",
  "Web Application",
  "API Development",
  "3D Website",
  "Redesign",
  "Maintenance",
  "Other",
] as const;
export type ProjectType = (typeof PROJECT_TYPES)[number];

export const PROJECT_STATUSES = [
  "Lead",
  "Planned",
  "In Development",
  "Review",
  "Awaiting Client",
  "Completed",
  "Active Maintenance",
  "Suspended",
  "Archived",
] as const;
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

// §6 Clients
export const CLIENT_STATUSES = ["Prospect", "Active", "Inactive"] as const;
export type ClientStatus = (typeof CLIENT_STATUSES)[number];

// Prioritate (proiecte §5, taskuri §10, observații §10)
export const PRIORITIES = ["Low", "Medium", "High", "Critical"] as const;
export type Priority = (typeof PRIORITIES)[number];

// §10 Tasks
export const TASK_STATUSES = [
  "Backlog",
  "To Do",
  "In Progress",
  "In Review",
  "Blocked",
  "Completed",
] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

// §7 Infrastructure — servers
export const SERVER_PROVIDERS = [
  "Hetzner",
  "DigitalOcean",
  "AWS",
  "Contabo",
  "VPS",
  "Other",
] as const;
export type ServerProvider = (typeof SERVER_PROVIDERS)[number];

export const SERVER_TYPES = [
  "Production",
  "Development",
  "Staging",
  "Database",
  "Storage",
  "Other",
] as const;
export type ServerType = (typeof SERVER_TYPES)[number];

// §7 Infrastructure — services
export const SERVICE_NAMES = [
  "Nginx",
  "Apache",
  "Node.js",
  "PM2",
  "MongoDB",
  "PostgreSQL",
  "Redis",
  "Docker",
  "Cloudflare",
  "Other",
] as const;
export type ServiceName = (typeof SERVICE_NAMES)[number];

// §7 Infrastructure — vault
export const CREDENTIAL_TYPES = [
  "SSH",
  "Server Password",
  "Database",
  "FTP/SFTP",
  "WordPress Admin",
  "Shopify Admin",
  "cPanel",
  "Cloudflare",
  "GitHub Token",
  "API Key",
  "SMTP",
  "Other",
] as const;
export type CredentialType = (typeof CREDENTIAL_TYPES)[number];

// §9 Deployments
export const DEPLOYMENT_STATUSES = [
  "Pending",
  "Running",
  "Successful",
  "Failed",
  "Cancelled",
  "Rolled Back",
] as const;
export type DeploymentStatus = (typeof DEPLOYMENT_STATUSES)[number];

// §12 Finance
export const INVOICE_STATUSES = [
  "Draft",
  "Issued",
  "Partially Paid",
  "Paid",
  "Overdue",
  "Cancelled",
] as const;
export type InvoiceStatus = (typeof INVOICE_STATUSES)[number];

export const EXPENSE_CATEGORIES = [
  "Server Costs",
  "Hosting",
  "Domains",
  "Licenses",
  "Software",
  "Third-party Services",
  "Advertising",
  "Other",
] as const;
export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];

// §13 Documents
export const DOCUMENT_TYPES = [
  "Contracts",
  "Commercial Offers",
  "Invoices",
  "Payment Proofs",
  "GDPR Documents",
  "Technical Documentation",
  "Project Specifications",
  "Delivery Reports",
  "Other",
] as const;
export type DocumentType = (typeof DOCUMENT_TYPES)[number];

// §14 Notifications
export const NOTIFICATION_EVENTS = [
  "New Project",
  "New Task",
  "Task Deadline",
  "Overdue Task",
  "New Commit",
  "Failed Deployment",
  "Server Down",
  "SSL Expiration",
  "Domain Expiration",
  "Invoice Issued",
  "Invoice Due",
  "Invoice Overdue",
  "Payment Received",
  "Maintenance Reminder",
  "Backup Failed",
] as const;
export type NotificationEvent = (typeof NOTIFICATION_EVENTS)[number];

// §11 Maintenance
export const MAINTENANCE_PLANS = ["Basic", "Standard", "Premium", "Custom"] as const;
export type MaintenancePlan = (typeof MAINTENANCE_PLANS)[number];

export const MAINTENANCE_ACTIVITIES = [
  "Website Updates",
  "Dependency Updates",
  "Security Checks",
  "Backup Verification",
  "Performance Checks",
  "SEO Checks",
  "Form Testing",
  "SSL Checks",
  "Database Maintenance",
] as const;
export type MaintenanceActivity = (typeof MAINTENANCE_ACTIVITIES)[number];

// Roluri — cheile sunt folosite în DB (roles.key) și în DEFAULT_ROLE_PERMISSIONS.
export const ROLES = ["super_admin", "administrator", "developer", "finance"] as const;
export type Role = (typeof ROLES)[number];

export const ROLE_LABELS: Record<Role, string> = {
  super_admin: "Super Admin",
  administrator: "Administrator",
  developer: "Developer",
  finance: "Finance",
};

// Monede — sumele se țin în minor units (integer), niciodată amestecate între monede.
// §15 Incidente
export const INCIDENT_SEVERITIES = ["Low", "Medium", "High", "Critical"] as const;
export const INCIDENT_STATUSES = ["Open", "Investigating", "Resolved"] as const;

export const CURRENCIES = ["RON", "EUR", "USD"] as const;
export type Currency = (typeof CURRENCIES)[number];

// Tipuri de token de parolă.
export const PASSWORD_TOKEN_KINDS = ["reset"] as const;
export type PasswordTokenKind = (typeof PASSWORD_TOKEN_KINDS)[number];
