import test from 'node:test';
import assert from 'node:assert';
import { JSONRPCRequest } from './index.js';

test('JSON-RPC Request formatting', () => {
  const req: JSONRPCRequest<{ path: string }> = {
    jsonrpc: '2.0',
    id: 1,
    method: 'workspace/setFolder',
    params: { path: '/tmp' },
  };

  assert.strictEqual(req.jsonrpc, '2.0');
  assert.strictEqual(req.method, 'workspace/setFolder');
  assert.strictEqual(req.params?.path, '/tmp');
});
