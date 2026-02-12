import { DashboardLayout } from "@/components/DashboardLayout";
import { CsvTalentUpload } from "@/components/CsvTalentUpload";

export default function AdminImportTalents() {
  return (
    <DashboardLayout sidebarVariant="admin">
      <div className="space-y-6">
        <h2 className="font-display text-2xl font-bold">Import de talents</h2>
        <CsvTalentUpload />
      </div>
    </DashboardLayout>
  );
}
