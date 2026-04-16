/**
 * Shared factory primitives.
 *
 * The Firestore Timestamp and GeoPoint types are validated by Zod using
 * duck-typing (z.custom), so we can create plain objects that satisfy the
 * shape without needing firebase-admin to be initialized.
 */
import type { GeoPoint as FirebaseGeoPoint, Timestamp as FirebaseTimestamp } from 'firebase-admin/firestore';
import type { BaseMetadata } from '@idemand/common';

export function makeTimestamp(date: Date = new Date()): FirebaseTimestamp {
  return {
    seconds: Math.floor(date.getTime() / 1000),
    nanoseconds: 0,
    toDate: () => date,
    toMillis: () => date.getTime(),
    isEqual: (other) => other?.seconds === Math.floor(date.getTime() / 1000),
    valueOf: () => String(date.getTime()),
  } as unknown as FirebaseTimestamp;
}

export function makeGeoPoint(lat = 29.7604, lng = -95.3698): FirebaseGeoPoint {
  return {
    latitude: lat,
    longitude: lng,
    isEqual: (other) => other?.latitude === lat && other?.longitude === lng,
  } as unknown as FirebaseGeoPoint;
}

export function makeMetadata(overrides: Partial<BaseMetadata> = {}): BaseMetadata {
  const now = makeTimestamp();
  return {
    created: now,
    updated: now,
    version: 1,
    ...overrides,
  };
}

/** Shallow-merge an override object, ignoring undefined values. */
export function merge<T>(base: T, overrides: Partial<T> = {}): T {
  return { ...base, ...overrides };
}
