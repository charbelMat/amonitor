export type AlertTrigger = 'issue_created' | 'uptime_down';
export type AlertChannel = 'email' | 'webhook';

export interface AlertRule {
  id: string;
  projectId: string;
  name: string;
  trigger: AlertTrigger;
  channel: AlertChannel;
  /** Email address (channel=email) or URL (channel=webhook) to deliver to. */
  target: string;
  createdAt: Date;
}
