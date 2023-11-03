import { wrapCreateBrowserRouter } from '@sentry/react';
import { Helmet } from 'react-helmet-async';
import {
  createBrowserRouter,
  createSearchParams,
  Params,
  URLSearchParamsInit,
} from 'react-router-dom';

import { CLAIMS, TProduct } from 'common';
import { RequireAuth, RouterErrorBoundary } from 'components';
import { ConfigLayout, Layout } from 'components/layout';
import { RouterLink as BreadCrumbLink } from 'components/layout/Breadcrumbs';
import { RequireAuthReactFire } from 'components/RequireAuthReactFire';
import { TempWrappedSearch } from 'components/search/Search';
import { AuthActionsProvider } from 'context';
import { ActionHandler } from 'elements';
import { SuccessStep } from 'elements/forms';
import { LocationChangeWrapper } from 'elements/forms/LocationChangeForm';
import { BindSuccess } from 'elements/forms/SuccessStep';
import { EmailsGrid, ImportsSummaryGrid } from 'elements/grids';
import { ActiveEventsMap, PoliciesMap } from 'elements/maps';
import { TestSubmissionsMapWithFilters } from 'elements/maps/SubmissionsMap';
import {
  Account,
  AccountDetails,
  AddLocation,
  AgencyNew,
  ContactUs,
  CreateAccount,
  Home,
  Login,
  Policies,
  Policy,
  QuoteBind,
  Quotes,
  SubmissionNew,
  SubmissionNewPortfolio,
  Submissions,
  ViewQuote,
} from 'views';
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
  MoratoriumNew,
  Moratoriums,
  Organization,
  Organizations,
  PolicyDelivery,
  QuoteEdit,
  QuoteNew,
  QuoteNewFromSub,
  SLTaxEdit,
  SLTaxes,
  SLTaxNew,
  SubmissionView,
  Transactions,
  Users,
} from 'views/admin';
import { Disclosures } from 'views/admin/Disclosures';
import { AgencyAppSuccessStep } from 'views/AgencyNew';
import { ClaimNew } from 'views/ClaimNew';
import { EmailVerified } from 'views/EmailVerified';
import App from './App';

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
  SUBMISSIONS_NEW_PORTFOLIO = '/submissions/new/:productId/portfolio',
  QUOTES = '/quotes',
  QUOTE_VIEW = '/quotes/:quoteId',
  QUOTE_BIND = '/quotes/:quoteId/bind',
  QUOTE_BIND_SUCCESS = '/quotes/:quoteId/bind/success/:transactionId?',
  CONTACT = '/contact',
  USER_QUOTES = '/quotes/list/:userId',
  POLICIES = '/policies',
  POLICY = '/policies/:policyId',
  ADD_LOCATION_NEW = '/policies/:policyId/locations/new',
  // CLAIM_NEW = '/policies/:policyId/claim/new',
  CLAIM_NEW = '/policies/:policyId/:locationId/claims/new',
  AGENCY_NEW = '/agency/new',
  AGENCY_NEW_SUBMITTED = '/agency/new/:submissionId/success',
  ACCOUNT = '/account',
}

export enum ADMIN_ROUTES {
  // SUBMISSIONS = '/admin/submissions',
  SUBMISSION_VIEW = '/admin/submissions/:submissionId',
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
  ACCOUNT = '/account',
}

type TArgs =
  | { path: ROUTES.HOME }
  | { path: ROUTES.SUBMISSION_NEW; params: { productId: TProduct } }
  | { path: ROUTES.SUBMISSION_SUBMITTED; params: { submissionId: string } }
  | { path: ROUTES.SUBMISSIONS_NEW_PORTFOLIO }
  | { path: ROUTES.SUBMISSIONS }
  | { path: ROUTES.QUOTES }
  | { path: ROUTES.QUOTE_VIEW; params: { quoteId: string } }
  | { path: ROUTES.QUOTE_BIND; params: { quoteId: string } } // INCLUDE PRODUCT ID ??
  | { path: ROUTES.QUOTE_BIND_SUCCESS; params: { quoteId: string; transactionId?: string } }
  | { path: ROUTES.POLICIES; search?: { productId?: TProduct } }
  | { path: ROUTES.POLICY; params: { policyId: string }; search?: { l_view: string } }
  | { path: ROUTES.ADD_LOCATION_NEW; params: { policyId: string } }
  | { path: ROUTES.CLAIM_NEW; params: { policyId: string; locationId: string } }
  | { path: ROUTES.AGENCY_NEW }
  | { path: ROUTES.AGENCY_NEW_SUBMITTED; params: { submissionId: string } }
  | { path: ROUTES.CONTACT }
  // | { path: ROUTES.ACCOUNT }
  // | { path: ADMIN_ROUTES.SUBMISSIONS }
  | { path: ADMIN_ROUTES.SUBMISSION_VIEW; params: { submissionId: string } }
  // | { path: ADMIN_ROUTES.QUOTES }
  | { path: ADMIN_ROUTES.QUOTE_NEW_BLANK; params: { productId: TProduct } }
  | { path: ADMIN_ROUTES.QUOTE_NEW; params: { productId: TProduct; submissionId: string } }
  | { path: ADMIN_ROUTES.QUOTE_EDIT; params: { productId: TProduct; quoteId: string } }
  | { path: ADMIN_ROUTES.POLICY_DELIVERY; params: { policyId: string } }
  // | { path: ADMIN_ROUTES.POLICIES; search?: { productId?: TProduct } }
  | { path: ADMIN_ROUTES.CONFIG }
  | { path: ADMIN_ROUTES.SL_TAXES }
  | { path: ADMIN_ROUTES.SL_TAXES_NEW }
  | { path: ADMIN_ROUTES.SL_TAXES_EDIT; params: { taxId: string } }
  | { path: ADMIN_ROUTES.EDIT_ACTIVE_STATES; params: { productId: TProduct } }
  | { path: ADMIN_ROUTES.MORATORIUMS }
  | { path: ADMIN_ROUTES.MORATORIUM_NEW }
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
  | { path: ADMIN_ROUTES.ORGANIZATION; params: { orgId: string }; search?: { tab: string } }
  | { path: ADMIN_ROUTES.USERS }
  | { path: ADMIN_ROUTES.PORTFOLIO_RATING }
  | { path: ADMIN_ROUTES.DATA_IMPORTS }
  | { path: ADMIN_ROUTES.IMPORT_REVIEW; params: { importId: string } }
  | { path: ADMIN_ROUTES.EMAIL_ACTIVITY }
  | { path: ADMIN_ROUTES.TRANSACTIONS }
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
  | { path: ACCOUNT_ROUTES.ACCOUNT };

type TArgsWithParams = Extract<TArgs, { path: any; params: any }>;

type TArgsWithSearch = Extract<TArgs, { path: any; search: URLSearchParamsInit }>;

export function createPath(args: TArgs) {
  if (args.hasOwnProperty('params') === false && args.hasOwnProperty('search') === false)
    return args.path;

  let resolvedPath: string = args.path;

  // Create a path by replacing params in the route definition
  if (args.hasOwnProperty('params') !== false) {
    resolvedPath = Object.entries((args as TArgsWithParams).params).reduce(
      (previousValue: string, [param, value]) => previousValue.replace(`:${param}`, '' + value),
      args.path
    );
  }
  if (args.hasOwnProperty('search') !== false) {
    const { search } = args as TArgsWithSearch;
    resolvedPath += `?${createSearchParams(search)}`;
  }

  return resolvedPath;
}

const sentryCreateBrowserRouter = wrapCreateBrowserRouter(createBrowserRouter);

export function PageMeta({ title }: { title: string }) {
  return (
    <Helmet>
      <title>{title}</title>
      <meta name='title' content={title} data-react-helmet='true'></meta>
      {/* <link rel='canonical' href='https://idemand-submissions.web.app/' /> */}
    </Helmet>
  );
}

// export const router = createBrowserRouter([
export const router = sentryCreateBrowserRouter([
  {
    path: '/',
    element: <App />,
    errorElement: <RouterErrorBoundary />,
    children: [
      {
        path: '/',
        element: <Layout containerProps={{ maxWidth: 'xl', sx: { flex: '1 0 auto' } }} />,
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
            path: ROUTES.QUOTE_BIND_SUCCESS,
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
                  // link: createPath({
                  //   path: ROUTES.ORGANIZATIONS,
                  // }),
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
            path: ROUTES.ACCOUNT,
            element: (
              <RequireAuthReactFire signInCheckProps={{ suspense: false }}>
                <>
                  <PageMeta title='iDemand - Account' />
                  <Account />
                </>
              </RequireAuthReactFire>
            ),
            handle: {
              crumb: (match: CrumbMatch) => [
                {
                  label: 'Account',
                  link: createPath({
                    path: ACCOUNT_ROUTES.ACCOUNT, // ROUTES.ACCOUNT,
                  }),
                },
              ],
            },
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
        path: '/policies',
        element: (
          <RequireAuth>
            <Layout
              noPadding={true}
              bodyWrapperSX={{ px: 0 }}
              containerProps={{ maxWidth: false, sx: { px: '0 !important', flex: '1 0 auto' } }}
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
          // <RequireAuthReactFire signInCheckProps={{ requiredClaims: { [CLAIMS.IDEMAND_ADMIN]: true } }}>
          <>
            <PageMeta title='iDemand - Admin' />
            <Layout withBreadcrumbs={true} containerProps={{ maxWidth: 'xl' }} />
          </>
          // </RequireAuthReactFire>
        ),
        errorElement: <RouterErrorBoundary />,
        children: [
          {
            index: true,
            element: (
              <RequireAuthReactFire
                signInCheckProps={{ requiredClaims: { [CLAIMS.IDEMAND_ADMIN]: true } }}
              >
                <AdminHome />
              </RequireAuthReactFire>
            ),
          },

          {
            path: ADMIN_ROUTES.SUBMISSION_VIEW,
            element: (
              <RequireAuthReactFire
                signInCheckProps={{ requiredClaims: { [CLAIMS.IDEMAND_ADMIN]: true } }}
              >
                <SubmissionView />
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
                {
                  label: `${match?.params?.submissionId || ''}`,
                },
              ],
            },
          },
          {
            path: ADMIN_ROUTES.QUOTE_NEW_BLANK,
            element: (
              <RequireAuthReactFire
                signInCheckProps={{ requiredClaims: { [CLAIMS.IDEMAND_ADMIN]: true } }}
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
                signInCheckProps={{ requiredClaims: { [CLAIMS.IDEMAND_ADMIN]: true } }}
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
                    path: ADMIN_ROUTES.SUBMISSION_VIEW,
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
                signInCheckProps={{ requiredClaims: { [CLAIMS.IDEMAND_ADMIN]: true } }}
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
                signInCheckProps={{ requiredClaims: { [CLAIMS.IDEMAND_ADMIN]: true } }}
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
                signInCheckProps={{ requiredClaims: { [CLAIMS.IDEMAND_ADMIN]: true } }}
              >
                <>
                  <PageMeta title='iDemand - Locations' />
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
                signInCheckProps={{ requiredClaims: { [CLAIMS.IDEMAND_ADMIN]: true } }}
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
                signInCheckProps={{ requiredClaims: { [CLAIMS.IDEMAND_ADMIN]: true } }}
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
                signInCheckProps={{ requiredClaims: { [CLAIMS.IDEMAND_ADMIN]: true } }}
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
                signInCheckProps={{ requiredClaims: { [CLAIMS.IDEMAND_ADMIN]: true } }}
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
                  signInCheckProps={{ requiredClaims: { [CLAIMS.IDEMAND_ADMIN]: true } }}
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
                signInCheckProps={{ requiredClaims: { [CLAIMS.IDEMAND_ADMIN]: true } }}
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
                signInCheckProps={{ requiredClaims: { [CLAIMS.IDEMAND_ADMIN]: true } }}
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
                signInCheckProps={{ requiredClaims: { [CLAIMS.IDEMAND_ADMIN]: true } }}
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
                signInCheckProps={{ requiredClaims: { [CLAIMS.IDEMAND_ADMIN]: true } }}
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
              // <RequireAuthReactFire signInCheckProps={{ requiredClaims: { [CLAIMS.IDEMAND_ADMIN]: true } }}>
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
                    signInCheckProps={{ requiredClaims: { [CLAIMS.IDEMAND_ADMIN]: true } }}
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
                    signInCheckProps={{ requiredClaims: { [CLAIMS.IDEMAND_ADMIN]: true } }}
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
                    signInCheckProps={{ requiredClaims: { [CLAIMS.IDEMAND_ADMIN]: true } }}
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
                    signInCheckProps={{ requiredClaims: { [CLAIMS.IDEMAND_ADMIN]: true } }}
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
                    signInCheckProps={{ requiredClaims: { [CLAIMS.IDEMAND_ADMIN]: true } }}
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
                    signInCheckProps={{ requiredClaims: { [CLAIMS.IDEMAND_ADMIN]: true } }}
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
                    signInCheckProps={{ requiredClaims: { [CLAIMS.IDEMAND_ADMIN]: true } }}
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
                    signInCheckProps={{ requiredClaims: { [CLAIMS.IDEMAND_ADMIN]: true } }}
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
                    signInCheckProps={{ requiredClaims: { [CLAIMS.IDEMAND_ADMIN]: true } }}
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
                    signInCheckProps={{ requiredClaims: { [CLAIMS.IDEMAND_ADMIN]: true } }}
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
                    signInCheckProps={{ requiredClaims: { [CLAIMS.IDEMAND_ADMIN]: true } }}
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
                    signInCheckProps={{ requiredClaims: { [CLAIMS.IDEMAND_ADMIN]: true } }}
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
                path: 'active-states/:productId/edit',
                element: (
                  <RequireAuthReactFire
                    signInCheckProps={{ requiredClaims: { [CLAIMS.IDEMAND_ADMIN]: true } }}
                  >
                    <>
                      <PageMeta title='iDemand - Active States' />
                      <EditActiveStates />
                    </>
                  </RequireAuthReactFire>
                ),
                handle: {
                  crumb: (match: CrumbMatch) => {
                    const productId = match.params.productId as TProduct;
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
                    signInCheckProps={{ requiredClaims: { [CLAIMS.IDEMAND_ADMIN]: true } }}
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
                    signInCheckProps={{ requiredClaims: { [CLAIMS.IDEMAND_ADMIN]: true } }}
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
                    signInCheckProps={{ requiredClaims: { [CLAIMS.IDEMAND_ADMIN]: true } }}
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
                    signInCheckProps={{ requiredClaims: { [CLAIMS.IDEMAND_ADMIN]: true } }}
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
            ],
          },
        ],
      },
      {
        path: 'account',
        element: (
          <AuthActionsProvider>
            <RequireAuthReactFire>
              <>
                <PageMeta title='iDemand - Account' />
                <Layout />
              </>
            </RequireAuthReactFire>
          </AuthActionsProvider>
        ),
        errorElement: <RouterErrorBoundary />,
        children: [
          {
            index: true,
            element: <AccountDetails />,
          },
        ],
      },
    ],
  },
]);
