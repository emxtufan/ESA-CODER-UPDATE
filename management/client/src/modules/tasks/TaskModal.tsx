import { useEffect, useState } from "react";
import { useForm, type FieldValues } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Button, Field, Modal, Select, Spinner, Textarea, useToast } from "@/components/ui";
import { formatDate, formValuesToBody, resourceDefaults, ResourceFormField } from "@/components/resource/fields";
import { TASK_FIELDS } from "./fields";

export type TaskModalProps = {
  taskId: string;
  open: boolean;
  onClose(): void;
};

type TaskItem = {
  id: string;
  title?: string | null;
  status?: string | null;
  priority?: string | null;
  due?: string | null;
  projectName?: string | null;
};

type CommentItem = {
  id: string;
  body: string;
  authorName: string | null;
  createdAt: string;
};

type DependencyItem = {
  id: string;
  title: string;
  status: string | null;
};

function errorMessage(err: unknown, fallback: string): string {
  return err instanceof Error && err.message ? err.message : fallback;
}

export function TaskModal({ taskId, open, onClose }: TaskModalProps) {
  const queryClient = useQueryClient();
  const toast = useToast();
  const form = useForm<FieldValues>({ defaultValues: resourceDefaults(TASK_FIELDS, null) });
  const [commentBody, setCommentBody] = useState("");
  const [dependsOnId, setDependsOnId] = useState("");

  const taskQuery = useQuery({
    queryKey: ["tasks", taskId],
    queryFn: () => api<{ item: TaskItem }>(`/tasks/${taskId}`),
    enabled: open && !!taskId,
  });
  const item = taskQuery.data?.item ?? null;

  useEffect(() => {
    if (!open) return;
    form.reset(resourceDefaults(TASK_FIELDS, item as Record<string, unknown> | null));
  }, [open, item, form]);

  const saveMutation = useMutation({
    mutationFn: (body: Record<string, unknown>) => api(`/tasks/${taskId}`, { method: "PATCH", body }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["resource", "/tasks"] });
      toast.success("Task actualizat");
      onClose();
    },
    onError: (err) => toast.error(errorMessage(err, "Nu am putut salva taskul")),
  });

  const commentsQuery = useQuery({
    queryKey: ["comments", "task", taskId],
    queryFn: () =>
      api<{ items: CommentItem[] }>("/comments", { query: { entityType: "task", entityId: taskId } }),
    enabled: open && !!taskId,
  });

  const addCommentMutation = useMutation({
    mutationFn: (body: string) => api("/comments", { method: "POST", body: { entityType: "task", entityId: taskId, body } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments"] });
      setCommentBody("");
      toast.success("Comentariu adăugat");
    },
    onError: (err) => toast.error(errorMessage(err, "Nu am putut adăuga comentariul")),
  });

  const dependenciesQuery = useQuery({
    queryKey: ["task-dependencies", taskId],
    queryFn: () => api<{ items: DependencyItem[] }>(`/tasks/${taskId}/dependencies`),
    enabled: open && !!taskId,
  });

  const taskOptionsQuery = useQuery({
    queryKey: ["tasks", "options"],
    queryFn: () => api<{ items: TaskItem[] }>("/tasks", { query: { pageSize: 100 } }),
    enabled: open,
  });

  const addDependencyMutation = useMutation({
    mutationFn: () => api(`/tasks/${taskId}/dependencies`, { method: "POST", body: { dependsOnId } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["task-dependencies", taskId] });
      setDependsOnId("");
      toast.success("Dependență adăugată");
    },
    onError: (err) => toast.error(errorMessage(err, "Nu am putut adăuga dependența")),
  });

  const removeDependencyMutation = useMutation({
    mutationFn: (depId: string) => api(`/tasks/${taskId}/dependencies/${depId}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["task-dependencies", taskId] });
      toast.success("Dependență eliminată");
    },
    onError: (err) => toast.error(errorMessage(err, "Nu am putut elimina dependența")),
  });

  const onSubmit = form.handleSubmit((values) => {
    saveMutation.mutate(formValuesToBody(TASK_FIELDS, values, true));
  });

  const dependencies = dependenciesQuery.data?.items ?? [];
  const dependencyOptions = (taskOptionsQuery.data?.items ?? [])
    .filter((task) => task.id !== taskId && !dependencies.some((dep) => dep.id === task.id))
    .map((task) => ({ value: task.id, label: task.title ?? task.id }));

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={item?.title ? `Task: ${item.title}` : "Task"}
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>
            Anulează
          </Button>
          <Button onClick={onSubmit} loading={saveMutation.isPending}>
            Salvează
          </Button>
        </div>
      }
    >
      {taskQuery.isLoading ? (
        <div className="flex justify-center py-8">
          <Spinner />
        </div>
      ) : taskQuery.error ? (
        <p className="text-sm text-danger-600">{errorMessage(taskQuery.error, "Nu am putut încărca taskul")}</p>
      ) : (
        <div className="space-y-8">
          <form onSubmit={onSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {TASK_FIELDS.map((field) => (
              <ResourceFormField key={field.name} field={field} form={form} />
            ))}
          </form>

          <section className="space-y-3">
            <h3 className="text-sm font-semibold text-neutral-800">Comentarii</h3>
            {commentsQuery.isLoading ? (
              <div className="flex justify-center py-4">
                <Spinner />
              </div>
            ) : commentsQuery.error ? (
              <p className="text-sm text-danger-600">{errorMessage(commentsQuery.error, "Nu am putut încărca comentariile")}</p>
            ) : (commentsQuery.data?.items ?? []).length === 0 ? (
              <p className="text-sm text-neutral-500">Niciun comentariu.</p>
            ) : (
              <ul className="space-y-2">
                {(commentsQuery.data?.items ?? []).map((comment) => (
                  <li key={comment.id} className="rounded-md border border-neutral-200 p-3">
                    <div className="flex items-center justify-between gap-2 text-xs text-neutral-500">
                      <span>{comment.authorName ?? "—"}</span>
                      <span>{formatDate(comment.createdAt)}</span>
                    </div>
                    <p className="mt-1 whitespace-pre-line text-sm text-neutral-800">{comment.body}</p>
                  </li>
                ))}
              </ul>
            )}
            <Field label="Comentariu nou" htmlFor="task-comment">
              <Textarea
                id="task-comment"
                rows={3}
                value={commentBody}
                onChange={(e) => setCommentBody(e.target.value)}
              />
            </Field>
            <Button
              variant="secondary"
              size="sm"
              disabled={!commentBody.trim()}
              loading={addCommentMutation.isPending}
              onClick={() => addCommentMutation.mutate(commentBody.trim())}
            >
              Adaugă comentariu
            </Button>
          </section>

          <section className="space-y-3">
            <h3 className="text-sm font-semibold text-neutral-800">Dependențe</h3>
            {dependenciesQuery.isLoading ? (
              <div className="flex justify-center py-4">
                <Spinner />
              </div>
            ) : dependencies.length === 0 ? (
              <p className="text-sm text-neutral-500">Nicio dependență.</p>
            ) : (
              <ul className="space-y-2">
                {dependencies.map((dep) => (
                  <li
                    key={dep.id}
                    className="flex items-center justify-between gap-2 rounded-md border border-neutral-200 p-3"
                  >
                    <span className="text-sm text-neutral-800">{dep.title}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-neutral-500">{dep.status ?? "—"}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        loading={removeDependencyMutation.isPending}
                        onClick={() => removeDependencyMutation.mutate(dep.id)}
                      >
                        Elimină
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <Field label="Adaugă dependență" htmlFor="task-dependency">
                  <Select
                    id="task-dependency"
                    value={dependsOnId}
                    onChange={(e) => setDependsOnId(e.target.value)}
                    options={dependencyOptions}
                    placeholder="Alege un task"
                  />
                </Field>
              </div>
              <Button
                variant="secondary"
                disabled={!dependsOnId}
                loading={addDependencyMutation.isPending}
                onClick={() => addDependencyMutation.mutate()}
              >
                Adaugă
              </Button>
            </div>
          </section>
        </div>
      )}
    </Modal>
  );
}
