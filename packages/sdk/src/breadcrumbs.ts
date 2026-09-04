export type BreadcrumbLevel = 'info' | 'warning' | 'error';

export interface Breadcrumb {
  timestamp: number;
  category: string;
  message: string;
  level: BreadcrumbLevel;
  data?: Record<string, unknown>;
}

export class BreadcrumbStore {
  private readonly buffer: Breadcrumb[] = [];

  constructor(private readonly maxSize: number) {}

  add(breadcrumb: Omit<Breadcrumb, 'timestamp'> & { timestamp?: number }): void {
    this.buffer.push({ timestamp: breadcrumb.timestamp ?? Date.now(), ...breadcrumb });
    if (this.buffer.length > this.maxSize) {
      this.buffer.shift();
    }
  }

  snapshot(): Breadcrumb[] {
    return this.buffer.slice();
  }
}
