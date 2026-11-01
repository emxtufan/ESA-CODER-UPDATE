import { useState } from "react";
import { useParams, useSearchParams } from "react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import type { FieldValues } from "react-hook-form";
import { ExternalLink, Pencil, Star } from "lucide-react";

import {
  Badge,
  Button,
  ErrorState,
  Modal,
  PageHeader,
  Skeleton,
  Tabs,
  useToast,
} from "@/components/ui";
import { api, ApiError } from "@/lib/api";
import {
  ResourceFormField,
  formValuesToBody,
  resourceDefaults,
  statusTone,
} from "@/components/resource/fields";
import { PROJECT_FIELDS } from "@/modules/projects/ProjectsPage";
import { PROJECT_TABS, type ProjectOverview } from "@/modules/projects/projectTabs";

function EditProjectModal({
  onClose,
  project,
}: {
  onClose: () => void;
  project: Record<string, unknown>;
}) {
  const qc = useQueryClient();
  const toast = useToast();

  const form = useForm<FieldValues>({
    defaultValues: resourceDefaults(PROJECT_FIELDS, project) as FieldValues,
  });

  const mutation = useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      api(`/projects/${project.id as string}`, { method: "PATCH", body }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["project-overview", project.id] });
      qc.invalidateQueries({ queryKey: ["projects"] });
      toast.success("Proiect actualizat");
      onClose();
    },
    onError: (e) => {
      toast.error(e instanceof ApiError ? e.message : "Eroare la salvare");
    },
  });

  const submit = form.handleSubmit((values) => {
    mutation.mutate(formValuesToBody(PROJECT_FIELDS, values, true));
  });

  return (
    <Modal
      open
      onClose={onClose}
      title="Editează proiect"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Anulează
          </Button>
          <Button loading={mutation.isPending} onClick={submit}>
            Salvează
          </Button>
        </>
      }
    >
      <form className="grid gap-4 md:grid-cols-2" onSubmit={submit}>
        {PROJECT_FIELDS.map((field) => (
          <ResourceFormField key={field.name} field={field} form={form} />
        ))}
      </form>
    </Modal>
  );
}

export default function ProjectDetailPage() {
  const { id = "" } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const qc = useQueryClient();

  const activeTab = searchParams.get("tab") || PROJECT_TABS[0].value;
  const [editOpen, setEditOpen] = useState(false);

  const overviewQuery = useQuery({
    queryKey: ["project-overview", id],
    queryFn: () => api<ProjectOverview>(`/projects/${id}/overview`),
    enabled: !!id,
  });

  const favoritesQuery = useQuery({
    queryKey: ["projects", "favorites", "mine"],
    queryFn: () => api<{ items: { id: string }[] }>("/projects/favorites/mine"),
  });
  const isFavorite =
    favoritesQuery.data?.items.some((item) => item.id === id) ?? false;

  const favoriteMutation = useMutation({
    mutationFn: () =>
      api(`/projects/${id}/favorite`, { method: isFavorite ? "DELETE" : "POST" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["projects", "favorites", "mine"] });
    },
  });

  if (overviewQuery.isLoading) {
    return <Skeleton className="h-64 w-full" />;
  }

  if (overviewQuery.isError || !overviewQuery.data) {
    return (
      <ErrorState
        error={overviewQuery.error}
        onRetry={() => overviewQuery.refetch()}
      />
    );
  }

  const overview = overviewQuery.data;
  const project = overview.project;

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title={project.name}
        breadcrumbs={[
          { label: "Proiecte", href: "/projects" },
          { label: project.name },
        ]}
        actions={
          <div className="flex items-center gap-2">
            {project.status && (
              <Badge tone={statusTone(project.status)}>{project.status}</Badge>
            )}

            {project.website && (
              <a
                href={project.website}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm hover:underline"
              >
                <ExternalLink className="h-4 w-4" />
                Website
              </a>
            )}

            <Button
              variant="ghost"
              size="sm"
              aria-label="Favorit"
              onClick={() => favoriteMutation.mutate()}
              loading={favoriteMutation.isPending}
            >
              <Star
                className={isFavorite ? "h-4 w-4 fill-current" : "h-4 w-4"}
              />
            </Button>

            <Button size="sm" onClick={() => setEditOpen(true)}>
              <Pencil className="h-4 w-4" />
              Editează
            </Button>
          </div>
        }
      />

      <Tabs
        items={PROJECT_TABS.map((tab) => ({ value: tab.value, label: tab.label }))}
        value={activeTab}
        onChange={(value) => {
          const next = new URLSearchParams(searchParams);
          next.set("tab", value);
          setSearchParams(next);
        }}
      />

      {PROJECT_TABS.find((tab) => tab.value === activeTab)?.render(id, overview)}

      {editOpen && (
        <EditProjectModal
          onClose={() => setEditOpen(false)}
          project={project as Record<string, unknown>}
        />
      )}
    </div>
  );
}
