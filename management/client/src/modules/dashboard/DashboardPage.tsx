/** Dashboard-ul: placeholdere până la activarea modulelor cu indicatori. */
import { EmptyState, PageHeader } from "@/components/ui";

export function DashboardPage() {
  return (
    <div className="flex flex-col gap-4">
      <PageHeader title="Dashboard" />
      <EmptyState title="Indicatorii apar pe măsură ce sunt activate modulele" />
    </div>
  );
}

export default DashboardPage;
