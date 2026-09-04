import { randomUUID } from 'node:crypto';

export function generateDsnKey(): string {
  return `nm_${randomUUID().replace(/-/g, '')}`;
}
