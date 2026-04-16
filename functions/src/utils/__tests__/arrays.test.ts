
import { filterUniqueArr, onlyUnique, splitChunks, sumArr, sumByTypes, uniqueStrings } from '../arrays.js';

describe('splitChunks', () => {
  it('splits an array into chunks of the given size', () => {
    expect(splitChunks([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
  });

  it('returns a single chunk when size >= array length', () => {
    expect(splitChunks([1, 2, 3], 10)).toEqual([[1, 2, 3]]);
  });

  it('returns empty array for empty input', () => {
    expect(splitChunks([], 3)).toEqual([]);
  });

  it('throws when size < 1', () => {
    expect(() => splitChunks([1, 2], 0)).toThrow('positive number');
  });
});

describe('filterUniqueArr', () => {
  it('removes duplicate primitives', () => {
    expect(filterUniqueArr([1, 2, 1, 3])).toEqual([1, 2, 3]);
  });

  it('removes duplicate objects by deep equality', () => {
    const result = filterUniqueArr([{ a: 1 }, { a: 2 }, { a: 1 }]);
    expect(result).toEqual([{ a: 1 }, { a: 2 }]);
  });

  it('returns empty array unchanged', () => {
    expect(filterUniqueArr([])).toEqual([]);
  });
});

describe('sumArr', () => {
  it('sums an array of numbers', () => {
    expect(sumArr([1, 2, 3])).toBe(6);
  });

  it('parses numeric strings', () => {
    expect(sumArr(['$1.50', '2.50'])).toBeCloseTo(4, 2);
  });

  it('returns 0 for empty array', () => {
    expect(sumArr([])).toBe(0);
  });

  it('handles mixed numbers and strings', () => {
    expect(sumArr([10, '5'])).toBe(15);
  });
});

describe('sumByTypes', () => {
  const items = [
    { type: 'a', value: 10 },
    { type: 'b', value: 20 },
    { type: 'a', value: 5 },
  ];

  it('sums values matching a single type', () => {
    expect(sumByTypes(items, 'type', 'a', 'value')).toBe(15);
  });

  it('sums values matching multiple types', () => {
    expect(sumByTypes(items, 'type', ['a', 'b'], 'value')).toBe(35);
  });

  it('returns 0 when no items match', () => {
    expect(sumByTypes(items, 'type', 'z', 'value')).toBe(0);
  });
});

describe('onlyUnique', () => {
  it('filters duplicate values from array', () => {
    expect([1, 2, 1, 3].filter(onlyUnique)).toEqual([1, 2, 3]);
  });
});

describe('uniqueStrings', () => {
  it('returns unique strings', () => {
    expect(uniqueStrings(['a', 'b', 'a'])).toEqual(['a', 'b']);
  });
});
