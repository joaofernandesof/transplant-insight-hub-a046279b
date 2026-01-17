import { ModuleLayout } from "@/components/ModuleLayout";
import AchievementsPanel from "@/components/AchievementsPanel";

export default function Achievements() {
  return (
    <ModuleLayout>
      <div className="p-4 pt-16 lg:pt-4 lg:p-6 overflow-x-hidden w-full">
        <AchievementsPanel compact={false} />
      </div>
    </ModuleLayout>
  );
}
