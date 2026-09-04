import { api } from '../../app/api';

export type NodeStatus = 'online' | 'stale' | 'offline';

export interface NodeSample {
  projectId: string;
  instanceId: string;
  hostname: string;
  pid: number;
  timestamp: string;
  uptimeSec: number;
  cpuPercent: number;
  cpuCount: number;
  loadAvg1: number;
  memRssBytes: number;
  memHeapUsedBytes: number;
  memHeapTotalBytes: number;
  systemMemTotalBytes: number;
  systemMemFreeBytes: number;
  networkSupported: boolean;
  netRxBytesPerSec: number;
  netTxBytesPerSec: number;
  eventLoopLagMs: number;
}

export interface NodeInstance {
  instanceId: string;
  hostname: string;
  pid: number;
  status: NodeStatus;
  lastSeen: string;
  latest: NodeSample;
}

export interface NodesOverview {
  nodes: NodeInstance[];
  summary: {
    total: number;
    online: number;
    stale: number;
    offline: number;
    avgCpuPercent: number;
    totalMemRssBytes: number;
    totalNetRxBytesPerSec: number;
    totalNetTxBytesPerSec: number;
  };
}

interface ProjectScope {
  organizationId: string;
  projectId: string;
}

export const nodesApi = api.injectEndpoints({
  endpoints: (builder) => ({
    listNodes: builder.query<NodesOverview, ProjectScope>({
      query: ({ organizationId, projectId }) =>
        `/organizations/${organizationId}/projects/${projectId}/nodes`,
      providesTags: ['Node'],
    }),
    getNodeHistory: builder.query<NodeSample[], ProjectScope & { instanceId: string; minutes?: number }>({
      query: ({ organizationId, projectId, instanceId, minutes = 60 }) =>
        `/organizations/${organizationId}/projects/${projectId}/nodes/${encodeURIComponent(instanceId)}/history?minutes=${minutes}`,
    }),
  }),
});

export const { useListNodesQuery, useGetNodeHistoryQuery } = nodesApi;
