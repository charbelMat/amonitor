export interface Span {
  id: string;
  traceId: string;
  parentSpanId: string;
  projectId: string;
  transactionName: string;
  op: string;
  description: string;
  startTime: Date;
  endTime: Date;
  durationMs: number;
  isTransaction: boolean;
}
