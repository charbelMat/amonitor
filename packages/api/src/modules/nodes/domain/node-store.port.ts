import { NodeSample } from './node-sample.entity';

export const NODE_STORE = 'NODE_STORE';

export interface NodeStore {
  insert(sample: NodeSample): Promise<void>;
  /** The most recent sample for each distinct instance of a project. */
  listLatestPerInstance(projectId: string): Promise<NodeSample[]>;
  /** Samples for one instance, oldest first, for charting. */
  history(projectId: string, instanceId: string, sinceMinutes: number): Promise<NodeSample[]>;
}
