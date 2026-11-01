import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { ResourcePage } from "@/components/resource/ResourcePage";
import { formatDate } from "@/components/resource/fields";
import { Badge, Button, useToast } from "@/components/ui";
import { OBSERVATION_FIELDS } from "@/modules/tasks/fields";

type Observation = {
  id: string;
  title: string;
  priority: string;
  status: string;
  createdAt: string;
  convertedTaskId?: string | null;
};

export default function ObservationsPage() {
  const queryClient = useQueryClient();
  const toast = useToast();

  const { mutate } = useMutation({
    mutationFn: (id: string) => api.post(`/observations/${id}/convert`),
    onSuccess: () => {
      toast.success("Observația a fost convertită în task");
      queryClient.invalidateQueries({ queryKey: ["resource", "/observations"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <ResourcePage<Observation>
      title="Observații"
      endpoint="/observations"
      perm="observations"
      itemName="observație"
      fields={OBSERVATION_FIELDS}
      columns={[
        { key: "title", label: "Titlu" },
        { key: "priority", label: "Prioritate" },
        { key: "status", label: "Status" },
        { key: "createdAt", label: "Creat la", render: (row) => formatDate(row.createdAt) },
      ]}
      rowActions={(row) =>
        row.convertedTaskId ? (
          <Badge tone="success">Convertit</Badge>
        ) : (
          <Button
            size="sm"
            variant="secondary"
            onClick={(e) => {
              e.stopPropagation();
              mutate(row.id);
            }}
          >
            În task
          </Button>
        )
      }
    />
  );
}
