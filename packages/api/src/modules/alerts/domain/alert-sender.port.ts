import { AlertChannel } from './alert-rule.entity';

export const ALERT_SENDER = 'ALERT_SENDER';

export interface AlertDeliveryPayload {
  channel: AlertChannel;
  target: string;
  subject: string;
  message: string;
}

export interface AlertSender {
  send(payload: AlertDeliveryPayload): Promise<void>;
}
