import { supabase } from "@/integrations/supabase/client";

interface LogParams {
  accountId: string;
  taskId?: string;
  taskTitle: string;
  action: "created" | "updated" | "completed" | "restored" | "deleted" | "status_changed";
  changes?: Record<string, any>;
  performedBy?: string;
  performedByName?: string;
}

export async function logTaskActivity(params: LogParams) {
  try {
    await supabase.from("task_activity_log").insert({
      account_id: params.accountId,
      task_id: params.taskId,
      task_title: params.taskTitle,
      action: params.action,
      changes: params.changes || null,
      performed_by: params.performedBy,
      performed_by_name: params.performedByName,
    });
  } catch (e) {
    console.error("Failed to log task activity:", e);
  }
}
