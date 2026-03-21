// functions/src/typesense/client.ts

import { Client } from 'typesense';
import {
  typesenseAdminKey,
  typesenseHost,
  typesensePort,
  typesenseProtocol,
} from '../../common';
// import {
//   typesenseAdminKey,
//   typesenseHost,
//   typesensePort,
//   typesenseProtocol,
// } from '../common/index.js';

let _client: Client | undefined;

export function getTypesenseClient() {
  if (_client) return _client;

  _client = new Client({
    nodes: [
      {
        host: typesenseHost.value(),
        port: typesensePort.value(),
        protocol: typesenseProtocol.value(),
      },
    ],
    apiKey: typesenseAdminKey.value(),
    connectionTimeoutSeconds: 10,
  });

  return _client;
}
