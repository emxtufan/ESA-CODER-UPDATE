/**
 * Infrastructura (§7): servere, servicii instalate, domenii, certificate SSL și hosting.
 *
 * Fiecare tab e o listă `ResourcePage` încorporată peste endpoint-urile din
 * `server/modules/infra/routes.ts`; domeniile au în plus înregistrările DNS, într-un modal.
 */
import { useState } from "react";
import { useSearchParams } from "react-router";

import { Badge, Button, Modal, PageHeader, Tabs } from "@/components/ui";
import type { DataTableColumn } from "@/components/ui";
import { ResourcePage } from "@/components/resource/ResourcePage";
import { formatDate, formatMoney, statusTone, type FieldDef } from "@/components/resource/fields";
import { CURRENCIES, SERVER_PROVIDERS, SERVER_TYPES, SERVICE_NAMES } from "@shared/enums";

/** Un rând din listarea `GET /servers`. */
export type ServerRow = {
  id: string;
  name: string;
  ip: string | null;
  provider: string | null;
  type: string | null;
  status: string | null;
  renewalDate: string | null;
};

/** Un rând din listarea `GET /services` (`serverName` vine de la server). */
export type ServiceRow = {
  id: string;
  name: string;
  serverName: string | null;
  version: string | null;
  port: number | null;
  status: string | null;
};

/** Un rând din listarea `GET /domains` (`projectName` vine de la server). */
export type DomainRow = {
  id: string;
  domain: string;
  registrar: string | null;
  expirationDate: string | null;
  status: string | null;
  projectName: string | null;
};

/** Un rând din listarea `GET /ssl` (`domainName` vine de la server). */
export type SslRow = {
  id: string;
  domainId: string;
  domainName: string | null;
  issuer: string | null;
  expirationDate: string | null;
  status: string | null;
};

/** Un rând din listarea `GET /hosting` (`projectName` vine de la server). */
export type HostingRow = {
  id: string;
  provider: string;
  plan: string | null;
  monthlyCost: number | null;
  nextPaymentDate: string | null;
  paymentStatus: string | null;
  projectName: string | null;
};

/** Un rând din listarea `GET /dns-records`. */
export type DnsRow = {
  id: string;
  domainId: string;
  type: string;
  name: string;
  value: string;
  ttl: number | null;
};

/** Zilele rămase până la o dată (negativ = data a trecut); `null` dacă lipsește. */
function daysUntil(value: string | null | undefined): number | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return Math.ceil((date.getTime() - Date.now()) / (24 * 60 * 60 * 1000));
}

/** Data expirării, colorată: danger sub 14 zile, warning sub 30 de zile. */
function ExpiryDate({ value }: { value: string | null | undefined }) {
  const days = daysUntil(value);
  if (days === null) return <>—</>;
  if (days < 14) return <Badge tone="danger">{formatDate(value)}</Badge>;
  if (days < 30) return <Badge tone="warning">{formatDate(value)}</Badge>;
  return <>{formatDate(value)}</>;
}

/** Câmpurile serverului: exact cele din `serverSchema`. */
export const SERVER_FIELDS: FieldDef[] = [
  { name: "name", label: "Nume", type: "text", required: true },
  { name: "provider", label: "Furnizor", type: "select", options: SERVER_PROVIDERS, required: true },
  { name: "type", label: "Tip", type: "select", options: SERVER_TYPES, required: true },
  { name: "ip", label: "Adresă IP", type: "text" },
  { name: "os", label: "Sistem de operare", type: "text" },
  { name: "sshPort", label: "Port SSH", type: "number" },
  { name: "sshUsername", label: "Utilizator SSH", type: "text" },
  { name: "sshKeyRef", label: "Referință cheie SSH", type: "text" },
  { name: "location", label: "Locație", type: "text" },
  { name: "cpu", label: "CPU", type: "text" },
  { name: "ram", label: "RAM", type: "text" },
  { name: "disk", label: "Disk", type: "text" },
  { name: "status", label: "Status", type: "text" },
  { name: "purchaseDate", label: "Data achiziției", type: "date" },
  { name: "renewalDate", label: "Data reînnoirii", type: "date" },
  { name: "monthlyCost", label: "Cost lunar", type: "money" },
  { name: "currency", label: "Valută", type: "select", options: CURRENCIES },
  { name: "notes", label: "Note", type: "textarea", span: 2 },
];

/** Coloanele listării de servere. */
export const SERVER_COLUMNS: DataTableColumn<ServerRow>[] = [
  { key: "name", header: "Nume", sortable: true },
  { key: "ip", header: "IP", hideOnMobile: true, render: (row) => row.ip ?? "—" },
  { key: "provider", header: "Furnizor", sortable: true },
  { key: "type", header: "Tip" },
  {
    key: "status",
    header: "Status",
    render: (row) =>
      row.status ? <Badge tone={statusTone(row.status)}>{row.status}</Badge> : "—",
  },
  { key: "renewalDate", header: "Reînnoire", render: (row) => formatDate(row.renewalDate) },
];

/** Câmpurile serviciului instalat: exact cele din `serviceSchema`. */
export const SERVICE_FIELDS: FieldDef[] = [
  { name: "serverId", label: "Server", type: "relation", endpoint: "/servers", required: true },
  { name: "name", label: "Serviciu", type: "select", options: SERVICE_NAMES, required: true },
  { name: "version", label: "Versiune", type: "text" },
  { name: "port", label: "Port", type: "number" },
  { name: "status", label: "Status", type: "text" },
  { name: "configPath", label: "Cale configurație", type: "text" },
  { name: "projectId", label: "Proiect", type: "relation", endpoint: "/projects" },
  { name: "notes", label: "Note", type: "textarea", span: 2 },
];

/** Coloanele listării de servicii. */
export const SERVICE_COLUMNS: DataTableColumn<ServiceRow>[] = [
  { key: "name", header: "Serviciu", sortable: true },
  { key: "serverName", header: "Server", render: (row) => row.serverName ?? "—" },
  { key: "version", header: "Versiune", render: (row) => row.version ?? "—" },
  { key: "port", header: "Port", render: (row) => row.port ?? "—" },
  {
    key: "status",
    header: "Status",
    render: (row) =>
      row.status ? <Badge tone={statusTone(row.status)}>{row.status}</Badge> : "—",
  },
];

/** Câmpurile domeniului: exact cele din `domainSchema`. */
export const DOMAIN_FIELDS: FieldDef[] = [
  { name: "domain", label: "Domeniu", type: "text", required: true },
  { name: "registrar", label: "Registrar", type: "text" },
  { name: "registrationDate", label: "Data înregistrării", type: "date" },
  { name: "expirationDate", label: "Data expirării", type: "date" },
  { name: "autoRenewal", label: "Reînnoire automată", type: "checkbox" },
  { name: "dnsProvider", label: "Furnizor DNS", type: "text" },
  { name: "nameservers", label: "Nameservere", type: "tags" },
  { name: "projectId", label: "Proiect", type: "relation", endpoint: "/projects" },
  { name: "renewalCost", label: "Cost reînnoire", type: "money" },
  { name: "currency", label: "Valută", type: "select", options: CURRENCIES },
  { name: "status", label: "Status", type: "text" },
];

/** Coloanele listării de domenii. */
export const DOMAIN_COLUMNS: DataTableColumn<DomainRow>[] = [
  { key: "domain", header: "Domeniu", sortable: true },
  { key: "registrar", header: "Registrar", hideOnMobile: true, render: (row) => row.registrar ?? "—" },
  { key: "expirationDate", header: "Expiră", render: (row) => <ExpiryDate value={row.expirationDate} /> },
  {
    key: "status",
    header: "Status",
    render: (row) =>
      row.status ? <Badge tone={statusTone(row.status)}>{row.status}</Badge> : "—",
  },
  { key: "projectName", header: "Proiect", hideOnMobile: true, render: (row) => row.projectName ?? "—" },
];

/** Câmpurile certificatului SSL: exact cele din `sslSchema`. */
const SSL_FIELDS: FieldDef[] = [
  {
    name: "domainId",
    label: "Domeniu",
    type: "relation",
    endpoint: "/domains",
    labelKey: "domain",
    required: true,
  },
  { name: "issuer", label: "Emitent", type: "text" },
  { name: "issueDate", label: "Data emiterii", type: "date" },
  { name: "expirationDate", label: "Data expirării", type: "date" },
  { name: "autoRenewal", label: "Reînnoire automată", type: "checkbox" },
  { name: "status", label: "Status", type: "text" },
  { name: "lastCheckedAt", label: "Ultima verificare", type: "datetime" },
];

/** Coloanele listării de certificate SSL. */
const SSL_COLUMNS: DataTableColumn<SslRow>[] = [
  { key: "domainName", header: "Domeniu", render: (row) => row.domainName ?? "—" },
  { key: "issuer", header: "Emitent", render: (row) => row.issuer ?? "—" },
  { key: "expirationDate", header: "Expiră", render: (row) => <ExpiryDate value={row.expirationDate} /> },
  {
    key: "status",
    header: "Status",
    render: (row) =>
      row.status ? <Badge tone={statusTone(row.status)}>{row.status}</Badge> : "—",
  },
];

/** Câmpurile serviciului de hosting: exact cele din `hostingSchema`. */
export const HOSTING_FIELDS: FieldDef[] = [
  { name: "provider", label: "Furnizor", type: "text", required: true },
  { name: "plan", label: "Plan", type: "text" },
  { name: "monthlyCost", label: "Cost lunar", type: "money" },
  { name: "currency", label: "Valută", type: "select", options: CURRENCIES },
  { name: "billingCycle", label: "Ciclu de facturare", type: "text" },
  { name: "nextPaymentDate", label: "Următoarea plată", type: "date" },
  { name: "projectId", label: "Proiect", type: "relation", endpoint: "/projects" },
  { name: "paymentStatus", label: "Status plată", type: "text" },
];

/** Coloanele listării de hosting. */
export const HOSTING_COLUMNS: DataTableColumn<HostingRow>[] = [
  { key: "provider", header: "Furnizor", sortable: true },
  { key: "plan", header: "Plan", render: (row) => row.plan ?? "—" },
  { key: "monthlyCost", header: "Cost lunar", align: "right", render: (row) => formatMoney(row.monthlyCost) },
  { key: "nextPaymentDate", header: "Următoarea plată", render: (row) => formatDate(row.nextPaymentDate) },
  {
    key: "paymentStatus",
    header: "Status plată",
    render: (row) =>
      row.paymentStatus ? <Badge tone={statusTone(row.paymentStatus)}>{row.paymentStatus}</Badge> : "—",
  },
  { key: "projectName", header: "Proiect", hideOnMobile: true, render: (row) => row.projectName ?? "—" },
];

/** Câmpurile înregistrării DNS: exact cele din `dnsSchema` (fără `domainId`, fixat). */
const DNS_FIELDS: FieldDef[] = [
  { name: "type", label: "Tip", type: "text", required: true, hint: "A, AAAA, CNAME, MX, TXT…" },
  { name: "name", label: "Nume", type: "text", required: true },
  { name: "value", label: "Valoare", type: "text", required: true, span: 2 },
  { name: "ttl", label: "TTL (secunde)", type: "number" },
];

/** Coloanele listării de înregistrări DNS. */
const DNS_COLUMNS: DataTableColumn<DnsRow>[] = [
  { key: "type", header: "Tip" },
  { key: "name", header: "Nume" },
  { key: "value", header: "Valoare" },
  { key: "ttl", header: "TTL", hideOnMobile: true, render: (row) => row.ttl ?? "—" },
];

/** Domeniile plus modalul cu înregistrările DNS ale rândului ales. */
function DomainsTab() {
  const [dnsDomain, setDnsDomain] = useState<DomainRow | null>(null);

  return (
    <>
      <ResourcePage<DomainRow>
        title="Domenii"
        endpoint="/domains"
        perm="infrastructure"
        itemName="domeniu"
        columns={DOMAIN_COLUMNS}
        fields={DOMAIN_FIELDS}
        rowActions={(row) => (
          <Button variant="ghost" size="sm" onClick={() => setDnsDomain(row)}>
            DNS
          </Button>
        )}
        embedded
      />

      <Modal
        open={dnsDomain !== null}
        onClose={() => setDnsDomain(null)}
        title={dnsDomain ? `Înregistrări DNS — ${dnsDomain.domain}` : "Înregistrări DNS"}
        className="max-w-4xl"
      >
        {dnsDomain ? (
          <ResourcePage<DnsRow>
            title="Înregistrări DNS"
            endpoint="/dns-records"
            perm="infrastructure"
            itemName="înregistrare DNS"
            columns={DNS_COLUMNS}
            fields={DNS_FIELDS}
            extraQuery={{ domainId: dnsDomain.id }}
            defaults={{ domainId: dnsDomain.id }}
            embedded
          />
        ) : null}
      </Modal>
    </>
  );
}

/** Taburile infrastructurii, în ordinea din specificație. */
const TAB_ITEMS = [
  { value: "servers", label: "Servere" },
  { value: "services", label: "Servicii" },
  { value: "domains", label: "Domenii" },
  { value: "ssl", label: "SSL" },
  { value: "hosting", label: "Hosting" },
];

export default function InfrastructurePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const requested = searchParams.get("tab");
  const activeTab: string = TAB_ITEMS.some((tab) => tab.value === requested) ? (requested as string) : "servers";

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Infrastructură"
        description="Servere, servicii instalate, domenii, certificate SSL și servicii de hosting."
        breadcrumbs={[{ label: "Infrastructură" }]}
      />

      <Tabs
        items={TAB_ITEMS}
        value={activeTab}
        onChange={(value) => {
          const next = new URLSearchParams(searchParams);
          next.set("tab", value);
          setSearchParams(next);
        }}
      />

      {activeTab === "servers" ? (
        <ResourcePage<ServerRow>
          title="Servere"
          endpoint="/servers"
          perm="infrastructure"
          itemName="server"
          columns={SERVER_COLUMNS}
          fields={SERVER_FIELDS}
          embedded
        />
      ) : null}

      {activeTab === "services" ? (
        <ResourcePage<ServiceRow>
          title="Servicii"
          endpoint="/services"
          perm="infrastructure"
          itemName="serviciu"
          columns={SERVICE_COLUMNS}
          fields={SERVICE_FIELDS}
          embedded
        />
      ) : null}

      {activeTab === "domains" ? <DomainsTab /> : null}

      {activeTab === "ssl" ? (
        <ResourcePage<SslRow>
          title="Certificate SSL"
          endpoint="/ssl"
          perm="infrastructure"
          itemName="certificat SSL"
          columns={SSL_COLUMNS}
          fields={SSL_FIELDS}
          embedded
        />
      ) : null}

      {activeTab === "hosting" ? (
        <ResourcePage<HostingRow>
          title="Hosting"
          endpoint="/hosting"
          perm="infrastructure"
          itemName="serviciu de hosting"
          columns={HOSTING_COLUMNS}
          fields={HOSTING_FIELDS}
          embedded
        />
      ) : null}
    </div>
  );
}
