import type { StatusPekerjaan, StatusKonfirmasi, AnyStatus } from "@/types";

/**
 * Migration helper: Convert old mixed status to new separated statuses
 * Used for handling existing data from localStorage
 */
export function migrateStatus(oldStatus: string): {
  statusPekerjaan: StatusPekerjaan;
  statusKonfirmasi: StatusKonfirmasi;
} {
  const workStatuses: Record<string, StatusPekerjaan> = {
    "assigned": "assigned",
    "in_progress": "in_progress",
    "review": "review",
    "done": "done",
  };

  const confirmationStatuses: Record<string, StatusKonfirmasi> = {
    "pending": "pending",
    "accepted": "accepted",
    "rejected": "rejected",
  };

  // If it's a work status, assign it as statusPekerjaan with accepted as default confirmation
  if (workStatuses[oldStatus]) {
    return {
      statusPekerjaan: workStatuses[oldStatus] as StatusPekerjaan,
      statusKonfirmasi: "accepted",
    };
  }

  // If it's a confirmation status, assign it as statusKonfirmasi with assigned as default work status
  if (confirmationStatuses[oldStatus]) {
    return {
      statusPekerjaan: "assigned",
      statusKonfirmasi: confirmationStatuses[oldStatus] as StatusKonfirmasi,
    };
  }

  // Default fallback
  return {
    statusPekerjaan: "assigned",
    statusKonfirmasi: "accepted",
  };
}
