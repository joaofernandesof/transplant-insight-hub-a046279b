import { AdminLayout } from "@/components/AdminLayout";
import { CodeAssistant } from "@/components/admin/CodeAssistant";
import { AdminRoute } from "@/components/guards";

export default function CodeAssistantPage() {
  return (
    <AdminRoute>
      <AdminLayout>
        <div className="container mx-auto py-6 px-4">
          <CodeAssistant />
        </div>
      </AdminLayout>
    </AdminRoute>
  );
}
