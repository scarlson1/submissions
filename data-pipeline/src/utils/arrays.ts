/**
 * Split an array of items into array of provided size
 * @param {any[]} data - array of data
 * @param {number} size - number of items in each chunk
 * @returns {Array} return array of arrays of "size" length
 */
export function splitChunks<T = any>(data: T[], size: number) {
  const chunks = [];
  // for (let i = 0; i < data.length; i += size) chunks.push(data.slice(i, i + size));
  if (size < 1)
    throw new Error('splitChunks array size must be a positive number');
  for (let i = 0; i < data.length; i += size) {
    chunks.push(data.slice(i, i + size));
  }

  return chunks;
}
