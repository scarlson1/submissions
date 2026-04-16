import { NotAuthorizedError } from '../../errors/notAuthorizedError.js';
import { RequestValidationError } from '../../errors/requestValidationError.js';
import { errorHandler } from '../errorHandler.js';
import { requireAuth } from '../requireAuth.js';
import { requireClaim } from '../requireClaim.js';

// Minimal call-tracking spy (no jest.fn() needed — not available in ESM module scope)
const makeSpy = () => {
  const calls: any[][] = [];
  const fn = (...args: any[]) => { calls.push(args); };
  fn.wasCalled = () => calls.length > 0;
  fn.callCount = () => calls.length;
  return fn;
};

// Minimal res mock: res.status(n).send(body)
const makeRes = () => {
  const sent: { status?: number; body?: any } = {};
  const res: any = {};
  res.status = (code: number) => { sent.status = code; return res; };
  res.send = (body: any) => { sent.body = body; return res; };
  res._sent = sent;
  return res;
};

// ── errorHandler ────────────────────────────────────────────────────────────

describe('errorHandler', () => {
  it('responds with statusCode and serialized errors for a CustomError', () => {
    const res = makeRes();
    errorHandler(new NotAuthorizedError(), {} as any, res, makeSpy());
    expect(res._sent.status).toBe(401);
    expect(res._sent.body).toEqual({ errors: [{ message: 'Not authorized' }] });
  });

  it('responds 400 with generic message for an unknown Error', () => {
    const res = makeRes();
    errorHandler(new Error('boom'), {} as any, res, makeSpy());
    expect(res._sent.status).toBe(400);
    expect(res._sent.body).toEqual({ errors: [{ message: 'Something went wrong' }] });
  });

  it('includes field information for a RequestValidationError', () => {
    const res = makeRes();
    const err = new RequestValidationError([
      { type: 'field', path: 'email', msg: 'Invalid email', location: 'body', value: '' } as any,
    ]);
    errorHandler(err, {} as any, res, makeSpy());
    expect(res._sent.status).toBe(400);
    expect(res._sent.body.errors[0].field).toBe('email');
    expect(res._sent.body.errors[0].message).toBe('Invalid email');
  });
});

// ── requireAuth ──────────────────────────────────────────────────────────────

describe('requireAuth', () => {
  it('calls next() when req.user is set', () => {
    const next = makeSpy();
    requireAuth({ user: { uid: 'user123' } } as any, makeRes(), next);
    expect(next.wasCalled()).toBe(true);
  });

  it('throws NotAuthorizedError when req.user is absent', () => {
    expect(() => requireAuth({ user: undefined } as any, makeRes(), makeSpy())).toThrow(
      NotAuthorizedError,
    );
  });

  it('does not throw when req.user is a minimal valid object', () => {
    expect(() =>
      requireAuth({ user: { uid: 'abc', email: 'a@b.com' } } as any, makeRes(), makeSpy()),
    ).not.toThrow();
  });
});

// ── requireClaim ─────────────────────────────────────────────────────────────

describe('requireClaim', () => {
  const makeReq = (claims: Record<string, any>) => ({ user: claims }) as any;

  it('calls next() when user has the required claim', () => {
    const next = makeSpy();
    requireClaim(['admin' as any])(makeReq({ admin: true }), makeRes(), next);
    expect(next.wasCalled()).toBe(true);
  });

  it('throws NotAuthorizedError when user lacks required claim', () => {
    expect(() =>
      requireClaim(['admin' as any])(makeReq({ agent: true }), makeRes(), makeSpy()),
    ).toThrow(NotAuthorizedError);
  });

  it('throws NotAuthorizedError when req.user is absent', () => {
    expect(() =>
      requireClaim(['admin' as any])({ user: undefined } as any, makeRes(), makeSpy()),
    ).toThrow(NotAuthorizedError);
  });

  it('accepts any one of multiple allowed claims', () => {
    const next = makeSpy();
    requireClaim(['admin', 'carrier'] as any)(makeReq({ carrier: true }), makeRes(), next);
    expect(next.wasCalled()).toBe(true);
  });

  it('rejects when claim value is falsy', () => {
    expect(() =>
      requireClaim(['admin' as any])(makeReq({ admin: false }), makeRes(), makeSpy()),
    ).toThrow(NotAuthorizedError);
  });
});
