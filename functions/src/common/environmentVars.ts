import {
  defineBoolean,
  defineInt,
  // defineFloat, not implemented yet in firebase-functions
  defineSecret,
  defineString,
  projectID,
} from 'firebase-functions/params';

export const minInstances = projectID.equals('PRODUCTION').thenElse(1, 0);

export const resendKey = defineSecret('RESEND_API_KEY');
export const resendSecret = defineSecret('RESEND_SECRET');
// export const sendGridWebhookVerificationKey = defineSecret('SENDGRID_WEBHOOK_VERIFICATION_KEY');
export const emailVerificationKey = defineSecret('EMAIL_VERIFICATION_KEY');
export const swissReClientId = defineSecret('SWISS_RE_CLIENT_ID');
export const swissReClientSecret = defineSecret('SWISS_RE_CLIENT_SECRET');
export const swissReSubscriptionKey = defineSecret('SWISS_RE_SUBSCRIPTION_KEY');
export const ePayCreds = defineSecret('ENCODED_EPAY_AUTH');
export const signNowCreds = defineSecret('SIGN_NOW_CREDS');
export const signNowUserCreds = defineSecret('SIGN_NOW_USER_CREDS');
export const spatialKeyUserKey = defineSecret('SPATIALKEY_USER_API_KEY');
export const spatialKeyOrgKey = defineSecret('SPATIALKEY_ORG_API_KEY');
export const spatialKeySecretKey = defineSecret('SPATIALKEY_ORG_SECRET_KEY');
export const attomKey = defineSecret('ATTOM_API_KEY');
export const veriskCredsDemo = defineSecret('VERISK_CREDS_DEMO');
export const firebaseHashConfig = defineSecret('FB_AUTH_HASH_CONFIG');
// export const algoliaAdminKey = defineSecret('ALGOLIA_ADMIN_API_KEY');
// export const algoliaUserBaseKey = defineSecret('ALGOLIA_BASE_USER_SEARCH_KEY');
// export const algoliaIDemandAdminSearchKey = defineSecret(
//   'ALGOLIA_IDEMAND_ADMIN_SEARCH_KEY',
// );
export const typesenseAdminKey = defineSecret('TYPESENSE_ADMIN_KEY');
export const typesenseIDemandAdminSearchKey = defineSecret(
  'TYPESENSE_IDEMAND_ADMIN_SEARCH_KEY',
);
export const typesenseUserSearchKey = defineSecret('TYPESENSE_USER_SEARCH_KEY');
export const googleGeoKey = defineSecret('GOOGLE_BACKEND_GEO_KEY');
export const exportSDKKey = defineSecret('EXPORT_SDK_KEY');
export const elevationKey = defineSecret('GPXZ_KEY');
export const stripeSecretKey = defineSecret('STRIPE_SECRET_KEY');
export const stripeEndpointSecret = defineSecret('STRIPE_ENDPOINT_SECRET');
export const quickbooksClientSecret = defineSecret('QUICKBOOKS_CLIENT_SECRET');
export const rentcastKey = defineSecret('RENTCAST_KEY');
export const mapboxToken = defineSecret('MAPBOX_TOKEN');

export const audience = defineString('AUDIENCE');
export const hostingBaseURL = defineString('HOSTING_BASE_URL');
export const functionsBaseURL = defineString('FUNCTIONS_BASE_URL');
export const ePayBaseHostingURL = defineString('EPAY_HOSTING_BASE_URL');
export const ePayBaseURL = defineString('EPAY_BASE_URL');
export const attomBaseURL = defineString('ATTOM_BASE_URL');

export const counties20mURL = defineString('COUNTIES_URL');
// export const algoliaIndex = defineString('ALGOLIA_INDEX');
// export const algoliaAppId = defineString('ALGOLIA_APP_ID');
export const defaultFloodZone = defineString('DEFAULT_FLOOD_ZONE');
export const storageBaseUrl = defineString('STORAGE_BASE_URL');
export const submissionsApiBaseURL = defineString('SUBMISSIONS_API_BASE_URL');
export const env = defineString('ENV');
export const decPageTemplateId = defineString('DEC_PAGE_TEMPLATE_ID');
export const swissReProductCode = defineString('SWISS_RE_PRODUCT_CODE');
export const swissReToolCode = defineString('SWISS_RE_TOOL_CODE');
export const swissReAuthScope = defineString('SWISS_RE_AUTH_SCOPE');
export const swissReAccessTokenURL = defineString('SWISS_RE_ACCESS_TOKEN_URL');
export const swissReBaseURL = defineString('SWISS_RE_BASE_URL');
export const signNowBaseURL = defineString('SIGN_NOW_BASE_URL');
export const pubSubEmulatorHost = defineString('PUBSUB_EMULATOR_HOST', {
  default: '8085',
});
export const quickbooksClientId = defineString('QUICKBOOKS_CLIENT_ID');
// export const quickbooksRedirectUri = defineString('QUICKBOOKS_REDIRECT_URI');
export const typesenseHost = defineString('TYPESENSE_HOST');
export const typesenseProtocol = defineString('TYPESENSE_PROTOCOL', {
  default: 'https',
});
export const typesenseCollectionPrefix = defineString(
  'TYPESENSE_COLLECTION_PREFIX',
);
export const mgaDomain = defineString('MGA_DOMAIN', {
  default: '@s-carlson.com',
});
export const mgaOrgId = defineString('MGA_ORG_ID');
export const fipsUrl = defineString('FIPS_URL', {
  default: 'https://scarlson1.github.io/data/fips_small.json',
});

export const typesensePort = defineInt('TYPESENSE_PORT', { default: 443 });
export const maxA = defineInt('FLOOD_MAX_LIMIT_A', { default: 1000000 });
export const minA = defineInt('FLOOD_MIN_LIMIT_A', { default: 100000 });
export const maxBCD = defineInt('FLOOD_MAX_LIMIT_B_C_D', { default: 1000000 });
export const minDeductibleFlood = defineInt('FLOOD_MIN_DEDUCTIBLE', {
  default: 1000,
});
export const defaultCommissionAsInt = defineInt('DEFAULT_COMMISSION_AS_INT', {
  default: 15,
});

// defineFloat not implemented yet
// ISSUE REF: https://github.com/firebase/firebase-tools/issues/5433
// TODO: change to defineFloat once available
// export const cardFeePct = defineFloat('CARD_FEE_PCT', { default: 0.035 });
export const cardFeePct = defineString('CARD_FEE_PCT', { default: '0.035' });
// Number.parseFloat(randomFloat.value())
// TODO: default commission

export const emulators = defineBoolean('EMULATORS');
export const mockSwissRe = defineBoolean('MOCK_SWISS_RE', {
  // default: true,
});
