'use strict';

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { createStrategyBackend } = require('../strategy-backend');

function makeResponse() {
  return {
    status: null,
    body: '',
    writeHead(status) { this.status = status; },
    end(body) { this.body = String(body || ''); },
  };
}

(async () => {
  const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'strategy-permissions-'));
  try {
    let adminChecks = 0;
    const backend = createStrategyBackend({
      dataDir,
      isAdmin: (req) => {
        adminChecks += 1;
        return req.isAdmin === true;
      },
      l2FocusScanner: {
        status: async () => ({ available: true }),
        listDay: () => [],
      },
      getFinalSealedCodes: async () => new Set(['600105']),
    });

    const adminResponse = makeResponse();
    const adminHandled = await backend.handle(
      { method: 'GET', isAdmin: true },
      adminResponse,
      new URL('http://localhost/api/strategy/focus-l2-scan'),
    );
    assert.strictEqual(adminHandled, true);
    assert.strictEqual(adminResponse.status, 200);
    assert.deepStrictEqual(JSON.parse(adminResponse.body), { available: true });

    const historyResponse = makeResponse();
    const historyHandled = await backend.handle(
      { method: 'GET', isAdmin: true },
      historyResponse,
      new URL('http://localhost/api/strategy/focus-l2-scan?history=1&day=2026-07-30'),
    );
    assert.strictEqual(historyHandled, true);
    assert.strictEqual(historyResponse.status, 200);
    assert.deepStrictEqual(JSON.parse(historyResponse.body), {
      day: '2026-07-30',
      jobs: [],
      finalSeal: { available: true, codes: ['600105'] },
    });

    const userResponse = makeResponse();
    await backend.handle(
      { method: 'GET', isAdmin: false },
      userResponse,
      new URL('http://localhost/api/strategy/focus-l2-scan'),
    );
    assert.strictEqual(userResponse.status, 403);
    assert(adminChecks >= 3, 'default L2 read/run permissions should delegate to isAdmin');

    console.log('ALL STRATEGY BACKEND PERMISSION CHECKS PASSED');
  } finally {
    fs.rmSync(dataDir, { recursive: true, force: true });
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
