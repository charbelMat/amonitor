import { randomUUID } from 'node:crypto';

export function generateDsnKey(): string {
  return `am_${randomUUID().replace(/-/g, '')}`;
}
