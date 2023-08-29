import {
  defineBoolean,
  defineInt,
  // defineFloat, not implemented yet in firebase-functions
  defineSecret,
  defineString,
  projectID,
} from 'firebase-functions/params';

export const minInstances = projectID.equals('PRODUCTION').thenElse(1, 0);

export const sendgridApiKey = defineSecret('SENDGRID_API_KEY');
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
export const firebaseHashConfig = defineSecret('FIREBASE_AUTH_HASH_CONFIG');
export const algoliaAdminKey = defineSecret('ALGOLIA_ADMIN_API_KEY');
export const algoliaUserBaseKey = defineSecret('ALGOLIA_BASE_USER_SEARCH_KEY');
export const algoliaIDemandAdminSearchKey = defineSecret('ALGOLIA_IDEMAND_ADMIN_SEARCH_KEY');
export const googleGeoKey = defineSecret('GOOGLE_BACKEND_GEO_KEY');
export const exportSDKKey = defineSecret('EXPORT_SDK_KEY');

export const audience = defineString('AUDIENCE');
export const hostingBaseURL = defineString('HOSTING_BASE_URL');
export const functionsBaseURL = defineString('FUNCTIONS_BASE_URL');
export const ePayBaseURL = defineString('EPAY_HOSTING_BASE_URL');
export const attomBaseURL = defineString('ATTOM_BASE_URL');
export const mapboxPublicToken = defineString('MAPBOX_PUBLIC_TOKEN');
export const counties20mURL = defineString('COUNTIES_URL');
export const algoliaIndex = defineString('ALGOLIA_INDEX');
export const algoliaAppId = defineString('ALGOLIA_APP_ID');
export const defaultFloodZone = defineString('DEFAULT_FLOOD_ZONE');
export const iDemandOrgId = defineString('IDEMAND_ORG_ID');
export const storageBaseUrl = defineString('STORAGE_BASE_URL');
export const submissionsApiBaseURL = defineString('SUBMISSIONS_API_BASE_URL');
export const env = defineString('ENV');
export const decPageTemplateId = defineString('DEC_PAGE_TEMPLATE_ID');

export const maxA = defineInt('FLOOD_MAX_LIMIT_A', { default: 1000000 });
export const minA = defineInt('FLOOD_MIN_LIMIT_A', { default: 100000 });
export const maxBCD = defineInt('FLOOD_MAX_LIMIT_B_C_D', { default: 1000000 });
export const minDeductibleFlood = defineInt('FLOOD_MIN_DEDUCTIBLE', { default: 1000 });
export const defaultCommissionAsInt = defineInt('DEFAULT_COMMISSION_AS_INT', { default: 15 });

// defineFloat not implemented yet
// ISSUE REF: https://github.com/firebase/firebase-tools/issues/5433
// TODO: change to defineFloat once available
// export const cardFeePct = defineFloat('CARD_FEE_PCT', { default: 0.035 });
export const cardFeePct = defineString('CARD_FEE_PCT', { default: '0.035' });
// Number.parseFloat(randomFloat.value())
// TODO: default commission

export const emulators = defineBoolean('EMULATORS');
