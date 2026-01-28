import { GlobalBreadcrumb } from '@/components/GlobalBreadcrumb';
import { DistratoKanban } from '../components/DistratoKanban';

export function DistratoPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-4 sm:p-6 space-y-6">
        <GlobalBreadcrumb />
        <DistratoKanban />
      </div>
    </div>
  );
}
