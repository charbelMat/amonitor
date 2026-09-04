import { Injectable } from '@nestjs/common';
import { RecordTransactionUseCase } from '../../performance/application/record-transaction.use-case';
import { IngestTransactionDto } from '../dto/ingest-transaction.dto';

@Injectable()
export class IngestTransactionUseCase {
  constructor(private readonly recordTransaction: RecordTransactionUseCase) {}

  execute(projectId: string, dto: IngestTransactionDto): Promise<void> {
    return this.recordTransaction.execute({ projectId, ...dto });
  }
}
