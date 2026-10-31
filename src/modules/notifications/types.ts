import {
  NotificationChannel,
  NotificationStatus,
  NotificationTemplate,
} from "@/lib/db/schema/enums";

export interface CreateNotificationInput {
  userId: string;
  weddingId?: string | null;
  channel?: NotificationChannel;
  template: NotificationTemplate;
  title: string;
  body: string;
  payload?: Record<string, unknown> | null;
  dedupeKey?: string | null;
}

export interface NotificationRecord {
  id: string;
  userId: string;
  weddingId?: string | null;
  channel: NotificationChannel;
  template: NotificationTemplate;
  title: string;
  body: string;
  payload?: Record<string, unknown> | null;
  dedupeKey?: string | null;
  status: NotificationStatus;
  providerReference?: string | null;
  isSimulator: boolean;
  errorMessage?: string | null;
  scheduledAt: Date;
  sentAt?: Date | null;
  readAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
