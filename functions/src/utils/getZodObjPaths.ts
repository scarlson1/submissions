import {
  z,
  ZodArray,
  ZodNullable,
  ZodObject,
  ZodOptional,
  type ZodType,
} from 'zod';

// src: https://github.com/colinhacks/zod/discussions/2134#discussioncomment-5194111

export const getZodObjPaths = (schema: ZodType): string[] => {
  // Adjusted: Signature now uses Zod.ZodType to eliminate null& undefined check
  // check if schema is nullable or optional
  if (schema instanceof ZodNullable || schema instanceof ZodOptional) {
    return getZodObjPaths(schema.unwrap());
  }
  // check if schema is an array
  if (schema instanceof ZodArray) {
    return getZodObjPaths(schema.element);
  }
  // check if schema is an object
  if (schema instanceof ZodObject) {
    // get key/value pairs from schema
    const entries = Object.entries<ZodType>(schema.shape); // Adjusted: Uses Zod.ZodType as generic to remove instanceof check. Since .shape returns ZodRawShape which has Zod.ZodType as type for each key.
    // loop through key/value pairs
    return entries.flatMap(([key, value]) => {
      // get nested keys
      const nested = getZodObjPaths(value).map((subKey) => `${key}.${subKey}`);
      // return nested keys
      return nested.length ? nested : key;
    });
  }
  // return empty array
  return [];
};

export function zodEnumFromObjKeys<K extends string>(
  obj: Record<K, unknown>,
): z.ZodEnum<[K, ...K[]]> {
  const [firstKey, ...otherKeys] = Object.keys(obj) as K[];
  return z.enum([firstKey!, ...otherKeys]);
}
