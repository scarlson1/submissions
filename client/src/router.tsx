import { wrapCreateBrowserRouterV6 } from '@sentry/react';
import {
  createBrowserRouter,
  createSearchParams,
  Params,
  URLSearchParamsInit,
} from 'react-router-dom';

import { PageMeta } from 'components/PageMeta';
import { RequireAuth } from 'components/RequireAuth';
import RouterErrorBoundary from 'components/RouterErrorBoundary';
// import { StripePmtIntentWrapper } from 'components/forms/StripeCheckout/StripeElementsWrapper';
import { Claim, type Product } from '@idemand/common';
import { ConnectPayments, ConnectPayouts } from '@stripe/react-connect-js';
import { ConfigLayout, Layout, SettingsLayout } from 'components/layout';
import { RouterLink as BreadCrumbLink } from 'components/layout/Breadcrumbs';
import {
  hasAdminClaimsValidator,
  RequireAuthReactFire,
} from 'components/RequireAuthReactFire';
import { TempWrappedSearch } from 'components/search/Search';
import { AuthActionsProvider } from 'context';
import { ActionHandler } from 'elements';
import { SuccessStep } from 'elements/forms';
import { LocationChangeWrapper } from 'elements/forms/LocationChangeForm';
import StripeBindQuote from 'elements/forms/StripeBindQuote';
import StripeCheckout from 'elements/forms/StripeCheckout';
import { StripePaymentSuccess } from 'elements/forms/StripeReceivableCheckout/StripePaymentSuccess';
import { BindSuccess } from 'elements/forms/SuccessStep';
import { EmailsGrid, ImportsSummaryGrid } from 'elements/grids';
import { ActiveEventsMap, PoliciesMap } from 'elements/maps';
import { TestSubmissionsMapWithFilters } from 'elements/maps/SubmissionsMap';
import {
  OrgDetails,
  OrgSecurity,
  OrgUsers,
  UserDetails as UserDetailsNew,
  UserSecurity,
} from 'elements/settings';
import { CurrentUserOrgStripeConnectOnboarding } from 'elements/settings/OrgStripeConnectOnboarding';
import { StripeConnectViewsLayout } from 'elements/StripeConnectViewsLayout';
import {
  AddLocation,
  AgencyNew,
  Claims,
  ContactUs,
  CreateAccount,
  Home,
  Login,
  Policies,
  Policy,
  QuoteBind,
  Quotes,
  ReceivableCheckout,
  SubmissionNew,
  SubmissionNewPortfolio,
  Submissions,
  SubmissionView,
  UserDetails,
  ViewQuote,
} from 'views';
import { AccountDetailsNew } from 'views/AccountDetailsNew';
import {
  Home as AdminHome,
  AdminLocations,
  AgencyApp,
  AgencyApps,
  CreateTenant,
  DisclosureEdit,
  DisclosureNew,
  EditActiveStates,
  ImportReview,
  LicenseEdit,
  LicenseNew,
  Licenses,
  MoratoriumEdit,
  MoratoriumNew,
  Moratoriums,
  Organization,
  Organizations,
  PolicyDelivery,
  QuoteEdit,
  QuoteNew,
  QuoteNewFromSub,
  Receivables,
  SLTaxEdit,
  SLTaxes,
  SLTaxNew,
  Transactions,
  Users,
} from 'views/admin';
import { Disclosures } from 'views/admin/Disclosures';
import { Exposure } from 'views/admin/Exposure';
import { ViewReceivables } from 'views/admin/ViewReceivables';
import { AgencyAppSuccessStep } from 'views/AgencyNew';
import { ClaimNew } from 'views/ClaimNew';
import { EmailVerified } from 'views/EmailVerified';
import App from './App';

// TODO: move react component exports to different file (vite hot reload issue)

export interface CrumbMatch {
  id: string;
  pathname: string;
  params: Params<string>;
  data: unknown;
  handle: {
    crumb?: (match: CrumbMatch) => React.ReactElement | null;
  };
}

// import RouterErrorBoundary from 'components/errorBoundaries/RouterErrorBoundary';

// provider for react-router (pass user etc.): https://stackoverflow.com/a/74929447/10887890

// TODO: route-based code splitting - https://legacy.reactjs.org/docs/code-splitting.html#route-based-code-splitting
//    - split routes by nesting or type (/admin) or (/quotes) ??
//    - currently only supports default exports (can reexport as default in module if needed)
// TODO: refactor create path to deal with relative routes ??
// TODO: add errorElement to routes

export enum ROUTES {
  HOME = '/',
  SUBMISSION_NEW = '/new/:productId', // TODO: update hard coded link on website and change this route to /submissions/new/:productId
  SUBMISSION_SUBMITTED = '/submissions/:submissionId/submitted',
  SUBMISSIONS = '/submissions',
  SUBMISSION_VIEW = '/submissions/:submissionId',
  SUBMISSIONS_NEW_PORTFOLIO = '/submissions/new/:productId/portfolio',
  QUOTES = '/quotes',
  QUOTE_VIEW = '/quotes/:quoteId',
  QUOTE_BIND = '/quotes/:quoteId/bind',
  QUOTE_STRIPE_CHECKOUT = '/quotes/:quoteId/checkout',
  // QUOTE_BIND_SUCCESS_STRIPE = '/quotes/:quoteId/bind/success',
  QUOTE_BIND_SUCCESS_STRIPE = '/quotes/bind/success',
  QUOTE_BIND_EPAY = '/quotes/:quoteId/bind/epay',
  QUOTE_BIND_SUCCESS_EPAY = '/quotes/:quoteId/bind/epay/success/:transactionId?', // OLD EPAY
  CONTACT = '/contact',
  USER_QUOTES = '/quotes/list/:userId', // TODO: use users view instead (with query param to initialize tab state)
  CLAIMS = '/claims',
  POLICIES = '/policies',
  POLICY = '/policies/:policyId',
  ADD_LOCATION_NEW = '/policies/:policyId/locations/new',
  // CLAIM_NEW = '/policies/:policyId/claim/new',
  CLAIM_NEW = '/policies/:policyId/:locationId/claims/new',
  POLICY_RECEIVABLES = '/policies/:policyId/receivables',
  POLICY_RECEIVABLE_CHECKOUT = '/receivables/:receivableId', // TODO: /policies/:policyId/receivables/receivableId
  AGENCY_NEW = '/agency/new',
  AGENCY_NEW_SUBMITTED = '/agency/new/:submissionId/success',
  ACCOUNT = '/account',
  STRIPE_PAYOUTS = '/account/stripe/payouts',
  USER = '/user/:userId',
}

export enum ADMIN_ROUTES {
  QUOTES = '/admin/quotes',
  QUOTE_NEW_BLANK = '/admin/quotes/:productId/new',
  QUOTE_NEW = '/admin/quotes/:productId/new/:submissionId',
  QUOTE_EDIT = '/admin/quotes/:productId/edit/:quoteId',
  POLICY_DELIVERY = '/admin/policies/:policyId/delivery',
  // POLICIES = '/admin/policies',
  AGENCY_APPS = '/admin/agencies/submissions',
  AGENCY_APP = '/admin/agencies/submissions/:submissionId',
  CREATE_TENANT = '/admin/agencies/new',
  ORGANIZATIONS = '/admin/orgs',
  ORGANIZATION = '/admin/orgs/:orgId',
  USERS = '/admin/users',
  PORTFOLIO_RATING = '/admin/portfolio-rating',
  CONFIG = '/admin/config',
  SL_TAXES = '/admin/config/taxes',
  SL_TAXES_NEW = '/admin/config/taxes/new',
  SL_TAXES_EDIT = '/admin/config/taxes/:taxId/edit',
  EDIT_ACTIVE_STATES = '/admin/config/active-states/:productId/edit',
  MORATORIUMS = '/admin/config/moratoriums',
  MORATORIUM_NEW = '/admin/config/moratoriums/new',
  MORATORIUM_EDIT = '/admin/config/moratoriums/:moratoriumId/edit',
  SL_LICENSES = '/admin/config/licenses',
  SL_LICENSE_NEW = '/admin/config/licenses/new',
  LICENSE_EDIT = '/admin/config/licenses/:licenseId/edit',
  DISCLOSURES = '/admin/config/disclosures',
  DISCLOSURE_NEW = '/admin/config/disclosures/new',
  DISCLOSURE_EDIT = '/admin/config/disclosures/:disclosureId/edit',
  DATA_IMPORTS = '/admin/config/imports',
  IMPORT_REVIEW = '/admin/config/imports/:importId',
  EMAIL_ACTIVITY = '/admin/config/email-activity',
  TRANSACTIONS = '/admin/config/transactions',
  RECEIVABLES = '/admin/config/receivables', // TODO: move to non admin route once permissions fixed
  EXPOSURE = '/admin/config/exposure',
  LOCATIONS = '/admin/locations',
}

export enum AUTH_ROUTES {
  LOGIN = '/auth/login/',
  CREATE_ACCOUNT = '/auth/create-account',
  ACTIONS_HANDLER = '/auth/actions-handler',
  TENANT_LOGIN = '/auth/login/:tenantId', // ?
  TENANT_CREATE_ACCOUNT = '/auth/create-account/:tenantId', // ?
  TENANT_ACTIONS_HANDLER = '/auth/actions-handler/:tenantId', // ?
  EMAIL_VERIFIED = '/auth/email-verified',
}

export enum ACCOUNT_ROUTES {
  // ACCOUNT = '/account',
  USER_SETTINGS = '/account/user',
  USER_SETTING = '/account/user/:setting',
  ORG_SETTINGS = '/account/org',
  ORG_SETTING = '/account/org/:setting',
  // ORG_STRIPE_ONBOARDING = '/account/org/:orgId/stripe', // onboarding
}

type TArgs =
  | { path: ROUTES.HOME }
  | { path: ROUTES.SUBMISSION_NEW; params: { productId: Product } }
  | { path: ROUTES.SUBMISSION_SUBMITTED; params: { submissionId: string } }
  | { path: ROUTES.SUBMISSIONS_NEW_PORTFOLIO }
  | { path: ROUTES.SUBMISSIONS }
  | { path: ROUTES.SUBMISSION_VIEW; params: { submissionId: string } }
  | { path: ROUTES.QUOTES }
  | { path: ROUTES.QUOTE_VIEW; params: { quoteId: string } }
  | { path: ROUTES.QUOTE_BIND; params: { quoteId: string } } // INCLUDE PRODUCT ID ??
  | { path: ROUTES.QUOTE_STRIPE_CHECKOUT; params: { quoteId: string } }
  | { path: ROUTES.QUOTE_BIND_SUCCESS_STRIPE; params: { quoteId: string } }
  | { path: ROUTES.POLICY_RECEIVABLES; params: { policyId: string } }
  | { path: ROUTES.STRIPE_PAYOUTS }
  | { path: ROUTES.QUOTE_BIND_EPAY; params: { quoteId: string } } // INCLUDE PRODUCT ID ??
  | {
      path: ROUTES.QUOTE_BIND_SUCCESS_EPAY;
      params: { quoteId: string; transactionId?: string };
    }
  | { path: ROUTES.CLAIMS }
  | { path: ROUTES.POLICIES; search?: { productId?: Product } }
  | {
      path: ROUTES.POLICY;
      params: { policyId: string };
      search?: { view: string };
    }
  | { path: ROUTES.ADD_LOCATION_NEW; params: { policyId: string } }
  | { path: ROUTES.CLAIM_NEW; params: { policyId: string; locationId: string } }
  | {
      path: ROUTES.POLICY_RECEIVABLE_CHECKOUT;
      params: { receivableId: string };
    }
  | { path: ROUTES.AGENCY_NEW }
  | { path: ROUTES.AGENCY_NEW_SUBMITTED; params: { submissionId: string } }
  | { path: ROUTES.CONTACT }
  | { path: ROUTES.USER; params: { userId: string } } // TODO: move users route from admin so can be used for agents (users grid) -- what would query look like ??
  | { path: ADMIN_ROUTES.QUOTE_NEW_BLANK; params: { productId: Product } }
  | {
      path: ADMIN_ROUTES.QUOTE_NEW;
      params: { productId: Product; submissionId: string };
    }
  | {
      path: ADMIN_ROUTES.QUOTE_EDIT;
      params: { productId: Product; quoteId: string };
    }
  | { path: ADMIN_ROUTES.POLICY_DELIVERY; params: { policyId: string } }
  | { path: ADMIN_ROUTES.CONFIG }
  | { path: ADMIN_ROUTES.SL_TAXES }
  | { path: ADMIN_ROUTES.SL_TAXES_NEW }
  | { path: ADMIN_ROUTES.SL_TAXES_EDIT; params: { taxId: string } }
  | { path: ADMIN_ROUTES.EDIT_ACTIVE_STATES; params: { productId: Product } }
  | { path: ADMIN_ROUTES.MORATORIUMS }
  | { path: ADMIN_ROUTES.MORATORIUM_NEW }
  | { path: ADMIN_ROUTES.MORATORIUM_EDIT; params: { moratoriumId: string } }
  | { path: ADMIN_ROUTES.SL_LICENSES }
  | { path: ADMIN_ROUTES.SL_LICENSE_NEW }
  | { path: ADMIN_ROUTES.LICENSE_EDIT; params: { licenseId: string } }
  | { path: ADMIN_ROUTES.AGENCY_APPS }
  | { path: ADMIN_ROUTES.AGENCY_APP; params: { submissionId: string } }
  | { path: ADMIN_ROUTES.DISCLOSURES }
  | { path: ADMIN_ROUTES.DISCLOSURE_NEW }
  | { path: ADMIN_ROUTES.DISCLOSURE_EDIT; params: { disclosureId: string } }
  | { path: ADMIN_ROUTES.CREATE_TENANT }
  | { path: ADMIN_ROUTES.ORGANIZATIONS }
  | {
      path: ADMIN_ROUTES.ORGANIZATION;
      params: { orgId: string };
      search?: { tab: string };
    }
  | { path: ADMIN_ROUTES.USERS }
  | { path: ADMIN_ROUTES.PORTFOLIO_RATING }
  | { path: ADMIN_ROUTES.DATA_IMPORTS }
  | { path: ADMIN_ROUTES.IMPORT_REVIEW; params: { importId: string } }
  | { path: ADMIN_ROUTES.EMAIL_ACTIVITY }
  | { path: ADMIN_ROUTES.TRANSACTIONS }
  | { path: ADMIN_ROUTES.RECEIVABLES }
  | { path: ADMIN_ROUTES.EXPOSURE }
  | { path: ADMIN_ROUTES.LOCATIONS }
  | {
      path: AUTH_ROUTES.CREATE_ACCOUNT;
      params?: { tenantId?: string };
      search?: { email?: string; firstName?: string; lastName?: string };
    }
  | {
      path: AUTH_ROUTES.LOGIN;
      params?: { tenantId?: string };
      search?: { email?: string };
    }
  | {
      path: AUTH_ROUTES.TENANT_CREATE_ACCOUNT;
      params?: { tenantId?: string };
      search?: { email?: string; firstName?: string; lastName?: string };
    }
  | {
      path: AUTH_ROUTES.TENANT_LOGIN;
      params?: { tenantId?: string };
      search?: { email?: string };
    }
  | {
      path: AUTH_ROUTES.ACTIONS_HANDLER;
      search: { mode: string; oobCode: string; continueUrl?: string | null };
    }
  | {
      path: AUTH_ROUTES.ACTIONS_HANDLER;
      params?: { tenantId?: string };
      search: { mode: string; oobCode: string; continueUrl?: string | null };
    }
  | { path: AUTH_ROUTES.EMAIL_VERIFIED; search?: { email: string } }
  // | { path: ACCOUNT_ROUTES.ACCOUNT }
  | { path: ACCOUNT_ROUTES.USER_SETTINGS }
  | { path: ACCOUNT_ROUTES.USER_SETTING; params: { setting: string } }
  | { path: ACCOUNT_ROUTES.ORG_SETTINGS }
  | { path: ACCOUNT_ROUTES.ORG_SETTING; params: { setting: string } };
// | { path: ACCOUNT_ROUTES.ORG_STRIPE_ONBOARDING; params: { orgId: string } };

type TArgsWithParams = Extract<TArgs, { path: any; params: any }>;

type TArgsWithSearch = Extract<
  TArgs,
  { path: any; search: URLSearchParamsInit }
>;

export function createPath(args: TArgs) {
  if (
    args.hasOwnProperty('params') === false &&
    args.hasOwnProperty('search') === false
  )
    return args.path;

  let resolvedPath: string = args.path;

  // Create a path by replacing params in the route definition
  if (args.hasOwnProperty('params') !== false) {
    resolvedPath = Object.entries((args as TArgsWithParams).params).reduce(
      (previousValue: string, [param, value]) =>
        previousValue.replace(`:${param}`, '' + value),
      args.path,
    );
  }
  if (args.hasOwnProperty('search') !== false) {
    const { search } = args as TArgsWithSearch;
    resolvedPath += `?${createSearchParams(search)}`;
  }

  return resolvedPath;
}

const sentryCreateBrowserRouter =
  wrapCreateBrowserRouterV6(createBrowserRouter);

// export const router = createBrowserRouter([
export const router = sentryCreateBrowserRouter([
  {
    path: '/',
    element: <App />,
    errorElement: <RouterErrorBoundary />,
    children: [
      {
        path: '/',
        element: (
          <Layout
            containerProps={{ maxWidth: 'xl', sx: { flex: '1 0 auto' } }}
          />
        ),
        errorElement: <RouterErrorBoundary />,
        children: [
          {
            index: true,
            element: <Home />,
          },
          {
            path: ROUTES.SUBMISSION_NEW,
            element: (
              <RequireAuth shouldSignInAnonymously={true}>
                <>
                  <PageMeta title='iDemand - New Submission' />
                  <SubmissionNew />
                </>
              </RequireAuth>
            ),
            errorElement: (
              <RouterErrorBoundary
                actionButtons={[
                  {
                    path: createPath({
                      path: ROUTES.SUBMISSION_NEW,
                      params: { productId: 'flood' },
                    }),
                    label: 'Start new quote',
                  },
                ]}
              />
            ),
            handle: {
              crumb: (match: CrumbMatch) => [
                {
                  label: 'Submissions',
                  link: createPath({
                    path: ROUTES.SUBMISSIONS,
                  }),
                },
                {
                  label: 'New',
                },
              ],
            },
          },
          {
            path: ROUTES.SUBMISSIONS_NEW_PORTFOLIO,
            element: (
              <>
                <PageMeta title='iDemand - Portfolio Quote' />
                <SubmissionNewPortfolio />
              </>
            ),
            errorElement: <RouterErrorBoundary />,
            handle: {
              crumb: (match: CrumbMatch) => [
                {
                  label: 'Submissions',
                  link: createPath({
                    path: ROUTES.SUBMISSIONS,
                  }),
                },
                {
                  label: 'New',
                  link: createPath({
                    path: ROUTES.SUBMISSION_NEW,
                    params: { productId: 'flood' },
                  }),
                },
                {
                  label: 'Portfolio',
                },
              ],
            },
          },
          {
            path: ROUTES.SUBMISSIONS,
            element: (
              <RequireAuthReactFire>
                <>
                  <PageMeta title='iDemand - Submissions' />
                  <Submissions />
                </>
              </RequireAuthReactFire>
            ),
            errorElement: <RouterErrorBoundary />,
            handle: {
              crumb: (match: CrumbMatch) => [
                {
                  label: 'Submissions',
                  link: createPath({
                    path: ROUTES.SUBMISSIONS,
                  }),
                },
              ],
            },
          },
          {
            path: ROUTES.SUBMISSION_VIEW,
            element: <SubmissionView />,
            errorElement: <RouterErrorBoundary />,
            handle: {
              crumb: (match: CrumbMatch) => [
                {
                  label: 'Submissions',
                  link: createPath({
                    path: ROUTES.SUBMISSIONS,
                  }),
                },
                {
                  label: `${match?.params?.submissionId || ''}`,
                },
              ],
            },
          },
          {
            path: ROUTES.QUOTES,

            element: (
              <RequireAuthReactFire>
                <>
                  <PageMeta title='iDemand - Quotes' />
                  <Quotes />
                </>
              </RequireAuthReactFire>
            ),
            errorElement: <RouterErrorBoundary />,
            handle: {
              crumb: (match: CrumbMatch) => [
                {
                  label: 'Quotes',
                  link: createPath({
                    path: ROUTES.QUOTES,
                  }),
                },
              ],
            },
          },
          {
            path: ROUTES.QUOTE_VIEW,
            element: <ViewQuote />,
            handle: {
              crumb: (match: CrumbMatch) => [
                {
                  label: 'Quotes',
                  link: createPath({
                    path: ROUTES.QUOTES,
                  }),
                },
                {
                  label: `${match?.params?.quoteId || ''}`,
                },
              ],
            },
          },
          {
            path: ROUTES.QUOTE_BIND,
            // element: <QuoteBind />,
            element: (
              <RequireAuthReactFire>
                <StripeBindQuote />
              </RequireAuthReactFire>
            ),
            handle: {
              crumb: (match: CrumbMatch) => [
                {
                  label: 'Quotes',
                  link: createPath({
                    path: ROUTES.QUOTES,
                  }),
                },
                {
                  label: `${match?.params?.quoteId || ''}`,
                  link: createPath({
                    path: ROUTES.QUOTE_VIEW,
                    params: { quoteId: `${match?.params?.quoteId || ''}` },
                  }),
                },
                {
                  label: `Bind`,
                },
              ],
            },
          },
          // not used ??
          {
            path: ROUTES.QUOTE_STRIPE_CHECKOUT,
            element: (
              <RequireAuthReactFire>
                <StripeCheckout />
              </RequireAuthReactFire>
            ),
            handle: {
              crumb: (match: CrumbMatch) => [
                {
                  label: 'Quotes',
                  link: createPath({
                    path: ROUTES.QUOTES,
                  }),
                },
                {
                  label: `${match?.params?.quoteId || ''}`,
                  link: createPath({
                    path: ROUTES.QUOTE_VIEW,
                    params: { quoteId: `${match?.params?.quoteId || ''}` },
                  }),
                },
                {
                  label: `Checkout`,
                },
              ],
            },
          },
          {
            path: ROUTES.QUOTE_BIND_SUCCESS_STRIPE,
            element: (
              <RequireAuthReactFire>
                <StripePaymentSuccess />
              </RequireAuthReactFire>
            ),
            handle: {
              crumb: (match: CrumbMatch) => [
                {
                  label: 'Quotes',
                  link: createPath({
                    path: ROUTES.QUOTES,
                  }),
                },
                {
                  label: `${match?.params?.quoteId || ''}`,
                  link: createPath({
                    path: ROUTES.QUOTE_VIEW,
                    params: { quoteId: `${match?.params?.quoteId || ''}` },
                  }),
                },
                {
                  label: `Bound`,
                },
              ],
            },
          },
          {
            path: ROUTES.POLICY_RECEIVABLES,
            element: (
              <RequireAuthReactFire>
                <ViewReceivables />
              </RequireAuthReactFire>
            ),
          },
          {
            path: ROUTES.STRIPE_PAYOUTS,
            element: (
              <RequireAuthReactFire
                signInCheckProps={{
                  validateCustomClaims: hasAdminClaimsValidator,
                }}
              >
                <StripeConnectViewsLayout />
              </RequireAuthReactFire>
            ),
            children: [
              {
                path: 'payments',
                element: <ConnectPayments />,
              },
              {
                path: 'payouts',
                element: <ConnectPayouts />,
              },
              // {
              //   path: 'payouts',
              //   element: <OrgStripeConnectOnboarding orgId={orgId} />,
              // },
            ],
          },
          {
            path: ROUTES.QUOTE_BIND_EPAY,
            element: <QuoteBind />,
            handle: {
              crumb: (match: CrumbMatch) => [
                {
                  label: 'Quotes',
                  link: createPath({
                    path: ROUTES.QUOTES,
                  }),
                },
                {
                  label: `${match?.params?.quoteId || ''}`,
                  link: createPath({
                    path: ROUTES.QUOTE_VIEW,
                    params: { quoteId: `${match?.params?.quoteId || ''}` },
                  }),
                },
                {
                  label: `Bind`,
                },
              ],
            },
          },
          {
            path: ROUTES.QUOTE_BIND_SUCCESS_EPAY,
            element: (
              <>
                <PageMeta title='iDemand - Bound' />
                <BindSuccess />
              </>
            ),
            handle: {
              crumb: (match: CrumbMatch) => [
                {
                  label: 'Quotes',
                  link: createPath({
                    path: ROUTES.QUOTES,
                  }),
                },
                {
                  label: `${match?.params?.quoteId || ''}`,
                  link: createPath({
                    path: ROUTES.QUOTE_VIEW,
                    params: { quoteId: `${match?.params?.quoteId || ''}` },
                  }),
                },
                {
                  label: `Bind`,
                },
                {
                  label: `Success`,
                },
              ],
            },
          },
          {
            path: ROUTES.SUBMISSION_SUBMITTED,
            element: (
              <>
                <PageMeta title='iDemand - New Submission Complete' />
                <SuccessStep />
              </>
            ),
            errorElement: <RouterErrorBoundary />,
            handle: {
              crumb: (match: CrumbMatch) => [
                {
                  label: 'Submissions',
                  link: createPath({
                    path: ROUTES.SUBMISSIONS,
                  }),
                },
                {
                  label: `${match?.params?.submissionId || ''}`,
                  // link: createPath({
                  //   path: ROUTES.SUBMISSION_SUBMITTED,
                  //   params: { submissionId: `${match?.params?.submissionId || ''}` },
                  // }),
                },
              ],
            },
          },
          {
            path: ROUTES.POLICY_RECEIVABLE_CHECKOUT,
            element: <ReceivableCheckout />,
            errorElement: <RouterErrorBoundary />,
            handle: {
              crumb: (match: CrumbMatch) => [
                {
                  label: 'Receivables',
                  // TODO: add link once route added
                  // link: createPath({
                  //   path: ROUTES.POLICIES,
                  // }),
                },
                {
                  label: `${match?.params?.receivableId || ''}`,
                  // link: createPath({
                  //   path: ROUTES.POLICY,
                  //   params: { policyId: `${match?.params?.policyId || ''}` },
                  // }),
                },
              ],
            },
          },
          {
            path: ROUTES.AGENCY_NEW,
            element: (
              <>
                <PageMeta title='iDemand - New Agency' />
                <AgencyNew />
              </>
            ),
            errorElement: <RouterErrorBoundary />,
            handle: {
              crumb: (match: CrumbMatch) => [
                {
                  label: 'Agencies',
                },
                {
                  label: `New`,
                },
              ],
            },
          },
          {
            path: ROUTES.AGENCY_NEW_SUBMITTED,
            element: (
              <>
                <PageMeta title='iDemand - New Agency Submitted' />
                <AgencyAppSuccessStep />
              </>
            ),
            errorElement: <RouterErrorBoundary />,
            handle: {
              crumb: (match: CrumbMatch) => [
                {
                  label: 'Agencies',
                },
                {
                  label: `New`,
                },
                {
                  label: `${match?.params?.submissionId || ''}`,
                },
              ],
            },
          },
          {
            path: ROUTES.CONTACT,
            element: (
              <>
                <PageMeta title='iDemand - Contact' />
                <ContactUs />
              </>
            ),
            errorElement: <RouterErrorBoundary />,
            handle: {
              crumb: (match: CrumbMatch) => [
                {
                  label: 'Contact',
                  link: createPath({
                    path: ROUTES.CONTACT,
                  }),
                },
              ],
            },
          },
          {
            path: ROUTES.USER,
            element: (
              <RequireAuth>
                <>
                  <PageMeta title='iDemand - User' />
                  <UserDetails />
                </>
              </RequireAuth>
            ),
            handle: {
              crumb: (match: CrumbMatch) => [
                {
                  label: 'Users',
                },
                {
                  label: `${match?.params?.userId || ''}`,
                },
              ],
            },
          },
          {
            path: 'account',
            element: (
              <AuthActionsProvider>
                <RequireAuthReactFire>
                  <>
                    <PageMeta title='iDemand - Account' />
                    {/* <Layout /> */}
                    <AccountDetailsNew />
                  </>
                </RequireAuthReactFire>
              </AuthActionsProvider>
            ),
            errorElement: <RouterErrorBoundary />,
            // alternatively could use :tab and handle nav routes display in component ??
            children: [
              {
                index: true,
                // element: <AccountDetails />,
                element: (
                  <SettingsLayout
                    navItems={[
                      {
                        title: 'User Details',
                        route: 'details',
                      },
                      {
                        title: 'Security',
                        route: 'security',
                      },
                    ]}
                  />
                ),
              },
              {
                // index: true, cannot specify children on index route
                path: 'user',
                element: (
                  <SettingsLayout
                    navItems={[
                      {
                        title: 'User Details',
                        route: 'details',
                        // route: createPath({
                        //   path: ACCOUNT_ROUTES.USER_SETTING,
                        //   params: { setting: 'details' },
                        // }),
                      },
                      // { title: 'Security', route: 'security' },
                      {
                        title: 'Security',
                        route: 'security',
                        // route: createPath({
                        //   path: ACCOUNT_ROUTES.USER_SETTING,
                        //   params: { setting: 'security' },
                        // }),
                      },
                    ]}
                  />
                ),
                children: [
                  {
                    // path: ':setting', // can either handle display in component based on the setting param
                    // or explicitly specify each setting page in router ??
                    index: true,
                    element: <UserDetailsNew />,
                  },
                  {
                    // path: ':setting', // can either handle display in component based on the setting param
                    // or explicitly specify each setting page in router ??
                    // index: true,
                    path: 'details',
                    element: <UserDetailsNew />,
                  },
                  // path: 'details/edit' ?? or handle edit state in component ??
                  {
                    // path: ':setting', // can either handle display in component based on the setting param
                    // or explicitly specify each setting page in router ??
                    path: 'security',
                    element: <UserSecurity />,
                  },
                ],
              },
              {
                path: 'org',
                element: (
                  <SettingsLayout
                    navItems={[
                      {
                        title: 'Org Details',
                        route: 'details',
                        // route: createPath({
                        //   path: ACCOUNT_ROUTES.ORG_SETTING,
                        //   params: { setting: 'details' },
                        // }),
                      },
                      {
                        title: 'Team',
                        route: 'team',
                        // route: createPath({
                        //   path: ACCOUNT_ROUTES.ORG_SETTING,
                        //   params: { setting: 'team' },
                        // }),
                      },
                      {
                        title: 'Security',
                        route: 'security',
                        // route: createPath({
                        //   path: ACCOUNT_ROUTES.ORG_SETTING,
                        //   params: { setting: 'security' },
                        // }),
                      },
                      {
                        title: 'Payouts',
                        route: 'stripe',
                        // route: createPath({
                        //   path: ACCOUNT_ROUTES.ORG_SETTING,
                        //   params: { setting: 'security' },
                        // }),
                      },
                    ]}
                  />
                ),
                children: [
                  {
                    // path: ':setting', // can either handle display in component based on the setting param
                    // or explicitly specify each setting page in router ??
                    index: true,
                    // path: 'details',
                    element: <OrgDetails />,
                  },
                  {
                    // path: ':setting', // can either handle display in component based on the setting param
                    // or explicitly specify each setting page in router ??
                    path: 'details',
                    element: <OrgDetails />,
                  },
                  {
                    // path: ':setting', // can either handle display in component based on the setting param
                    // or explicitly specify each setting page in router ??
                    path: 'team',
                    element: <OrgUsers />,
                  },
                  {
                    // path: ':setting', // can either handle display in component based on the setting param
                    // or explicitly specify each setting page in router ??
                    path: 'security',
                    element: <OrgSecurity />,
                  },
                  {
                    path: 'stripe', // ACCOUNT_ROUTES.ORG_STRIPE_ONBOARDING,
                    element: (
                      <RequireAuth
                        // requiredClaims={['IDEMAND_ADMIN', 'ORG_ADMIN']}
                        requiredClaims={['iDemandAdmin', 'orgAdmin']}
                      >
                        <CurrentUserOrgStripeConnectOnboarding />
                      </RequireAuth>
                    ),
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        path: '/auth',
        element: (
          <AuthActionsProvider>
            <Layout containerProps={{ maxWidth: 'xl' }} />
          </AuthActionsProvider>
        ),
        errorElement: <RouterErrorBoundary />,
        children: [
          {
            index: true,
            element: (
              <>
                <PageMeta title='iDemand - Login' />
                <Login />
              </>
            ),
          },
          {
            path: AUTH_ROUTES.LOGIN,
            children: [
              {
                path: '',
                element: <Login />,
              },
              {
                path: ':tenantId',
                element: <Login />,
              },
            ],
          },
          {
            path: AUTH_ROUTES.CREATE_ACCOUNT,
            children: [
              {
                path: '',
                element: (
                  <>
                    <PageMeta title='iDemand - Create Account' />
                    <CreateAccount />
                  </>
                ),
              },
              {
                path: ':tenantId',
                element: (
                  <>
                    <PageMeta title='iDemand - Create Account' />
                    <CreateAccount />
                  </>
                ),
              },
            ],
          },
          {
            path: AUTH_ROUTES.ACTIONS_HANDLER,
            children: [
              {
                path: '',
                element: (
                  <>
                    <PageMeta title='iDemand' />
                    <ActionHandler />
                  </>
                ),
              },
              {
                path: ':tenantId',
                element: (
                  <>
                    <PageMeta title='iDemand' />
                    <ActionHandler />
                  </>
                ),
              },
            ],
          },
          {
            path: AUTH_ROUTES.EMAIL_VERIFIED,
            element: (
              <>
                <PageMeta title='iDemand - Email Verification' />
                <EmailVerified />
              </>
            ),
          },
        ],
      },
      {
        path: ROUTES.CLAIMS,
        element: (
          <RequireAuth>
            <Layout />
          </RequireAuth>
        ),
        errorElement: <RouterErrorBoundary />,
        handle: {
          crumb: () => [{ label: 'Claims', link: createPath({ path: ROUTES.CLAIMS }) }],
        },
        children: [
          {
            index: true,
            element: (
              <>
                <PageMeta title='iDemand - Claims' />
                <Claims />
              </>
            ),
            errorElement: <RouterErrorBoundary />,
          },
        ],
      },
      {
        path: '/policies',
        element: (
          <RequireAuth>
            <Layout
              noPadding={true}
              bodyWrapperSX={{ px: 0 }}
              containerProps={{
                maxWidth: false,
                sx: { px: '0 !important', flex: '1 0 auto' },
              }}
            />
          </RequireAuth>
        ),
        errorElement: <RouterErrorBoundary />,
        children: [
          {
            index: true,
            element: (
              <>
                <PageMeta title='iDemand - Policies' />
                <Policies />
              </>
            ),
            errorElement: <RouterErrorBoundary />,
            handle: {
              crumb: (match: CrumbMatch) => [
                {
                  label: 'Policies',
                  link: createPath({
                    path: ROUTES.POLICIES,
                  }),
                },
              ],
            },
          },
          {
            path: ROUTES.POLICY,
            element: <Policy />,
            errorElement: <RouterErrorBoundary />,
            handle: {
              crumb: (match: CrumbMatch) => [
                {
                  label: 'Policies',
                  link: createPath({
                    path: ROUTES.POLICIES,
                  }),
                },
                {
                  label: `${match?.params?.policyId || ''}`,
                  link: createPath({
                    path: ROUTES.POLICY,
                    params: { policyId: `${match?.params?.policyId || ''}` },
                  }),
                },
              ],
            },
          },
          {
            path: `/policies/:policyId/locations/:locationId/change-request`,
            element: <LocationChangeWrapper />,
            errorElement: <RouterErrorBoundary />,
            handle: {
              crumb: (match: CrumbMatch) => [
                {
                  label: 'Policies',
                  link: createPath({
                    path: ROUTES.POLICIES,
                  }),
                },
                {
                  label: `${match?.params?.policyId || ''}`,
                  link: createPath({
                    path: ROUTES.POLICY,
                    params: { policyId: `${match?.params?.policyId || ''}` },
                  }),
                },
                {
                  label: `${match?.params?.locationId || ''}`,
                  // TODO: location details view
                  // link: createPath({
                  //   path: ROUTES.POLICY,
                  //   params: { policyId: `${match?.params?.locationId || ''}` },
                  // }),
                },
                {
                  label: 'Change Request',
                },
              ],
            },
          },
          {
            path: ROUTES.ADD_LOCATION_NEW,
            element: <AddLocation />,
            errorElement: <RouterErrorBoundary />,
            handle: {
              crumb: (match: CrumbMatch) => [
                {
                  label: 'Policies',
                  link: createPath({
                    path: ROUTES.POLICIES,
                  }),
                },
                {
                  label: `${match?.params?.policyId || ''}`,
                  link: createPath({
                    path: ROUTES.POLICY,
                    params: { policyId: `${match?.params?.policyId || ''}` },
                  }),
                },
                {
                  label: 'Add Location',
                },
              ],
            },
          },
          {
            path: ROUTES.CLAIM_NEW,
            element: <ClaimNew />,
            errorElement: <RouterErrorBoundary />,
            handle: {
              crumb: (match: CrumbMatch) => [
                {
                  label: 'Policies',
                  link: createPath({
                    path: ROUTES.POLICIES,
                  }),
                },
                {
                  label: `${match?.params?.policyId || ''}`,
                  link: createPath({
                    path: ROUTES.POLICY,
                    params: { policyId: `${match?.params?.policyId || ''}` },
                  }),
                },
                // TODO: add link to policy claims once route/component added
                {
                  label: 'Claim',
                },
              ],
            },
          },
        ],
      },
      {
        path: 'admin',
        element: (
          // <RequireAuthReactFire signInCheckProps={{ requiredClaims: { [Claim.enum.iDemandAdmin]: true } }}>
          <>
            <PageMeta title='iDemand - Admin' />
            <Layout
              withBreadcrumbs={true}
              containerProps={{ maxWidth: 'xl' }}
            />
          </>
          // </RequireAuthReactFire>
        ),
        errorElement: <RouterErrorBoundary />,
        children: [
          {
            index: true,
            element: (
              <RequireAuthReactFire
                signInCheckProps={{
                  requiredClaims: { [Claim.enum.iDemandAdmin]: true },
                }}
              >
                <AdminHome />
              </RequireAuthReactFire>
            ),
          },
          // {
          //   path: 'stripe-test/:quoteId',
          //   element: (
          //     <RequireAuthReactFire
          //       signInCheckProps={{ requiredClaims: { [Claim.enum.iDemandAdmin]: true } }}
          //     >
          //       <StripeCheckout />
          //     </RequireAuthReactFire>
          //   ),
          // },
          // {
          //   path: 'stripe-test/success',
          //   element: (
          //     <RequireAuthReactFire
          //     // signInCheckProps={{
          //     //   requiredClaims: { [Claim.enum.iDemandAdmin]: true },
          //     // }}
          //     >
          //       <StripePaymentSuccess />
          //     </RequireAuthReactFire>
          //   ),
          // },
          // {
          //   path: 'stripe-test/receivables/:policyId',
          //   element: (
          //     <RequireAuthReactFire
          //       signInCheckProps={{
          //         requiredClaims: { [Claim.enum.iDemandAdmin]: true },
          //       }}
          //     >
          //       <ViewReceivables />
          //     </RequireAuthReactFire>
          //   ),
          // },
          // {
          //   path: 'stripe-test/data',
          //   element: (
          //     <RequireAuthReactFire
          //       signInCheckProps={{
          //         validateCustomClaims: hasAdminClaimsValidator,
          //       }}
          //     >
          //       <StripeConnectViewsLayout />
          //     </RequireAuthReactFire>
          //   ),
          //   children: [
          //     {
          //       path: 'payments',
          //       element: <ConnectPayments />,
          //     },
          //     {
          //       path: 'payouts',
          //       element: <ConnectPayouts />,
          //     },
          //     // {
          //     //   path: 'payouts',
          //     //   element: <OrgStripeConnectOnboarding orgId={orgId} />,
          //     // },
          //   ],
          // },
          // {
          //   path: 'stripe-test/quote/bind/:quoteId',
          //   element: (
          //     <RequireAuthReactFire>
          //       <StripeBindQuote />
          //     </RequireAuthReactFire>
          //   ),
          // },
          {
            path: ADMIN_ROUTES.QUOTE_NEW_BLANK,
            element: (
              <RequireAuthReactFire
                signInCheckProps={{
                  requiredClaims: { [Claim.enum.iDemandAdmin]: true },
                }}
              >
                <>
                  <PageMeta title='New Quote' />
                  <QuoteNew />
                </>
              </RequireAuthReactFire>
            ),
            handle: {
              crumb: (match: CrumbMatch) => [
                {
                  label: 'Quote',
                  link: createPath({
                    path: ROUTES.QUOTES,
                  }),
                },
                {
                  label: 'New',
                },
              ],
            },
          },
          {
            path: ADMIN_ROUTES.QUOTE_NEW,
            element: (
              <RequireAuthReactFire
                signInCheckProps={{
                  requiredClaims: { [Claim.enum.iDemandAdmin]: true },
                }}
              >
                <>
                  <PageMeta title='New Quote' />
                  <QuoteNewFromSub />
                </>
              </RequireAuthReactFire>
            ),
            handle: {
              crumb: (match: CrumbMatch) => [
                {
                  label: 'Quotes',
                  link: createPath({
                    path: ROUTES.QUOTES,
                  }),
                },
                {
                  label: `${match?.params?.productId || ''}`,
                },
                {
                  label: `Sub ${match?.params?.submissionId}`,
                  link: createPath({
                    path: ROUTES.SUBMISSION_VIEW,
                    params: { submissionId: `${match?.params?.submissionId}` },
                  }),
                },
                {
                  label: 'New',
                },
              ],
            },
          },
          {
            path: ADMIN_ROUTES.QUOTE_EDIT,
            element: (
              <RequireAuthReactFire
                signInCheckProps={{
                  requiredClaims: { [Claim.enum.iDemandAdmin]: true },
                }}
              >
                <>
                  <PageMeta title='iDemand - New Quote' />
                  <QuoteEdit />
                </>
              </RequireAuthReactFire>
            ),
            handle: {
              crumb: (match: CrumbMatch) => [
                {
                  label: 'Quotes',
                  link: createPath({
                    path: ROUTES.QUOTES,
                  }),
                },
                {
                  label: `${match?.params?.productId || ''}`,
                },
                {
                  label: 'Edit',
                },
                {
                  label: `${match?.params?.quoteId || ''}`,
                },
              ],
            },
          },
          {
            path: ADMIN_ROUTES.LOCATIONS,
            element: (
              <RequireAuthReactFire
                signInCheckProps={{
                  requiredClaims: { [Claim.enum.iDemandAdmin]: true },
                }}
              >
                <>
                  <PageMeta title='iDemand - Locations' />
                  <AdminLocations />
                </>
              </RequireAuthReactFire>
            ),
          },
          {
            path: ADMIN_ROUTES.POLICY_DELIVERY,
            element: (
              <RequireAuthReactFire
                signInCheckProps={{
                  requiredClaims: { [Claim.enum.iDemandAdmin]: true },
                }}
              >
                <>
                  <PageMeta title='iDemand - Deliver Policy' />
                  <PolicyDelivery />
                </>
              </RequireAuthReactFire>
            ),
            handle: {
              crumb: (match: CrumbMatch) => [
                {
                  label: 'Policies',
                  link: createPath({
                    path: ROUTES.POLICIES,
                  }),
                },
                {
                  label: `${match?.params?.policyId || ''}`,
                  link: createPath({
                    path: ROUTES.POLICY, // TODO: create admin policy view
                    params: { policyId: `${match?.params?.policyId || ''}` },
                  }),
                },
                {
                  label: 'Delivery',
                },
              ],
            },
          },
          {
            path: ADMIN_ROUTES.AGENCY_APPS,
            element: (
              <RequireAuthReactFire
                signInCheckProps={{
                  requiredClaims: { [Claim.enum.iDemandAdmin]: true },
                }}
              >
                <>
                  <PageMeta title='iDemand - Agency Apps' />
                  <AgencyApps />
                </>
              </RequireAuthReactFire>
            ),
            handle: {
              crumb: (match: CrumbMatch) => [
                {
                  label: 'Agency Apps',
                  link: createPath({
                    path: ADMIN_ROUTES.AGENCY_APPS,
                  }),
                },
              ],
            },
          },
          {
            path: ADMIN_ROUTES.AGENCY_APP,
            element: (
              <RequireAuthReactFire
                signInCheckProps={{
                  requiredClaims: { [Claim.enum.iDemandAdmin]: true },
                }}
              >
                <AgencyApp />
              </RequireAuthReactFire>
            ),
            handle: {
              crumb: (match: CrumbMatch) => [
                {
                  label: 'Agency Apps',
                  link: createPath({
                    path: ADMIN_ROUTES.AGENCY_APPS,
                  }),
                },
                {
                  label: `${match?.params?.submissionId || ''}`,
                },
              ],
            },
          },
          {
            path: ADMIN_ROUTES.CREATE_TENANT,
            element: (
              <RequireAuthReactFire
                signInCheckProps={{
                  requiredClaims: { [Claim.enum.iDemandAdmin]: true },
                }}
              >
                <>
                  <PageMeta title='iDemand - Create Agency' />
                  <CreateTenant />
                </>
              </RequireAuthReactFire>
            ),
            handle: {
              crumb: (match: CrumbMatch) => [
                {
                  label: 'Orgs',
                  link: createPath({
                    path: ADMIN_ROUTES.ORGANIZATIONS,
                  }),
                },
                {
                  label: 'new',
                },
              ],
            },
          },
          {
            path: ADMIN_ROUTES.ORGANIZATIONS,
            element: (
              <RequireAuthReactFire
                signInCheckProps={{
                  requiredClaims: { [Claim.enum.iDemandAdmin]: true },
                }}
              >
                <>
                  <PageMeta title='iDemand - Orgs' />
                  <Organizations />
                </>
              </RequireAuthReactFire>
            ),
            handle: {
              crumb: (match: CrumbMatch) => [
                {
                  label: 'Orgs',
                  link: createPath({
                    path: ADMIN_ROUTES.ORGANIZATIONS,
                  }),
                },
              ],
            },
          },
          {
            path: ADMIN_ROUTES.ORGANIZATION,
            element: (
              <AuthActionsProvider>
                <RequireAuthReactFire
                  signInCheckProps={{
                    requiredClaims: { [Claim.enum.iDemandAdmin]: true },
                  }}
                >
                  <Organization />
                </RequireAuthReactFire>
              </AuthActionsProvider>
            ),
            handle: {
              crumb: (match: CrumbMatch) => [
                {
                  label: 'Orgs',
                  link: createPath({
                    path: ADMIN_ROUTES.ORGANIZATIONS,
                  }),
                },
                {
                  label: `${match?.params?.orgId || ''}`,
                },
              ],
            },
          },
          {
            path: ADMIN_ROUTES.USERS,
            element: (
              <RequireAuthReactFire
                signInCheckProps={{
                  requiredClaims: { [Claim.enum.iDemandAdmin]: true },
                }}
              >
                <>
                  <PageMeta title={'iDemand - Users'} />
                  <Users />
                </>
              </RequireAuthReactFire>
            ),
            handle: {
              crumb: (match: CrumbMatch) => [
                {
                  label: 'Users',
                  link: createPath({
                    path: ADMIN_ROUTES.USERS,
                  }),
                },
              ],
            },
          },
          {
            path: '/admin/map/submissions',
            element: (
              <RequireAuthReactFire
                signInCheckProps={{
                  requiredClaims: { [Claim.enum.iDemandAdmin]: true },
                }}
              >
                <>
                  <PageMeta title='iDemand - Submissions Map' />
                  <TestSubmissionsMapWithFilters />
                </>
              </RequireAuthReactFire>
            ),
            handle: {
              crumb: (match: CrumbMatch) => [
                {
                  label: 'Map',
                },
                {
                  label: 'Submissions',
                  link: createPath({
                    path: ROUTES.SUBMISSIONS,
                  }),
                },
              ],
            },
          },
          {
            path: '/admin/map/policies',
            element: (
              <RequireAuthReactFire
                signInCheckProps={{
                  requiredClaims: { [Claim.enum.iDemandAdmin]: true },
                }}
              >
                <>
                  <PageMeta title='iDemand - Policies Map' />
                  <PoliciesMap constraints={[]} />
                </>
              </RequireAuthReactFire>
            ),
            handle: {
              crumb: (match: CrumbMatch) => [
                {
                  label: 'Map',
                },
                {
                  label: 'Policies',
                  link: createPath({
                    path: ROUTES.POLICIES,
                  }),
                },
              ],
            },
          },
          {
            path: '/admin/map/active-events',
            element: (
              <RequireAuthReactFire
                signInCheckProps={{
                  requiredClaims: { [Claim.enum.iDemandAdmin]: true },
                }}
              >
                <>
                  <PageMeta title='iDemand - Active Events' />
                  <ActiveEventsMap />
                </>
              </RequireAuthReactFire>
            ),
            handle: {
              crumb: (match: CrumbMatch) => [
                {
                  label: 'Map',
                },
                {
                  label: 'Active Events',
                },
              ],
            },
          },
          {
            path: 'search',
            element: (
              <TempWrappedSearch />
              // <Search
              //   appId={import.meta.env.VITE_ALGOLIA_APP_ID as string}
              //   apiKey={import.meta.env.VITE_ALGOLIA_SEARCH_KEY as string}
              //   indexName='local_tasks'
              //   indexTitle='Tasks'
              //   placeholder='Search...'
              // />
            ),
          },
          {
            path: 'config',
            element: (
              // <RequireAuthReactFire signInCheckProps={{ requiredClaims: { [Claim.enum.iDemandAdmin]: true } }}>
              <>
                <PageMeta title='iDemand - Config' />
                <ConfigLayout />
              </>
              // </RequireAuthReactFire>
            ),
            errorElement: <RouterErrorBoundary />,
            handle: {
              crumb: (match: CrumbMatch) => [
                {
                  label: 'Config',
                  link: '/admin/config',
                },
              ],
            },
            children: [
              {
                index: true,
                element: (
                  <RequireAuthReactFire
                    signInCheckProps={{
                      requiredClaims: { [Claim.enum.iDemandAdmin]: true },
                    }}
                  >
                    <SLTaxes />
                  </RequireAuthReactFire>
                ),
                errorElement: <RouterErrorBoundary />,
                handle: {
                  crumb: (match: CrumbMatch) => (
                    <BreadCrumbLink
                      to={createPath({
                        path: ADMIN_ROUTES.SL_TAXES,
                      })}
                    >
                      Taxes
                    </BreadCrumbLink>
                  ),
                },
              },
              {
                // path: ADMIN_ROUTES.SL_TAXES,
                path: 'taxes',
                element: (
                  <RequireAuthReactFire
                    signInCheckProps={{
                      requiredClaims: { [Claim.enum.iDemandAdmin]: true },
                    }}
                  >
                    <>
                      <PageMeta title='iDemand - Taxes' />
                      <SLTaxes />
                    </>
                  </RequireAuthReactFire>
                ),
                errorElement: <RouterErrorBoundary />,
                handle: {
                  crumb: (match: CrumbMatch) => (
                    <BreadCrumbLink
                      to={createPath({
                        path: ADMIN_ROUTES.SL_TAXES,
                      })}
                    >
                      Taxes
                    </BreadCrumbLink>
                  ),
                },
              },
              {
                // path: ADMIN_ROUTES.SL_TAXES_NEW,
                path: 'taxes/new',
                element: (
                  <RequireAuthReactFire
                    signInCheckProps={{
                      requiredClaims: { [Claim.enum.iDemandAdmin]: true },
                    }}
                  >
                    <>
                      <PageMeta title='iDemand - New Tax' />
                      <SLTaxNew />
                    </>
                  </RequireAuthReactFire>
                ),
                handle: {
                  crumb: (match: CrumbMatch) => [
                    {
                      label: 'Taxes',
                      link: createPath({
                        path: ADMIN_ROUTES.SL_TAXES_NEW,
                      }),
                    },
                    {
                      label: 'New',
                    },
                  ],
                },
              },
              {
                // path: ADMIN_ROUTES.SL_TAXES_EDIT,
                path: 'taxes/:taxId/edit',
                element: (
                  <RequireAuthReactFire
                    signInCheckProps={{
                      requiredClaims: { [Claim.enum.iDemandAdmin]: true },
                    }}
                  >
                    <>
                      <PageMeta title='iDemand - Edit Tax' />
                      <SLTaxEdit />
                    </>
                  </RequireAuthReactFire>
                ),
                handle: {
                  crumb: (match: CrumbMatch) => [
                    {
                      label: 'Taxes',
                      link: createPath({
                        path: ADMIN_ROUTES.SL_TAXES_NEW,
                      }),
                    },
                    {
                      label: `${match.params.taxId}`,
                    },
                    {
                      label: 'Edit',
                    },
                  ],
                },
              },
              {
                // path: ADMIN_ROUTES.DISCLOSURES,
                path: 'disclosures',
                element: (
                  <RequireAuthReactFire
                    signInCheckProps={{
                      requiredClaims: { [Claim.enum.iDemandAdmin]: true },
                    }}
                  >
                    <>
                      <PageMeta title='iDemand - Disclosures' />
                      <Disclosures />
                    </>
                  </RequireAuthReactFire>
                ),
                handle: {
                  crumb: (match: CrumbMatch) => (
                    <BreadCrumbLink
                      to={createPath({
                        path: ADMIN_ROUTES.DISCLOSURES,
                      })}
                    >
                      Disclosures
                    </BreadCrumbLink>
                  ),
                },
              },
              {
                // path: ADMIN_ROUTES.DISCLOSURE_NEW,
                path: 'disclosures/new',
                element: (
                  <RequireAuthReactFire
                    signInCheckProps={{
                      requiredClaims: { [Claim.enum.iDemandAdmin]: true },
                    }}
                  >
                    <>
                      <PageMeta title='iDemand - New Disclosure' />
                      <DisclosureNew />
                    </>
                  </RequireAuthReactFire>
                ),
                handle: {
                  crumb: (match: CrumbMatch) => [
                    {
                      label: 'Disclosures',
                      link: createPath({
                        path: ADMIN_ROUTES.DISCLOSURES,
                      }),
                    },
                    {
                      label: 'New',
                    },
                  ],
                },
              },
              {
                // path: ADMIN_ROUTES.DISCLOSURE_EDIT,
                path: 'disclosures/:disclosureId/edit',
                element: (
                  <RequireAuthReactFire
                    signInCheckProps={{
                      requiredClaims: { [Claim.enum.iDemandAdmin]: true },
                    }}
                  >
                    <>
                      <PageMeta title='iDemand - Edit Disclosure' />
                      <DisclosureEdit />
                    </>
                  </RequireAuthReactFire>
                ),
                handle: {
                  crumb: (match: CrumbMatch) => [
                    {
                      label: 'Disclosures',
                      link: createPath({
                        path: ADMIN_ROUTES.DISCLOSURES,
                      }),
                    },
                    {
                      label: `${match.params.disclosureId}`,
                    },
                    {
                      label: 'Edit',
                    },
                  ],
                },
              },
              {
                // path: ADMIN_ROUTES.SL_LICENSES,
                path: 'licenses',
                element: (
                  <RequireAuthReactFire
                    signInCheckProps={{
                      requiredClaims: { [Claim.enum.iDemandAdmin]: true },
                    }}
                  >
                    <>
                      <PageMeta title='iDemand - Licenses' />
                      <Licenses />
                    </>
                  </RequireAuthReactFire>
                ),
                handle: {
                  crumb: (match: CrumbMatch) => (
                    <BreadCrumbLink
                      to={createPath({
                        path: ADMIN_ROUTES.SL_LICENSES,
                      })}
                    >
                      Licenses
                    </BreadCrumbLink>
                  ),
                },
              },
              {
                // path: ADMIN_ROUTES.SL_LICENSE_NEW,
                path: 'licenses/new',
                element: (
                  <RequireAuthReactFire
                    signInCheckProps={{
                      requiredClaims: { [Claim.enum.iDemandAdmin]: true },
                    }}
                  >
                    <>
                      <PageMeta title='iDemand - New License' />
                      <LicenseNew />
                    </>
                  </RequireAuthReactFire>
                ),
                handle: {
                  crumb: (match: CrumbMatch) => [
                    {
                      label: 'Licenses',
                      link: createPath({
                        path: ADMIN_ROUTES.SL_LICENSES,
                      }),
                    },
                    {
                      label: 'New',
                    },
                  ],
                },
                // handle: {
                //   crumb: (match: CrumbMatch) => <BreadcrumbText label='new' />,
                // },
              },
              {
                // path: ADMIN_ROUTES.SL_LICENSE_NEW,
                path: 'licenses/:licenseId/edit',
                element: (
                  <RequireAuthReactFire
                    signInCheckProps={{
                      requiredClaims: { [Claim.enum.iDemandAdmin]: true },
                    }}
                  >
                    <>
                      <PageMeta title='iDemand - Edit License' />
                      <LicenseEdit />
                    </>
                  </RequireAuthReactFire>
                ),
                handle: {
                  crumb: (match: CrumbMatch) => [
                    {
                      label: 'Licenses',
                      link: createPath({
                        path: ADMIN_ROUTES.SL_LICENSES,
                      }),
                    },
                    {
                      label: `${match.params.licenseId}`,
                    },
                    {
                      label: 'Edit',
                    },
                  ],
                },
              },
              {
                // path: ADMIN_ROUTES.MORATORIUMS,
                path: 'moratoriums',
                element: (
                  <RequireAuthReactFire
                    signInCheckProps={{
                      requiredClaims: { [Claim.enum.iDemandAdmin]: true },
                    }}
                  >
                    <>
                      <PageMeta title='iDemand - Moratoriums' />
                      <Moratoriums />
                    </>
                  </RequireAuthReactFire>
                ),
                handle: {
                  crumb: (match: CrumbMatch) => (
                    <BreadCrumbLink
                      to={createPath({
                        path: ADMIN_ROUTES.MORATORIUMS,
                      })}
                    >
                      Moratoriums
                    </BreadCrumbLink>
                  ),
                },
              },
              {
                // path: ADMIN_ROUTES.MORATORIUM_NEW,
                path: 'moratoriums/new',
                element: (
                  <RequireAuthReactFire
                    signInCheckProps={{
                      requiredClaims: { [Claim.enum.iDemandAdmin]: true },
                    }}
                  >
                    <>
                      <PageMeta title='iDemand - New Moratorium' />
                      <MoratoriumNew />
                    </>
                  </RequireAuthReactFire>
                ),
                handle: {
                  crumb: (match: CrumbMatch) => [
                    {
                      label: 'Moratoriums',
                      link: createPath({
                        path: ADMIN_ROUTES.MORATORIUMS,
                      }),
                    },
                    {
                      label: 'New',
                    },
                  ],
                },
              },
              {
                path: 'moratoriums/:moratoriumId/edit',
                element: (
                  <RequireAuthReactFire
                    signInCheckProps={{
                      requiredClaims: { [Claim.enum.iDemandAdmin]: true },
                    }}
                  >
                    <>
                      <PageMeta title='iDemand - Edit Moratorium' />
                      <MoratoriumEdit />
                    </>
                  </RequireAuthReactFire>
                ),
                handle: {
                  crumb: (match: CrumbMatch) => {
                    const moratoriumId = match.params.moratoriumId;
                    return [
                      {
                        label: 'Moratoriums',
                        link: createPath({
                          path: ADMIN_ROUTES.MORATORIUMS,
                        }),
                      },
                      {
                        label: `${moratoriumId || ''}`,
                      },
                      {
                        label: 'Edit',
                      },
                    ];
                  },
                },
              },
              {
                path: 'active-states/:productId/edit',
                element: (
                  <RequireAuthReactFire
                    signInCheckProps={{
                      requiredClaims: { [Claim.enum.iDemandAdmin]: true },
                    }}
                  >
                    <>
                      <PageMeta title='iDemand - Active States' />
                      <EditActiveStates />
                    </>
                  </RequireAuthReactFire>
                ),
                handle: {
                  crumb: (match: CrumbMatch) => {
                    const productId = match.params.productId as Product;
                    return [
                      {
                        label: 'Active States',
                      },
                      {
                        label: productId,
                        link: createPath({
                          path: ADMIN_ROUTES.EDIT_ACTIVE_STATES,
                          params: { productId: `${productId}` },
                        }),
                      },
                    ];
                  },
                },
              },
              {
                path: 'imports',
                element: (
                  <RequireAuthReactFire
                    signInCheckProps={{
                      requiredClaims: { [Claim.enum.iDemandAdmin]: true },
                    }}
                  >
                    <>
                      <PageMeta title='iDemand - Imports' />
                      <ImportsSummaryGrid />
                    </>
                  </RequireAuthReactFire>
                ),
                handle: {
                  crumb: (match: CrumbMatch) => [
                    {
                      label: 'Import Summaries',
                      link: createPath({
                        path: ADMIN_ROUTES.DATA_IMPORTS,
                      }),
                    },
                  ],
                },
              },
              {
                path: 'imports/:importId',
                element: (
                  <RequireAuthReactFire
                    signInCheckProps={{
                      requiredClaims: { [Claim.enum.iDemandAdmin]: true },
                    }}
                  >
                    <>
                      <PageMeta title='iDemand - Import' />
                      <ImportReview />
                    </>
                  </RequireAuthReactFire>
                ),
                handle: {
                  crumb: (match: CrumbMatch) => [
                    {
                      label: 'Import Summaries',
                      link: createPath({
                        path: ADMIN_ROUTES.DATA_IMPORTS,
                      }),
                    },
                    {
                      label: `${match.params.importId}`,
                    },
                  ],
                },
              },
              {
                path: 'email-activity',
                element: (
                  <RequireAuthReactFire
                    signInCheckProps={{
                      requiredClaims: { [Claim.enum.iDemandAdmin]: true },
                    }}
                  >
                    <>
                      <PageMeta title='iDemand - Email Activity' />
                      <EmailsGrid />
                    </>
                  </RequireAuthReactFire>
                ),
                handle: {
                  crumb: (match: CrumbMatch) => [
                    {
                      label: 'Email Activity',
                    },
                  ],
                },
              },
              {
                path: 'transactions',
                element: (
                  <RequireAuthReactFire
                    signInCheckProps={{
                      requiredClaims: { [Claim.enum.iDemandAdmin]: true },
                    }}
                  >
                    <>
                      <PageMeta title='iDemand - Transactions' />
                      <Transactions />
                    </>
                  </RequireAuthReactFire>
                ),
                handle: {
                  crumb: (match: CrumbMatch) => [
                    {
                      label: 'Transactions',
                    },
                  ],
                },
              },
              {
                path: 'receivables',
                element: (
                  <RequireAuthReactFire
                    signInCheckProps={{
                      requiredClaims: { [Claim.enum.iDemandAdmin]: true },
                    }}
                  >
                    <>
                      <PageMeta title='iDemand - Receivables' />
                      <Receivables />
                    </>
                  </RequireAuthReactFire>
                ),
                handle: {
                  crumb: (match: CrumbMatch) => [
                    {
                      label: 'Receivables',
                    },
                  ],
                },
              },
              {
                path: 'exposure',
                element: (
                  <RequireAuthReactFire
                    signInCheckProps={{
                      requiredClaims: { [Claim.enum.iDemandAdmin]: true },
                    }}
                  >
                    <>
                      <PageMeta title='iDemand - Exposure' />
                      <Exposure />
                    </>
                  </RequireAuthReactFire>
                ),
                handle: {
                  crumb: (match: CrumbMatch) => [
                    {
                      label: 'Exposure',
                    },
                  ],
                },
              },
            ],
          },
        ],
      },
      // layout issue --> need to move account under
      // {
      //   path: 'account',
      //   element: (
      //     <AuthActionsProvider>
      //       <RequireAuthReactFire>
      //         <>
      //           <PageMeta title='iDemand - Account' />
      //           {/* <Layout /> */}
      //           <AccountDetailsNew />
      //         </>
      //       </RequireAuthReactFire>
      //     </AuthActionsProvider>
      //   ),
      //   errorElement: <RouterErrorBoundary />,
      //   children: [
      //     // {
      //     //   index: true,
      //     //   // element: <AccountDetails />,
      //     //   element: <AccountDetailsNew />,
      //     // },
      //     {
      //       path: 'user',
      //       element: <SettingsLayout navItems={['User Details', 'Security']} />, // TODO: pass in nav routes to layout component
      //       children: [
      //         {
      //           // path: ':setting', // can either handle display in component based on the setting param
      //           // or explicitly specify each setting page in router ??
      //           path: 'details',
      //           element: (() => <div>TODO: user details component</div>)(),
      //         },
      //         // path: 'details/edit' ?? or handle edit state in component ??
      //         {
      //           // path: ':setting', // can either handle display in component based on the setting param
      //           // or explicitly specify each setting page in router ??
      //           path: 'security',
      //           element: (() => <div>TODO: user security component</div>)(),
      //         },
      //       ],
      //     },
      //     {
      //       path: 'org',
      //       element: <SettingsLayout navItems={['Org Details', 'Team', 'Security']} />, // TODO: pass in nav routes to layout component
      //       children: [
      //         {
      //           // path: ':setting', // can either handle display in component based on the setting param
      //           // or explicitly specify each setting page in router ??
      //           path: 'details',
      //           element: (() => <div>TODO: org details component</div>)(),
      //         },
      //         {
      //           // path: ':setting', // can either handle display in component based on the setting param
      //           // or explicitly specify each setting page in router ??
      //           path: 'team',
      //           element: (() => <div>TODO: team component</div>)(),
      //         },
      //         {
      //           // path: ':setting', // can either handle display in component based on the setting param
      //           // or explicitly specify each setting page in router ??
      //           path: 'security',
      //           element: (() => <div>TODO: org security component</div>)(),
      //         },
      //       ],
      //     },
      //   ],
      // },
    ],
  },
]);
