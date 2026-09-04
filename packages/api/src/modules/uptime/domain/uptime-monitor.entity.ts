export interface UptimeMonitor {
  id: string;
  projectId: string;
  name: string;
  url: string;
  intervalSeconds: number;
  expectedStatus: number;
  createdAt: Date;
}
