import { useState } from "react";
import { useSearchParams } from "react-router";
import { useForm, type FieldValues } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { api } from "@/lib/api";
import { Badge, Button, Field, Modal, PageHeader, Select, Tabs, useToast } from "@/components/ui";
import type { DataTableColumn } from "@/components/ui";
import { ResourcePage } from "@/components/resource/ResourcePage";
import { formatDate, formValuesToBody, resourceDefaults, ResourceFormField, statusTone } from "@/components/resource/fields";
import { PRIORITIES, TASK_STATUSES } from "@shared/enums";
import { TASK_FIELDS } from "./fields";
import { TaskModal } from "./TaskModal";

type TaskRow = {
  id: string;
  title: string;
  projectName?: string | null;
  status?: string | null;
  priority?: string | null;
  due?: string | null;
};

type CalendarTask = {
  id: string;
  title: string;
  status?: string | null;
  priority?: string | null;
  due?: string | null;
  projectName?: string | null;
};

type ProjectOption = { id: string; name: string };

const VIEWS = [
  { value: "kanban", label: "Kanban" },
  { value: "list", label: "Listă" },
  { value: "calendar", label: "Calendar" },
];

const columns: DataTableColumn<TaskRow>[] = [
  { key: "title", header: "Titlu", sortable: true },
  { key: "projectName", header: "Proiect", render: (row) => row.projectName ?? "—" },
  {
    key: "status",
    header: "Status",
    render: (row) => (row.status ? <Badge tone={statusTone(row.status)}>{row.status}</Badge> : "—"),
  },
  {
    key: "priority",
    header: "Prioritate",
    render: (row) => (row.priority ? <Badge tone={statusTone(row.priority)}>{row.priority}</Badge> : "—"),
  },
  { key: "due", header: "Scadență", render: (row) => formatDate(row.due) },
];

const statusOptions = TASK_STATUSES.map((status) => ({ value: status, label: status }));
const priorityOptions = PRIORITIES.map((priority) => ({ value: priority, label: priority }));

function isoDate(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

function NewTaskModal({ open, onClose }: { open: boolean; onClose(): void }) {
  const queryClient = useQueryClient();
  const toast = useToast();
  const form = useForm<FieldValues>({ defaultValues: resourceDefaults(TASK_FIELDS, null) });

  const createMutation = useMutation({
    mutationFn: (body: Record<string, unknown>) => api("/tasks", { method: "POST", body }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["resource", "/tasks"] });
      toast.success("Task creat");
      form.reset(resourceDefaults(TASK_FIELDS, null));
      onClose();
    },
    onError: (err) => toast.error(err instanceof Error && err.message ? err.message : "Nu am putut crea taskul"),
  });

  const onSubmit = form.handleSubmit((values) => {
    createMutation.mutate(formValuesToBody(TASK_FIELDS, values, false));
  });

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Task nou"
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>
            Anulează
          </Button>
          <Button onClick={onSubmit} loading={createMutation.isPending}>
            Creează
          </Button>
        </div>
      }
    >
      <form onSubmit={onSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {TASK_FIELDS.map((field) => (
          <ResourceFormField key={field.name} field={field} form={form} />
        ))}
      </form>
    </Modal>
  );
}

function KanbanView({
  filters,
  onOpenTask,
}: {
  filters: Record<string, string>;
  onOpenTask(taskId: string): void;
}) {
  const queryClient = useQueryClient();
  const toast = useToast();

  const tasksQuery = useQuery({
    queryKey: ["tasks", filters],
    // ponytail: primele 100 taskuri; paginare pe coloană dacă depășești
    queryFn: () => api<{ items: TaskRow[] }>("/tasks", { query: { pageSize: 100, ...filters } }),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api(`/tasks/${id}`, { method: "PATCH", body: { status } }),
    onMutate: async ({ id, status }) => {
      await queryClient.cancelQueries({ queryKey: ["tasks"] });
      const previous = queryClient.getQueriesData<{ items: TaskRow[] }>({ queryKey: ["tasks"] });
      queryClient.setQueriesData<{ items: TaskRow[] }>({ queryKey: ["tasks"] }, (old) =>
        old
          ? { ...old, items: old.items.map((task) => (task.id === id ? { ...task, status } : task)) }
          : old,
      );
      return { previous };
    },
    onError: (err, _variables, context) => {
      context?.previous?.forEach(([key, value]) => queryClient.setQueryData(key, value));
      toast.error(err instanceof Error && err.message ? err.message : "Nu am putut schimba statusul");
    },
    onSuccess: () => toast.success("Status actualizat"),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["resource", "/tasks"] });
    },
  });

  const items = tasksQuery.data?.items ?? [];

  return (
    <div className="flex gap-4 overflow-x-auto pb-2">
      {TASK_STATUSES.map((status) => {
        const columnTasks = items.filter((task) => task.status === status);
        return (
          <div
            key={status}
            className="flex w-72 shrink-0 flex-col gap-2 rounded-lg bg-sidebar p-3"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const taskId = e.dataTransfer.getData("text/plain");
              if (taskId) statusMutation.mutate({ id: taskId, status });
            }}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-text">{status}</h3>
              <span className="text-xs text-muted">{columnTasks.length}</span>
            </div>
            {columnTasks.map((task) => (
              <div
                key={task.id}
                draggable
                onDragStart={(e) => e.dataTransfer.setData("text/plain", task.id)}
                onClick={() => onOpenTask(task.id)}
                className="cursor-pointer space-y-1 rounded-md border border-line bg-card p-3 shadow-sm"
              >
                <p className="text-sm font-medium text-text">{task.title}</p>
                <p className="text-xs text-muted">{task.projectName ?? "—"}</p>
                <div className="flex items-center justify-between gap-2">
                  {task.priority ? <Badge tone={statusTone(task.priority)}>{task.priority}</Badge> : <span />}
                  <span className="text-xs text-muted">{formatDate(task.due)}</span>
                </div>
                <div onClick={(e) => e.stopPropagation()}>
                  <Select
                    value={task.status ?? ""}
                    options={statusOptions}
                    onChange={(e) => statusMutation.mutate({ id: task.id, status: e.target.value })}
                  />
                </div>
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}

function CalendarView({ onOpenTask }: { onOpenTask(taskId: string): void }) {
  const [month, setMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  const monthEnd = new Date(month.getFullYear(), month.getMonth() + 1, 0);
  const from = isoDate(month);
  const to = isoDate(monthEnd);

  const calendarQuery = useQuery({
    queryKey: ["tasks", "calendar", from, to],
    queryFn: () =>
      api<{ items: CalendarTask[] }>("/tasks/calendar", { query: { from, to } }),
  });

  const items = calendarQuery.data?.items ?? [];
  const leading = (month.getDay() + 6) % 7;
  const daysInMonth = monthEnd.getDate();
  const cells: (number | null)[] = [
    ...Array.from({ length: leading }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const todayIso = isoDate(new Date());
  const weekdayLabels = ["Lu", "Ma", "Mi", "Jo", "Vi", "Sâ", "Du"];
  const monthLabel = month.toLocaleDateString("ro-RO", { month: "long", year: "numeric" });

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="min-w-40 text-center text-sm font-semibold text-text">{monthLabel}</span>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
      <div className="grid grid-cols-7 gap-1">
        {weekdayLabels.map((label) => (
          <div key={label} className="pb-1 text-center text-xs font-semibold text-muted">
            {label}
          </div>
        ))}
        {cells.map((day, index) => {
          if (day === null) return <div key={`empty-${index}`} className="min-h-24 rounded-md bg-sidebar/50" />;
          const dayIso = isoDate(new Date(month.getFullYear(), month.getMonth(), day));
          const dayTasks = items.filter((task) => (task.due ?? "").slice(0, 10) === dayIso);
          return (
            <div
              key={dayIso}
              className={
                dayIso === todayIso
                  ? "min-h-24 space-y-1 rounded-md border border-primary bg-card p-1"
                  : "min-h-24 space-y-1 rounded-md border border-line bg-card p-1"
              }
            >
              <div className="text-right text-xs text-muted">{day}</div>
              {dayTasks.map((task) => (
                <button
                  key={task.id}
                  type="button"
                  onClick={() => onOpenTask(task.id)}
                  className="block w-full truncate rounded bg-bg px-1 py-0.5 text-left text-xs text-text hover:bg-sidebar"
                  title={`${task.title}${task.projectName ? ` — ${task.projectName}` : ""}`}
                >
                  {task.title}
                </button>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function TasksPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [projectId, setProjectId] = useState("");
  const [priority, setPriority] = useState("");
  const [openTaskId, setOpenTaskId] = useState<string | null>(null);
  const [newTaskOpen, setNewTaskOpen] = useState(false);

  const view = searchParams.get("view") ?? "kanban";

  const projectsQuery = useQuery({
    queryKey: ["projects", "options"],
    queryFn: () => api<{ items: ProjectOption[] }>("/projects", { query: { pageSize: 100 } }),
  });

  const filters: Record<string, string> = {};
  if (projectId) filters.projectId = projectId;
  if (priority) filters.priority = priority;

  const projectFilterOptions = [
    { value: "", label: "Toate proiectele" },
    ...(projectsQuery.data?.items ?? []).map((project) => ({ value: project.id, label: project.name })),
  ];
  const priorityFilterOptions = [{ value: "", label: "Toate prioritățile" }, ...priorityOptions];

  return (
    <div className="space-y-4">
      <PageHeader
        title="Taskuri"
        actions={
          view !== "list" ? <Button onClick={() => setNewTaskOpen(true)}>Task nou</Button> : undefined
        }
      />

      <div className="flex flex-wrap items-end gap-2">
        <div className="w-56">
          <Field label="Proiect" htmlFor="filter-project">
            <Select
              id="filter-project"
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              options={projectFilterOptions}
            />
          </Field>
        </div>
        <div className="w-56">
          <Field label="Prioritate" htmlFor="filter-priority">
            <Select
              id="filter-priority"
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              options={priorityFilterOptions}
            />
          </Field>
        </div>
      </div>

      <Tabs
        items={VIEWS}
        value={view}
        onChange={(next) => {
          const params = new URLSearchParams(searchParams);
          params.set("view", next);
          setSearchParams(params, { replace: true });
        }}
      />

      {view === "list" ? (
        <ResourcePage<TaskRow>
          embedded
          title="Taskuri"
          endpoint="/tasks"
          perm="tasks"
          itemName="task"
          fields={TASK_FIELDS}
          columns={columns}
          extraQuery={filters}
        />
      ) : view === "calendar" ? (
        <CalendarView onOpenTask={setOpenTaskId} />
      ) : (
        <KanbanView filters={filters} onOpenTask={setOpenTaskId} />
      )}

      {openTaskId ? (
        <TaskModal taskId={openTaskId} open onClose={() => setOpenTaskId(null)} />
      ) : null}

      <NewTaskModal open={newTaskOpen} onClose={() => setNewTaskOpen(false)} />
    </div>
  );
}
