import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Inject } from '@nestjs/common';
import { Job } from 'bullmq';
import { ALERT_SENDER, AlertSender, AlertDeliveryPayload } from '../domain/alert-sender.port';

export const ALERT_DISPATCH_QUEUE = 'alert-dispatch';

export type AlertDispatchJob = AlertDeliveryPayload;

@Processor(ALERT_DISPATCH_QUEUE)
export class AlertDispatchProcessor extends WorkerHost {
  constructor(@Inject(ALERT_SENDER) private readonly sender: AlertSender) {
    super();
  }

  async process(job: Job<AlertDispatchJob>): Promise<void> {
    await this.sender.send(job.data);
  }
}
