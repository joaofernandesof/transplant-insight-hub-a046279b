import { QueryClient } from "@tanstack/react-query";

/**
 * Invalidates all task and agenda related queries across the CPG portal.
 * Call this after any task or appointment mutation to keep all views in sync.
 */
export function invalidateAllTaskQueries(queryClient: QueryClient) {
  // Tasks
  queryClient.invalidateQueries({ queryKey: ["workspace-tasks"] });
  queryClient.invalidateQueries({ queryKey: ["workspace-tasks-completed"] });
  queryClient.invalidateQueries({ queryKey: ["ipromed-tasks"] });
  queryClient.invalidateQueries({ queryKey: ["ipromed-task-stats"] });
  queryClient.invalidateQueries({ queryKey: ["ipromed-subtasks-counts"] });
}

export function invalidateAllAgendaQueries(queryClient: QueryClient) {
  queryClient.invalidateQueries({ queryKey: ["workspace-agenda-kanban"] });
  queryClient.invalidateQueries({ queryKey: ["ipromed-appointments"] });
  queryClient.invalidateQueries({ queryKey: ["ipromed-appointments-astrea"] });
  queryClient.invalidateQueries({ queryKey: ["ipromed-appointment-checks"] });
  queryClient.invalidateQueries({ queryKey: ["workspace-agenda-unified"] });
  queryClient.invalidateQueries({ queryKey: ["ipromed-appointments-sla"] });
  queryClient.invalidateQueries({ queryKey: ["ipromed-appointments-stats"] });
}

export function invalidateAllCpgQueries(queryClient: QueryClient) {
  invalidateAllTaskQueries(queryClient);
  invalidateAllAgendaQueries(queryClient);
}
