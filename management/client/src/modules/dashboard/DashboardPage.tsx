/** Dashboard (§4): totul vine din baza de date; sumele rămân separate pe monedă. */
import { useQuery } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { Link } from "react-router";
import { formatDate, formatMoney, statusTone } from "@/components/resource/fields";
import { Badge, Card, EmptyState, ErrorState, PageHeader, Select, Skeleton } from "@/components/ui";
import { api } from "@/lib/api";
import { useCan } from "@/lib/auth";
import { readRecent } from "@/lib/recent";
import { GrowthChart, InvoiceBar, MoneyChart, StatusChart, type MoneyPoint } from "./charts";

interface CurrencyRow {
  currency: string;
  revenue: number;
  collected: number;
  outstanding: number;
  expenses: number;
  profit: number;
  monthRevenue: number;
  series: MoneyPoint[];
}

interface Dashboard {
  projects: {
    total: number;
    active: number;
    development: number;
    maintenance: number;
    suspended: number;
    clients: number;
    byStatus: { status: string; count: number }[];
    growth: { month: string; count: number }[];
    deadlines: { id: string; name: string; deadline: string; status: string }[];
  } | null;
  finance: {
    currencies: CurrencyRow[];
    invoices: { paid: number; unpaid: number; overdue: number };
    pending: { id: string; number: string; dueDate: string; balance: number; currency: string; status: string; client: string }[];
  } | null;
  tasks: {
    active: number;
    urgent: number;
    attention: { id: string; title: string; due: string | null; priority: string; status: string; projectId: string | null; project: string | null }[];
  } | null;
  infrastructure: {
    domains: { id: string; domain: string; expirationDate: string }[];
    ssl: { id: string; domain: string; expirationDate: string }[];
  } | null;
  monitoring: {
    down: { id: string; url: string }[];
    incidents: { id: string; name: string; severity: string; startedAt: string }[];
  } | null;
  development: {
    commits: { id: string; hash: string; message: string | null; date: string | null; repository: string }[] | null;
    deployments: { id: string; status: string; environment: string | null; deployedAt: string; projectId: string; project: string }[] | null;
  };
  recentActivity: { id: string; description: string; at: string; projectId: string | null }[] | null;
  integrations: { email: boolean; githubToken: boolean; githubWebhook: boolean; vault: boolean; fileSigning: boolean };
}

interface Favorite {
  id: string;
  name: string;
}

function Stat({ label, value, to }: { label: string; value: ReactNode; to: string }) {
  return (
    <Link to={to} className="rounded-2xl bg-card p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_4px_16px_rgba(0,0,0,0.04)] transition-colors hover:border-primary">
      <p className="text-xs text-muted">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-text">{value}</p>
    </Link>
  );
}

function List<T>({ title, to, items, empty, render }: { title: string; to: string; items: T[] | null | undefined; empty: string; render: (item: T) => { key: string; to: string; main: ReactNode; side?: ReactNode } }) {
  if (!items) return null;
  return (
    <Card title={<Link to={to} className="hover:text-primary">{title}</Link>} className="min-w-0">
      {items.length === 0 ? (
        <p className="text-sm text-muted">{empty}</p>
      ) : (
        <ul className="divide-y divide-line">
          {items.map((item) => {
            const row = render(item);
            return (
              <li key={row.key}>
                <Link to={row.to} className="flex items-center justify-between gap-3 py-2 text-sm hover:text-primary">
                  <span className="min-w-0 break-words text-text">{row.main}</span>
                  {row.side ? <span className="shrink-0 text-xs text-muted">{row.side}</span> : null}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}

function Connection({ label, on, hint }: { label: string; on: boolean; hint: string }) {
  return (
    <span title={on ? undefined : hint}>
      <Badge tone={on ? "success" : "neutral"}>
        {label}: {on ? "conectat" : "neconectat"}
      </Badge>
    </span>
  );
}

const alertTone = (side: string): "danger" | "warning" =>
  side === "Căzut" || side === "Critical" || side === "High" ? "danger" : "warning";

const QUICK_ACTIONS = [
  { label: "Proiect nou", to: "/projects?new=1", perm: "projects.create" },
  { label: "Client nou", to: "/clients?new=1", perm: "clients.create" },
  { label: "Taskuri", to: "/tasks", perm: "tasks.view" },
  { label: "Factură", to: "/finance", perm: "finance.view" },
  { label: "Seif", to: "/vault", perm: "vault.view" },
];

function QuickAction({ label, to, perm }: { label: string; to: string; perm: string }) {
  const allowed = useCan(perm);
  if (!allowed) return null;
  return (
    <Link to={to} className="rounded-lg border border-line px-3 py-1.5 text-sm text-text transition-colors hover:border-primary hover:text-primary">
      {label}
    </Link>
  );
}

export default function DashboardPage() {
  const query = useQuery({ queryKey: ["dashboard"], queryFn: () => api<Dashboard>("/dashboard") });
  const favorites = useQuery({ queryKey: ["favorites"], queryFn: () => api<{ items: Favorite[] }>("/projects/favorites/mine") });
  const [currency, setCurrency] = useState<string | null>(null);
  const recent = readRecent();

  if (query.isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <PageHeader title="Dashboard" />
        <Skeleton className="h-24" />
        <Skeleton className="h-64" />
      </div>
    );
  }
  if (query.error || !query.data) return <ErrorState error={query.error} onRetry={() => void query.refetch()} />;

  const data = query.data;
  const money = data.finance?.currencies ?? [];
  const selected = money.find((m) => m.currency === currency) ?? money[0];
  const isEmpty = (data.projects?.total ?? 0) === 0 && money.length === 0;
  const alerts = [...(data.monitoring?.down ?? []).map((d) => ({ key: d.id, main: `${d.url} nu răspunde`, side: "Căzut" })), ...(data.monitoring?.incidents ?? []).map((i) => ({ key: i.id, main: i.name, side: i.severity }))];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Dashboard"
        description="Situația curentă, calculată din datele introduse."
        actions={
          <div className="flex flex-wrap gap-2">
            {QUICK_ACTIONS.map((action) => (
              <QuickAction key={action.to} {...action} />
            ))}
          </div>
        }
      />

      <div className="flex flex-wrap gap-2">
        <Connection label="Email" on={data.integrations.email} hint="Setează RESEND_API_KEY și EMAIL_FROM" />
        <Connection label="GitHub" on={data.integrations.githubToken} hint="Setează GITHUB_TOKEN" />
        <Connection label="Webhook" on={data.integrations.githubWebhook} hint="Setează GITHUB_WEBHOOK_SECRET" />
        <Connection label="Seif" on={data.integrations.vault} hint="Setează VAULT_MASTER_KEY" />
        <Connection label="Linkuri semnate" on={data.integrations.fileSigning} hint="Setează FILE_SIGNING_KEY" />
      </div>

      {isEmpty ? (
        <EmptyState title="Încă nu există date" description="Adaugă un client și un proiect; dashboard-ul se completează singur." />
      ) : null}

      {data.projects ? (
        <section className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
          <Stat label="Proiecte" value={data.projects.total} to="/projects" />
          <Stat label="Active" value={data.projects.active} to="/projects" />
          <Stat label="În dezvoltare" value={data.projects.development} to="/projects?status=In+Development" />
          <Stat label="Mentenanță" value={data.projects.maintenance} to="/projects?status=Active+Maintenance" />
          <Stat label="Suspendate" value={data.projects.suspended} to="/projects?status=Suspended" />
          <Stat label="Clienți" value={data.projects.clients} to="/clients" />
        </section>
      ) : null}

      {data.tasks || data.finance ? (
        <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {data.tasks ? <Stat label="Taskuri active" value={data.tasks.active} to="/tasks" /> : null}
          {data.tasks ? <Stat label="Taskuri urgente" value={data.tasks.urgent} to="/tasks" /> : null}
          {data.finance ? <Stat label="Facturi neachitate" value={data.finance.invoices.unpaid + data.finance.invoices.overdue} to="/finance?status=Issued" /> : null}
          {data.finance ? <Stat label="Facturi restante" value={data.finance.invoices.overdue} to="/finance?status=Overdue" /> : null}
        </section>
      ) : null}

      {money.length > 0 ? (
        <section className="grid grid-cols-1 gap-3 lg:grid-cols-2 xl:grid-cols-3">
          {money.map((m) => (
            <Card key={m.currency} title={`Financiar ${m.currency}`} className="min-w-0">
              <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                {[
                  ["Venit total", m.revenue],
                  ["Venit luna asta", m.monthRevenue],
                  ["Încasat", m.collected],
                  ["De încasat", m.outstanding],
                  ["Cheltuieli", m.expenses],
                  ["Profit estimat", m.profit],
                ].map(([label, value]) => (
                  <div key={label as string}>
                    <dt className="text-xs text-muted">{label}</dt>
                    <dd className="font-medium text-text">{formatMoney(value as number, m.currency)}</dd>
                  </div>
                ))}
              </dl>
            </Card>
          ))}
        </section>
      ) : null}

      <section className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        {selected ? (
          <Card
            className="min-w-0"
            title={`Venituri și cheltuieli lunare, ${selected.currency}`}
            actions={
              money.length > 1 ? (
                <Select
                  aria-label="Monedă"
                  value={selected.currency}
                  options={money.map((m) => ({ value: m.currency, label: m.currency }))}
                  onChange={(event) => setCurrency(event.target.value)}
                />
              ) : undefined
            }
          >
            <MoneyChart data={selected.series} format={(minor) => formatMoney(minor, selected.currency)} />
          </Card>
        ) : null}
        {data.finance && data.finance.invoices.paid + data.finance.invoices.unpaid + data.finance.invoices.overdue > 0 ? (
          <Card title="Facturi plătite și neachitate" className="min-w-0">
            <InvoiceBar {...data.finance.invoices} />
          </Card>
        ) : null}
        {data.projects && data.projects.total > 0 ? (
          <Card title="Proiecte noi pe lună" className="min-w-0">
            <GrowthChart data={data.projects.growth} />
          </Card>
        ) : null}
        {data.projects && data.projects.total > 0 ? (
          <Card title="Proiecte pe status" className="min-w-0">
            <StatusChart data={data.projects.byStatus} />
          </Card>
        ) : null}
      </section>

      <section className="grid grid-cols-1 gap-3 lg:grid-cols-2 xl:grid-cols-3">
        {favorites.data && favorites.data.items.length > 0 ? (
          <List title="Favorite" to="/projects" items={favorites.data.items} empty="" render={(p) => ({ key: p.id, to: `/projects/${p.id}`, main: p.name })} />
        ) : null}
        {recent.length > 0 ? (
          <List title="Deschise recent" to="/projects" items={recent} empty="" render={(r) => ({ key: r.to, to: r.to, main: r.label })} />
        ) : null}
        <List title="Taskuri care cer atenție" to="/tasks" items={data.tasks?.attention} empty="Nimic urgent." render={(t) => ({ key: t.id, to: t.projectId ? `/projects/${t.projectId}?tab=tasks` : "/tasks", main: t.title, side: t.due ? formatDate(t.due) : t.priority })} />
        <List title="Termene apropiate" to="/projects" items={data.projects?.deadlines} empty="Niciun termen în 30 de zile." render={(p) => ({ key: p.id, to: `/projects/${p.id}`, main: p.name, side: formatDate(p.deadline) })} />
        <List title="Plăți în așteptare" to="/finance" items={data.finance?.pending} empty="Nicio factură neachitată." render={(i) => ({ key: i.id, to: "/finance", main: `${i.number} · ${i.client}`, side: formatMoney(i.balance, i.currency) })} />
        <List title="Alerte" to="/monitoring" items={data.monitoring ? alerts : null} empty="Nicio alertă." render={(a) => ({ key: a.key, to: "/monitoring", main: a.main, side: <Badge tone={alertTone(a.side)}>{a.side}</Badge> })} />
        <List title="Domenii care expiră" to="/infrastructure?tab=domains" items={data.infrastructure?.domains} empty="Niciun domeniu în 30 de zile." render={(d) => ({ key: d.id, to: "/infrastructure?tab=domains", main: d.domain, side: formatDate(d.expirationDate) })} />
        <List title="Certificate SSL care expiră" to="/infrastructure?tab=domains" items={data.infrastructure?.ssl} empty="Niciun certificat în 30 de zile." render={(s) => ({ key: s.id, to: "/infrastructure?tab=domains", main: s.domain, side: formatDate(s.expirationDate) })} />
        <List title="Commit-uri recente" to="/github?tab=commits" items={data.development.commits} empty="Niciun commit încă." render={(c) => ({ key: c.id, to: "/github?tab=commits", main: `${c.repository}: ${c.message ?? c.hash.slice(0, 7)}`, side: c.date ? formatDate(c.date) : undefined })} />
        <List title="Deployment-uri recente" to="/deployments" items={data.development.deployments} empty="Niciun deployment încă." render={(d) => ({ key: d.id, to: `/projects/${d.projectId}?tab=development`, main: `${d.project} · ${d.environment ?? "—"}`, side: <Badge tone={statusTone(d.status)}>{d.status}</Badge> })} />
        <List title="Activitate recentă" to="/projects" items={data.recentActivity} empty="Nicio activitate încă." render={(a) => ({ key: a.id, to: a.projectId ? `/projects/${a.projectId}?tab=timeline` : "/projects", main: a.description, side: formatDate(a.at) })} />
      </section>
    </div>
  );
}
