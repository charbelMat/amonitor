import { Inject, Injectable } from '@nestjs/common';
import { NODE_STORE, NodeStore } from '../domain/node-store.port';
import { NodeSample } from '../domain/node-sample.entity';

@Injectable()
export class RecordNodeSampleUseCase {
  constructor(@Inject(NODE_STORE) private readonly nodes: NodeStore) {}

  execute(sample: NodeSample): Promise<void> {
    return this.nodes.insert(sample);
  }
}
