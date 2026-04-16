import { HttpsError } from 'firebase-functions/v1/https';
import {
  hasClaim,
  isAgent,
  isIDemandAdmin,
  isOrgAdmin,
  requireAuth,
  requireIDemandAdminClaims,
  requireOwnerAgentAdmin,
} from '../auth.js';

// Minimal decoded token stub
const makeToken = (claims: Record<string, any> = {}) =>
  ({ uid: 'uid-123', firebase: { tenant: null }, ...claims }) as any;

const makeAuth = (claims: Record<string, any> = {}, uid = 'uid-123') => ({
  uid,
  token: makeToken(claims),
  rawToken: 'mock-raw-token',
});

// ── hasClaim ────────────────────────────────────────────────────────────────

describe('hasClaim', () => {
  it('returns the claim value when present and truthy', () => {
    expect(hasClaim(makeToken({ admin: true }), 'admin' as any)).toBe(true);
  });

  it('returns false when claim is absent', () => {
    expect(hasClaim(makeToken(), 'admin' as any)).toBe(false);
  });

  it('returns false when token is undefined', () => {
    expect(hasClaim(undefined, 'admin' as any)).toBe(false);
  });
});

// ── role helpers ─────────────────────────────────────────────────────────────

describe('isIDemandAdmin', () => {
  it('returns true when iDemandAdmin claim is set', () => {
    expect(isIDemandAdmin(makeToken({ iDemandAdmin: true }))).toBe(true);
  });

  it('returns false without the claim', () => {
    expect(isIDemandAdmin(makeToken())).toBe(false);
  });
});

describe('isAgent', () => {
  it('returns true when agent claim is set', () => {
    expect(isAgent(makeToken({ agent: true }))).toBe(true);
  });

  it('returns false without the claim', () => {
    expect(isAgent(makeToken())).toBe(false);
  });
});

describe('isOrgAdmin', () => {
  it('returns true when orgAdmin claim is set', () => {
    expect(isOrgAdmin(makeToken({ orgAdmin: true }))).toBe(true);
  });
});

// ── requireAuth ───────────────────────────────────────────────────────────────

describe('requireAuth (callable)', () => {
  it('does not throw when auth has a uid', () => {
    expect(() => requireAuth(makeAuth())).not.toThrow();
  });

  it('throws unauthenticated when auth is undefined', () => {
    let caught: any;
    try { requireAuth(undefined); } catch (e) { caught = e; }
    expect(caught).toBeInstanceOf(HttpsError);
    expect(caught.code).toBe('unauthenticated');
  });

  it('throws unauthenticated when uid is empty string', () => {
    expect(() => requireAuth({ uid: '', token: makeToken(), rawToken: '' })).toThrow(HttpsError);
  });
});

// ── requireIDemandAdminClaims ─────────────────────────────────────────────────

describe('requireIDemandAdminClaims', () => {
  it('does not throw for an iDemandAdmin token', () => {
    expect(() => requireIDemandAdminClaims(makeToken({ iDemandAdmin: true }))).not.toThrow();
  });

  it('throws permission-denied for a non-admin token', () => {
    let caught: any;
    try { requireIDemandAdminClaims(makeToken()); } catch (e) { caught = e; }
    expect(caught).toBeInstanceOf(HttpsError);
    expect(caught.code).toBe('permission-denied');
  });
});

// ── requireOwnerAgentAdmin ───────────────────────────────────────────────────

const makeDoc = (overrides: Record<string, any> = {}) => ({
  userId: 'owner-uid',
  namedInsured: { userId: 'insured-uid' },
  agent: { userId: 'agent-uid' },
  agency: { orgId: 'org-abc' },
  ...overrides,
});

describe('requireOwnerAgentAdmin', () => {
  it('passes for the document owner', () => {
    expect(() =>
      requireOwnerAgentAdmin(makeAuth({}, 'owner-uid'), makeDoc()),
    ).not.toThrow();
  });

  it('passes for the named insured', () => {
    expect(() =>
      requireOwnerAgentAdmin(makeAuth({}, 'insured-uid'), makeDoc()),
    ).not.toThrow();
  });

  it('passes for the agent linked to the document', () => {
    expect(() =>
      requireOwnerAgentAdmin(makeAuth({ agent: true }, 'agent-uid'), makeDoc()),
    ).not.toThrow();
  });

  it('passes for an orgAdmin whose tenantId matches agency orgId', () => {
    const auth = { uid: 'admin-uid', token: makeToken({ orgAdmin: true, firebase: { tenant: 'org-abc' } }) };
    expect(() => requireOwnerAgentAdmin(auth as any, makeDoc())).not.toThrow();
  });

  it('passes for an iDemandAdmin regardless of doc ownership', () => {
    expect(() =>
      requireOwnerAgentAdmin(makeAuth({ iDemandAdmin: true }, 'random-uid'), makeDoc()),
    ).not.toThrow();
  });

  it('throws permission-denied for an unrelated user', () => {
    let caught: any;
    try {
      requireOwnerAgentAdmin(makeAuth({}, 'stranger-uid'), makeDoc());
    } catch (e) { caught = e; }
    expect(caught).toBeInstanceOf(HttpsError);
    expect(caught.code).toBe('permission-denied');
  });

  it('throws unauthenticated when auth is undefined', () => {
    expect(() => requireOwnerAgentAdmin(undefined, makeDoc())).toThrow(HttpsError);
  });
});
