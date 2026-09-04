import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { NODE_STORE, NodeStore } from '../domain/node-store.port';
import { NodeSample } from '../domain/node-sample.entity';

@Injectable()
export class GetNodeHistoryUseCase {
  constructor(@Inject(NODE_STORE) private readonly nodes: NodeStore) {}

  async execute(projectId: string, instanceId: string, sinceMinutes = 60): Promise<NodeSample[]> {
    const samples = await this.nodes.history(projectId, instanceId, sinceMinutes);
    if (samples.length === 0) {
      throw new NotFoundException('No samples for this node in the selected window');
    }
    return samples;
  }
}
