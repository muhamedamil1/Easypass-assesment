export type ServiceRequestStatus = "submitted" | "in_progress" | "completed";

export type ServiceRequestListItem = {
  id: string;
  title: string;
  status: ServiceRequestStatus;
  createdAt: string;
  updatedAt: string;
};

export const serviceRequestStatuses: ServiceRequestStatus[] = [
  "submitted",
  "in_progress",
  "completed",
];
