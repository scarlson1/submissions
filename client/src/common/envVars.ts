import z from 'zod';

const envSchema = z
  .object({
    VITE_MAPBOX_ACCESS_TOKEN: z.string(),
    VITE_GOOGLE_GEO_KEY: z.string(),
    VITE_FUNCTIONS_BASE_URL: z.string(),
    VITE_API_BASE_URL: z.string(),
    VITE_HOSTING_URL: z.string(),
    VITE_FB_API_KEY: z.string(),
    VITE_FB_AUTH_DOMAIN: z.string(),
    VITE_FB_PROJECT_ID: z.string(),
    VITE_FB_STORAGE_BUCKET: z.string(),
    VITE_FB_MESSAGING_SENDER_ID: z.string(),
    VITE_FB_APP_ID: z.string(),
    VITE_FB_MEASUREMENT_ID: z.string(),
    VITE_EPAY_BASE_URL: z.string(),
    VITE_EPAY_HOSTING_BASE_URL: z.string(),
    VITE_EPAY_PUBLIC_KEY: z.string(),
    VITE_DEV: z.string(),
    VITE_RECAPTCHA_ENTERPRISE_KEY: z.string(),
    VITE_STRIPE_PUBLISHABLE_KEY: z.string(),
    VITE_TYPESENSE_NOT_AUTHED_SEARCH_KEY: z.string(),
    VITE_TYPESENSE_NODE: z.string(),
    VITE_TYPESENSE_PORT: z.string(),
    VITE_TYPESENSE_PROTOCOL: z.string(),
    VITE_TYPESENSE_COLLECTION_PREFIX: z.string(),
    VITE_MGA_ORG_ID: z.string().default('idemand'),
    VITE_MGA_DOMAIN: z.string().default('@s-carlson.com'),
  })
  .passthrough();

const parsed = envSchema.safeParse(import.meta.env);

if (!parsed.success) {
  console.error(
    '❌ Invalid environment variables:',
    parsed.error.flatten().fieldErrors,
  );
  throw new Error('Invalid environment variables');
}

const env = parsed.data;
export { env };
