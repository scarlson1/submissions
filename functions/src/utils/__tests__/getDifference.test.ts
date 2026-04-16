
import { getDifference } from '../getDifference.js';

describe('getDifference', () => {
  it('returns empty object when objects are identical', () => {
    expect(getDifference({ a: 1 }, { a: 1 })).toEqual({});
  });

  it('returns changed scalar values', () => {
    expect(getDifference({ a: 1, b: 2 }, { a: 1, b: 3 })).toEqual({ b: 3 });
  });

  it('returns nested differences', () => {
    const orig = { a: { x: 1, y: 2 } };
    const next = { a: { x: 1, y: 99 } };
    expect(getDifference(orig, next)).toEqual({ a: { y: 99 } });
  });

  it('returns new keys added in newObj', () => {
    expect(getDifference({ a: 1 }, { a: 1, b: 2 })).toEqual({ b: 2 });
  });

  it('handles array values — changed elements are re-indexed from 0', () => {
    // getDifference uses a sequential counter for differing array elements,
    // so [1,2] → [1,3] produces arr=[3] (one changed element at counter index 0)
    expect(getDifference({ arr: [1, 2] }, { arr: [1, 3] })).toEqual({ arr: [3] });
  });
});
