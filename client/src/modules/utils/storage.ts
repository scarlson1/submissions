export function getCsvHeaderStatus(
  headers: string[],
  requiredHeaders: string[],
  formatFn: (str: string) => string // = snakeCase
) {
  const formatted = headers.map((h) => formatFn(h));

  let result: Record<string, boolean | null> = {};

  for (let h of requiredHeaders) {
    result[h] = formatted.includes(h);
  }

  return result;
}
