import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as http from 'node:http';
import * as https from 'node:https';
import * as nodemailer from 'nodemailer';
import { AlertDeliveryPayload, AlertSender } from '../domain/alert-sender.port';

@Injectable()
export class CompositeAlertSender implements AlertSender {
  private readonly logger = new Logger(CompositeAlertSender.name);
  private readonly mailer: nodemailer.Transporter | null;
  private readonly mailFrom: string;

  constructor(private readonly config: ConfigService) {
    const smtpHost = config.get<string>('SMTP_HOST');
    this.mailFrom = config.get<string>('ALERT_EMAIL_FROM', 'alerts@node-monitor.local');

    this.mailer = smtpHost
      ? nodemailer.createTransport({
          host: smtpHost,
          port: config.get<number>('SMTP_PORT', 587),
          secure: config.get<string>('SMTP_SECURE') === 'true',
          auth: config.get<string>('SMTP_USER')
            ? { user: config.get<string>('SMTP_USER'), pass: config.get<string>('SMTP_PASS') }
            : undefined,
        })
      : null;
  }

  async send(payload: AlertDeliveryPayload): Promise<void> {
    if (payload.channel === 'email') {
      return this.sendEmail(payload);
    }
    return this.sendWebhook(payload);
  }

  private async sendEmail(payload: AlertDeliveryPayload): Promise<void> {
    if (!this.mailer) {
      this.logger.warn(
        `SMTP_HOST not configured — skipping email alert to ${payload.target}: ${payload.subject}`,
      );
      return;
    }
    await this.mailer.sendMail({
      from: this.mailFrom,
      to: payload.target,
      subject: payload.subject,
      text: payload.message,
    });
  }

  private sendWebhook(payload: AlertDeliveryPayload): Promise<void> {
    return new Promise((resolve, reject) => {
      let url: URL;
      try {
        url = new URL(payload.target);
      } catch (err) {
        this.logger.error(`Invalid webhook URL: ${payload.target}`);
        reject(err as Error);
        return;
      }

      const body = JSON.stringify({ subject: payload.subject, message: payload.message });
      const client = url.protocol === 'https:' ? https : http;

      const req = client.request(
        url,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) },
          timeout: 5000,
        },
        (res) => {
          res.resume();
          res.on('end', resolve);
        },
      );

      req.on('timeout', () => req.destroy(new Error('webhook alert request timed out')));
      req.on('error', reject);
      req.write(body);
      req.end();
    });
  }
}
