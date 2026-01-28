import { GlobalBreadcrumb } from '@/components/GlobalBreadcrumb';
import { DestratoKanban } from '../components/DestratoKanban';

export function DestratoPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-4 sm:p-6 space-y-6">
        <GlobalBreadcrumb />
        <DestratoKanban />
      </div>
    </div>
  );
}
