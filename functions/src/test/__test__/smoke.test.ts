/**
 * Smoke tests — verifies the test infrastructure is wired up correctly.
 * These tests have no Firebase or external service dependencies.
 */
import { makeGeoPoint, makeLocation, makeMetadata, makeOrganization, makePolicy, makeQuote, makeTimestamp, makeUser } from '../factories/index.js';

describe('test infrastructure', () => {
  it('runs a trivial assertion', () => {
    expect(1 + 1).toBe(2);
  });

  it('env vars are set', () => {
    expect(process.env['GCLOUD_PROJECT']).toBe('test-project');
    expect(process.env['FUNCTIONS_EMULATOR']).toBe('true');
  });
});

describe('factories', () => {
  it('makeTimestamp returns a valid timestamp shape', () => {
    const ts = makeTimestamp();
    expect(typeof ts.seconds).toBe('number');
    expect(typeof ts.nanoseconds).toBe('number');
    expect(typeof ts.toDate).toBe('function');
    expect(typeof ts.toMillis).toBe('function');
    expect(ts.toDate()).toBeInstanceOf(Date);
  });

  it('makeGeoPoint returns a valid geopoint shape', () => {
    const gp = makeGeoPoint(29.76, -95.37);
    expect(gp.latitude).toBe(29.76);
    expect(gp.longitude).toBe(-95.37);
  });

  it('makeMetadata builds base metadata', () => {
    const meta = makeMetadata();
    expect(meta.created).toBeDefined();
    expect(meta.updated).toBeDefined();
    expect(meta.version).toBe(1);
  });

  it('makeUser builds a user with required fields', () => {
    const user = makeUser();
    expect(user.email).toMatch(/@/);
    expect(user.metadata).toBeDefined();
  });

  it('makeUser accepts overrides', () => {
    const user = makeUser({ email: 'test@example.com', orgId: 'org-123' });
    expect(user.email).toBe('test@example.com');
    expect(user.orgId).toBe('org-123');
  });

  it('makeOrganization builds an org with required fields', () => {
    const org = makeOrganization();
    expect(org.orgId).toBeDefined();
    expect(org.orgName).toBeDefined();
    expect(org.status).toBe('active');
  });

  it('makePolicy builds a policy with required fields', () => {
    const policy = makePolicy();
    expect(policy.product).toBe('flood');
    expect(policy.paymentStatus).toBeDefined();
    expect(Object.keys(policy.locations).length).toBe(1);
  });

  it('makeQuote builds a quote with required fields', () => {
    const quote = makeQuote();
    expect(quote.policyId).toBeDefined();
    expect(quote.annualPremium).toBeGreaterThan(0);
    expect(quote.status).toBe('draft');
  });

  it('makeLocation builds a location with required fields', () => {
    const location = makeLocation();
    expect(location.locationId).toBeDefined();
    expect(location.coordinates.latitude).toBeDefined();
    expect(location.termDays).toBe(365);
  });
});
