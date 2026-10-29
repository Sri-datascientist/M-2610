import { EmptyState, PageHeader } from "@/components/portal/brand";
import { moduleByPath, type AdminRoute } from "@/features/admin/modules";

export function ModulePlaceholder({ path }: { path: AdminRoute }) {
  const module = moduleByPath(path);
  if (!module) return null;

  return (
    <div>
      <PageHeader title={module.title} subtitle={module.summary} />
      <EmptyState
        title="This module is not available yet"
        body="The screen is reserved for this Meyveda Admin module. No records can be changed here yet."
      />
    </div>
  );
}
