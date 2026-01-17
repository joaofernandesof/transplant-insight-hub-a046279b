import { ModuleLayout } from "@/components/ModuleLayout";
import AchievementsPanel from "@/components/AchievementsPanel";
import Leaderboard from "@/components/Leaderboard";

export default function Achievements() {
  return (
    <ModuleLayout>
      <div className="p-4 pt-16 lg:pt-4 lg:p-6 overflow-x-hidden w-full">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <AchievementsPanel compact={false} />
          </div>
          <div>
            <Leaderboard limit={10} />
          </div>
        </div>
      </div>
    </ModuleLayout>
  );
}
