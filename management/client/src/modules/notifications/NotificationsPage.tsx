/**
 * Centrul de notificări: starea emailului, inbox cu citire, reguli, șabloane și jurnal de trimiteri.
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, Mail } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router";

import { ResourcePage } from "@/components/resource/ResourcePage";
import { formatDate, statusTone } from "@/components/resource/fields";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  PageHeader,
  Pagination,
  Skeleton,
  Tabs,
  cn,
  useToast,
} from "@/components/ui";
import { api } from "@/lib/api";
import { useCan } from "@/lib/auth";
import { NOTIFICATION_EVENTS } from "@shared/enums";

type TabValue = "inbox" | "rules" | "templates" | "logs";

type NotificationItem = {
  id: string;
  title: string;
  body: string | null;
  link: string | null;
  readAt: string | null;
  createdAt: string;
};

type NotificationsList = {
  items: NotificationItem[];
  total: number;
  page: number;
  pageSize: number;
};

type NotificationRule = {
  id: string;
  event: string;
  recipients: string[] | null;
  enabled: boolean;
  frequencyMinutes: number;
  maxRetries: number;
};

type EmailTemplate = {
  id: string;
  event: string;
  subject: string;
  enabled: boolean;
};

type NotificationLog = {
  id: string;
  event: string;
  recipient: string;
  status: string;
  attempts: number;
  error: string | null;
  sentAt: string | null;
};

export default function NotificationsPage() {
  const [tab, setTab] = useState<TabValue>("inbox");
  const [page, setPage] = useState(1);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const toast = useToast();
  const canView = useCan("notifications.view");
  const canUpdate = useCan("notifications.update");

  const statusQuery = useQuery({
    queryKey: ["notifications", "status"],
    queryFn: () => api<{ email: boolean }>("/notifications/status"),
  });
  const emailReady = statusQuery.data?.email === true;

  const inboxQuery = useQuery({
    queryKey: ["notifications", page],
    queryFn: () => api<NotificationsList>("/notifications", { query: { page } }),
    enabled: tab === "inbox",
  });

  const invalidateNotifications = () => {
    queryClient.invalidateQueries({ queryKey: ["notifications"] });
    queryClient.invalidateQueries({ queryKey: ["unread-count"] });
  };

  const testMutation = useMutation({
    mutationFn: () => api<{ message?: string }>("/notifications/test", { method: "POST" }),
    onSuccess: (data) => {
      toast.success(data?.message ?? "Email de test trimis.");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Trimiterea emailului de test a eșuat.");
    },
  });

  const readMutation = useMutation({
    mutationFn: (item: NotificationItem) => api<void>(`/notifications/${item.id}/read`, { method: "POST" }),
    onSuccess: (_data, item) => {
      invalidateNotifications();
      if (item.link) navigate(item.link);
    },
    onError: () => {
      toast.error("Notificarea nu a putut fi marcată ca citită.");
    },
  });

  const readAllMutation = useMutation({
    mutationFn: () => api<void>("/notifications/read-all", { method: "POST" }),
    onSuccess: () => {
      invalidateNotifications();
      toast.success("Toate notificările au fost marcate ca citite.");
    },
    onError: () => {
      toast.error("Notificările nu au putut fi marcate ca citite.");
    },
  });

  const inbox = inboxQuery.data;

  const tabs = [
    { value: "inbox", label: "Primite" },
    ...(canView
      ? [
          { value: "rules", label: "Reguli" },
          { value: "templates", label: "Șabloane" },
          { value: "logs", label: "Jurnal" },
        ]
      : []),
  ];

  return (
    <div className="space-y-4">
      <PageHeader title="Notificări" />

      <Card bodyClassName="flex flex-wrap items-center gap-3">
        {statusQuery.isLoading ? (
          <Skeleton className="h-5 w-40" />
        ) : emailReady ? (
          <Badge tone="success">Email conectat</Badge>
        ) : (
          <Badge tone="neutral">Email neconfigurat: setează RESEND_API_KEY și EMAIL_FROM</Badge>
        )}

        {canUpdate ? (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => testMutation.mutate()}
            loading={testMutation.isPending}
            disabled={!emailReady}
          >
            <Mail aria-hidden="true" className="size-4" />
            Trimite email de test
          </Button>
        ) : null}
      </Card>

      <Tabs items={tabs} value={tab} onChange={(value) => setTab(value as TabValue)} />

      {tab === "inbox" ? (
        <section className="space-y-3">
          <div className="flex justify-end">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => readAllMutation.mutate()}
              loading={readAllMutation.isPending}
            >
              Marchează tot ca citit
            </Button>
          </div>

          {inboxQuery.isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : inboxQuery.isError ? (
            <ErrorState error={inboxQuery.error} onRetry={() => void inboxQuery.refetch()} />
          ) : !inbox || inbox.items.length === 0 ? (
            <EmptyState icon={Bell} title="Nicio notificare" />
          ) : (
            <>
              <ul className="divide-y divide-line overflow-hidden rounded-md border border-line bg-card">
                {inbox.items.map((item) => (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => readMutation.mutate(item)}
                      className="flex w-full flex-col gap-1 px-4 py-3 text-left transition-colors hover:bg-sidebar"
                    >
                      <span className="flex flex-wrap items-baseline justify-between gap-2">
                        <span className={cn("text-sm text-text", item.readAt ? undefined : "font-semibold")}>
                          {item.title}
                        </span>
                        <span className="text-xs text-muted">{formatDate(item.createdAt)}</span>
                      </span>
                      {item.body ? <span className="text-sm text-muted">{item.body}</span> : null}
                    </button>
                  </li>
                ))}
              </ul>
              <Pagination page={inbox.page} pageSize={inbox.pageSize} total={inbox.total} onPage={setPage} />
            </>
          )}
        </section>
      ) : null}

      {tab === "rules" ? (
        <ResourcePage<NotificationRule>
          embedded
          title="Reguli de notificare"
          description="Fără regulă: email pentru evenimentele importante, doar în aplicație pentru cele produse de tine."
          endpoint="/notification-rules"
          perm="notifications"
          itemName="regulă"
          columns={[
            { key: "event", header: "Eveniment" },
            {
              key: "recipients",
              header: "Destinatari",
              render: (row) =>
                row.recipients && row.recipients.length > 0 ? row.recipients.join(", ") : "Proprietar",
            },
            { key: "enabled", header: "Activă", render: (row) => (row.enabled ? "Da" : "Nu") },
            { key: "frequencyMinutes", header: "Frecvență (minute)" },
            { key: "maxRetries", header: "Reîncercări maxime" },
          ]}
          fields={[
            { name: "event", label: "Eveniment", type: "select", options: NOTIFICATION_EVENTS, required: true },
            { name: "recipients", label: "Destinatari", type: "tags", hint: "Gol = proprietarul" },
            { name: "enabled", label: "Activă", type: "checkbox" },
            { name: "frequencyMinutes", label: "Frecvență (minute)", type: "number" },
            { name: "maxRetries", label: "Reîncercări maxime", type: "number" },
          ]}
        />
      ) : null}

      {tab === "templates" ? (
        <ResourcePage<EmailTemplate>
          embedded
          title="Șabloane de email"
          description="Variabile: {{title}}, {{body}}, {{link}}."
          endpoint="/email-templates"
          perm="notifications"
          itemName="șablon"
          columns={[
            { key: "event", header: "Eveniment" },
            { key: "subject", header: "Subiect" },
            { key: "enabled", header: "Activ", render: (row) => (row.enabled ? "Da" : "Nu") },
          ]}
          fields={[
            { name: "event", label: "Eveniment", type: "select", options: NOTIFICATION_EVENTS, required: true },
            { name: "subject", label: "Subiect", type: "text", required: true },
            { name: "html", label: "HTML", type: "textarea", required: true, span: 2 },
            { name: "enabled", label: "Activ", type: "checkbox" },
          ]}
        />
      ) : null}

      {tab === "logs" ? (
        <ResourcePage<NotificationLog>
          embedded
          readOnly
          title="Jurnal de notificări"
          endpoint="/notification-logs"
          perm="notifications"
          itemName="intrare"
          fields={[]}
          columns={[
            { key: "event", header: "Eveniment" },
            { key: "recipient", header: "Destinatar" },
            {
              key: "status",
              header: "Status",
              render: (row) => <Badge tone={statusTone(row.status)}>{row.status}</Badge>,
            },
            { key: "attempts", header: "Încercări" },
            { key: "error", header: "Eroare" },
            { key: "sentAt", header: "Trimis la", render: (row) => formatDate(row.sentAt) },
          ]}
          filters={[
            { name: "event", label: "Eveniment", options: NOTIFICATION_EVENTS },
            { name: "status", label: "Status" },
          ]}
        />
      ) : null}
    </div>
  );
}
