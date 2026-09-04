import { Injectable } from '@nestjs/common';
import { RecordNodeSampleUseCase } from '../../nodes/application/record-node-sample.use-case';
import { IngestMetricsDto } from '../dto/ingest-metrics.dto';

@Injectable()
export class IngestMetricsUseCase {
  constructor(private readonly recordNodeSample: RecordNodeSampleUseCase) {}

  execute(projectId: string, dto: IngestMetricsDto): Promise<void> {
    const { timestamp, ...rest } = dto;
    return this.recordNodeSample.execute({
      projectId,
      timestamp: new Date(timestamp),
      ...rest,
    });
  }
}
