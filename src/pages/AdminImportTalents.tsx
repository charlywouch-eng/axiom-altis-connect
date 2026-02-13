import { useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { CsvTalentUpload } from "@/components/CsvTalentUpload";
import { ImportHistory } from "@/components/ImportHistory";

export default function AdminImportTalents() {
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <DashboardLayout sidebarVariant="admin">
      <div className="space-y-6">
        <h2 className="font-display text-2xl font-bold">Import de talents</h2>
        <CsvTalentUpload onImportComplete={() => setRefreshKey((k) => k + 1)} />
        <ImportHistory refreshKey={refreshKey} />
      </div>
    </DashboardLayout>
  );
}
