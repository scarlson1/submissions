/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_MAPBOX_ACCESS_TOKEN: string;
  readonly VITE_GOOGLE_GEO_KEY: string;
  readonly VITE_FUNCTIONS_BASE_URL: string;
  readonly VITE_API_BASE_URL: string;
  readonly VITE_HOSTING_URL: string;
  readonly VITE_FB_API_KEY: string;
  readonly VITE_FB_AUTH_DOMAIN: string;
  readonly VITE_FB_PROJECT_ID: string;
  readonly VITE_FB_STORAGE_BUCKET: string;
  readonly VITE_FB_MESSAGING_SENDER_ID: string;
  readonly VITE_FB_APP_ID: string;
  readonly VITE_FB_MEASUREMENT_ID: string;
  readonly VITE_EPAY_BASE_URL: string;
  readonly VITE_EPAY_HOSTING_BASE_URL: string;
  readonly VITE_EPAY_PUBLIC_KEY: string;
  // readonly VITE_ALGOLIA_APP_ID: string;
  // readonly VITE_ALGOLIA_NOT_AUTHED_SEARCH_KEY: string;
  readonly VITE_DEV: string;
  readonly VITE_RECAPTCHA_ENTERPRISE_KEY: string;
  readonly VITE_STRIPE_PUBLISHABLE_KEY: string;
  readonly VITE_TYPESENSE_NOT_AUTHED_SEARCH_KEY: string;
  readonly VITE_TYPESENSE_NODE: string;
  readonly VITE_TYPESENSE_PORT: string;
  readonly VITE_TYPESENSE_PROTOCOL: string;
  readonly VITE_TYPESENSE_COLLECTION_PREFIX: string;
  readonly VITE_IDEMAND_ORG_ID: string;
  readonly VITE_MGA_DOMAIN: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
