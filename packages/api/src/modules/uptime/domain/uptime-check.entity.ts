export interface UptimeCheck {
  id: string;
  monitorId: string;
  projectId: string;
  timestamp: Date;
  statusCode: number;
  latencyMs: number;
  success: boolean;
}
