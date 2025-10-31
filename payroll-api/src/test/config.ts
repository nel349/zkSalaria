import path from 'node:path';
import { NetworkId, setNetworkId } from '@midnight-ntwrk/midnight-js-network-id';

export interface Config {
  readonly privateStateStoreName: string;
  readonly logDir: string;
  readonly payrollZkConfigPath: string;
  readonly indexer: string;
  readonly indexerWS: string;
  readonly node: string;
  readonly proofServer: string;
}

export const currentDir = path.resolve(new URL(import.meta.url).pathname, '..');

export class StandaloneConfig implements Config {
  privateStateStoreName = 'payroll-private-state';
  logDir = path.resolve(currentDir, '..', 'logs', 'standalone', `${new Date().toISOString()}.log`);
  payrollZkConfigPath = path.resolve(currentDir, '..', '..', '..', 'payroll-contract', 'src', 'managed', 'payroll');
  indexer = 'http://127.0.0.1:8088/api/v1/graphql';
  indexerWS = 'ws://127.0.0.1:8088/api/v1/graphql/ws';
  node = 'http://127.0.0.1:9944';
  proofServer = 'http://127.0.0.1:6300';

  constructor() {
    setNetworkId(NetworkId.Undeployed);
  }
}
