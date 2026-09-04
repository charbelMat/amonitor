import { AlertRule, AlertTrigger, AlertChannel } from './alert-rule.entity';

export const ALERT_RULE_REPOSITORY = 'ALERT_RULE_REPOSITORY';

export interface CreateAlertRuleData {
  projectId: string;
  name: string;
  trigger: AlertTrigger;
  channel: AlertChannel;
  target: string;
}

export interface AlertRuleRepository {
  create(data: CreateAlertRuleData): Promise<AlertRule>;
  findById(id: string): Promise<AlertRule | null>;
  listForProject(projectId: string): Promise<AlertRule[]>;
  listForProjectAndTrigger(projectId: string, trigger: AlertTrigger): Promise<AlertRule[]>;
  delete(id: string): Promise<void>;
}
