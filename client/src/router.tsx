import {
  createBrowserRouter,
  createSearchParams,
  Params,
  URLSearchParamsInit,
} from 'react-router-dom';
import { wrapCreateBrowserRouter } from '@sentry/react';

import App from './App';
import { ConfigLayout, Layout, RequireAuth, RouterErrorBoundary } from 'components';
import {
  SubmissionNew,
  ContactUs,
  Quotes,
  ViewQuote,
  Login,
  CreateAccount,
  Policy,
  Policies,
  Submissions,
  Home,
  AgencyNew,
  // Protosure, // TODO: move protosureLoader to useEffect
  Account,
  QuoteBind,
  AccountDetails,
  PolicyOld,
} from 'views';
import {
  SubmissionView,
  QuoteNew,
  QuoteNewFromSub,
  SLTaxes,
  SLTaxNew,
  EditActiveStates,
  Moratoriums,
  MoratoriumNew,
  LicenseNew,
  Licenses,
  AgencyApp,
  AgencyApps,
  PolicyDelivery,
  DisclosureNew,
  DisclosureEdit,
  Home as AdminHome,
  CreateTenant,
  Organizations,
  Organization,
  Users,
  SLTaxEdit,
  LicenseEdit,
  QuoteEdit,
  PortfolioRating,
  // PortfolioRating,
} from 'views/admin';
// import { Submissions as AgentSubmissions } from 'views/agent';
import { SuccessStep, ActionHandler, EmailsGrid } from 'elements';
import { RouterLink as BreadCrumbLink } from 'components/Breadcrumbs';
import { Product } from 'common';
import { BindSuccess } from 'elements/SuccessStep';
import { RequireAuthReactFire } from 'components/RequireAuthReactFire'; // getRequiredClaimValidator
import { Disclosures } from 'views/admin/Disclosures';
import { PoliciesMap } from 'elements/PoliciesMap';
import { AuthActionsProvider } from 'modules/components';
import { TempWrappedSearch } from 'components/search/Search';
import { AgencyAppSuccessStep } from 'views/AgencyNew';
import { ImportsSummaryGrid } from 'elements/ImportsSummaryGrid';

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
  SUBMISSION_NEW = '/new/:productId',
  SUBMISSION_SUBMITTED = '/quotes/:submissionId/submitted',
  SUBMISSIONS = '/submissions',
  QUOTES = '/quotes',
  QUOTE_VIEW = '/quotes/:quoteId',
  QUOTE_BIND = '/quotes/:quoteId/bind',
  QUOTE_BIND_SUCCESS = '/quotes/:quoteId/bind/success/:transactionId?',
  CONTACT = '/contact',
  USER_QUOTES = '/quotes/list/:userId',
  POLICIES = '/policies', // '/policies/:productId?'
  POLICY = '/policies/:policyId',
  AGENCY_NEW = '/agency/new',
  AGENCY_NEW_SUBMITTED = '/agency/new/:submissionId/success',
  PROTOSURE = '/protosure/new/:productId/:quoteId?',
  ACCOUNT = '/account',
}

export enum ADMIN_ROUTES {
  SUBMISSIONS = '/admin/submissions',
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
  SL_TAXES = '/admin/config/sl-tax',
  SL_TAXES_NEW = '/admin/config/sl-tax/new',
  SL_TAXES_EDIT = '/admin/config/sl-tax/:taxId/edit',
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
  EMAIL_ACTIVITY = '/admin/config/email-activity',
}

export enum AUTH_ROUTES {
  LOGIN = '/auth/login/',
  CREATE_ACCOUNT = '/auth/create-account',
  ACTIONS_HANDLER = '/auth/actions-handler',
  TENANT_LOGIN = '/auth/login/:tenantId', // ?
  TENANT_CREATE_ACCOUNT = '/auth/create-account/:tenantId', // ?
  TENANT_ACTIONS_HANDLER = '/auth/actions-handler/:tenantId', // ?
}

export enum ACCOUNT_ROUTES {
  ACCOUNT = '/account',
}

type TArgs =
  | { path: ROUTES.HOME }
  | { path: ROUTES.SUBMISSION_NEW; params: { productId: Product } }
  | { path: ROUTES.SUBMISSION_SUBMITTED; params: { submissionId: string } }
  | { path: ROUTES.SUBMISSIONS }
  | { path: ROUTES.QUOTES }
  | { path: ROUTES.QUOTE_VIEW; params: { quoteId: string } }
  | { path: ROUTES.QUOTE_BIND; params: { quoteId: string } } // INCLUDE PRODUCT ID ??
  | { path: ROUTES.QUOTE_BIND_SUCCESS; params: { quoteId: string; transactionId?: string } }
  | { path: ROUTES.POLICIES; search?: { productId?: Product } }
  | { path: ROUTES.POLICY; params: { policyId: string }; search?: { l_view: string } }
  | { path: ROUTES.AGENCY_NEW }
  | { path: ROUTES.AGENCY_NEW_SUBMITTED; params: { submissionId: string } }
  | { path: ROUTES.CONTACT }
  | { path: ROUTES.PROTOSURE; params: { productId: Product; quoteId?: string } }
  // | { path: ROUTES.ACCOUNT }
  | { path: ADMIN_ROUTES.SUBMISSIONS }
  | { path: ADMIN_ROUTES.SUBMISSION_VIEW; params: { submissionId: string } }
  | { path: ADMIN_ROUTES.QUOTES }
  | { path: ADMIN_ROUTES.QUOTE_NEW_BLANK; params: { productId: Product } }
  | { path: ADMIN_ROUTES.QUOTE_NEW; params: { productId: Product; submissionId: string } }
  | { path: ADMIN_ROUTES.QUOTE_EDIT; params: { productId: Product; quoteId: string } }
  | { path: ADMIN_ROUTES.POLICY_DELIVERY; params: { policyId: string } }
  // | { path: ADMIN_ROUTES.POLICIES; search?: { productId?: Product } }
  | { path: ADMIN_ROUTES.CONFIG }
  | { path: ADMIN_ROUTES.SL_TAXES }
  | { path: ADMIN_ROUTES.SL_TAXES_NEW }
  | { path: ADMIN_ROUTES.SL_TAXES_EDIT; params: { taxId: string } }
  | { path: ADMIN_ROUTES.EDIT_ACTIVE_STATES; params: { productId: Product } }
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
  | { path: ADMIN_ROUTES.EMAIL_ACTIVITY }
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

// export const router = createBrowserRouter([
export const router = sentryCreateBrowserRouter([
  {
    path: '/',
    element: <App />,
    errorElement: <RouterErrorBoundary />,
    children: [
      {
        path: '/',
        element: <Layout containerProps={{ maxWidth: 'lg' }} />,
        errorElement: <RouterErrorBoundary />,
        children: [
          {
            index: true,
            element: <Home />,
            // handle: {
            //   crumb: (match: CrumbMatch) => [
            //     {
            //       label: 'Home',
            //       link: '/',
            //     },
            //   ],
            // },
          },
          {
            path: ROUTES.SUBMISSION_NEW,
            element: (
              <RequireAuth shouldSignInAnonymously={true}>
                <SubmissionNew />
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
          // {
          //   path: ROUTES.PROTOSURE,
          //   loader: protosureLoader,
          //   element: (
          //     <RequireAuth shouldSignInAnonymously={true}>
          //       <Protosure />
          //     </RequireAuth>
          //   ),
          //   errorElement: (
          //     <RouterErrorBoundary
          //       actionButtons={[
          //         {
          //           path: createPath({
          //             path: ROUTES.PROTOSURE,
          //             params: { productId: 'flood', quoteId: '' },
          //           }),
          //           label: 'Start new quote',
          //         },
          //       ]}
          //     />
          //   ),
          // },
          {
            path: ROUTES.SUBMISSIONS,
            element: <Submissions />,
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
            element: <Quotes />,
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
            element: <BindSuccess />,
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
            element: <SuccessStep />,
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
            element: <AgencyNew />,
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
            element: <AgencyAppSuccessStep />,
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
            element: <ContactUs />,
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
                {/* <Suspense fallback={<div>Loading user...</div>}> */}
                <Account />
                {/* </Suspense> */}
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
            <Layout containerProps={{ maxWidth: 'lg' }} />
          </AuthActionsProvider>
        ),
        errorElement: <RouterErrorBoundary />,
        children: [
          {
            index: true,
            element: <Login />,
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
                element: <CreateAccount />,
              },
              {
                path: ':tenantId',
                element: <CreateAccount />,
              },
            ],
          },
          {
            path: AUTH_ROUTES.ACTIONS_HANDLER,
            children: [
              {
                path: '',
                element: <ActionHandler />,
              },
              {
                path: ':tenantId',
                element: <ActionHandler />,
              },
            ],
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
              containerProps={{ maxWidth: false, sx: { px: '0 !important' } }}
            />
          </RequireAuth>
        ),
        errorElement: <RouterErrorBoundary />,
        children: [
          {
            index: true,
            element: <Policies />,
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
                    path: ROUTES.QUOTES,
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
            path: 'old/:policyId',
            element: <PolicyOld />,
            errorElement: <RouterErrorBoundary />,
          },
        ],
      },
      {
        path: 'admin',
        element: (
          // <RequireAuthReactFire signInCheckProps={{ requiredClaims: { iDemandAdmin: true } }}>
          <Layout withBreadcrumbs={true} />
          // </RequireAuthReactFire>
        ),
        errorElement: <RouterErrorBoundary />,
        children: [
          {
            index: true,
            element: (
              <RequireAuthReactFire signInCheckProps={{ requiredClaims: { iDemandAdmin: true } }}>
                <AdminHome />
              </RequireAuthReactFire>
            ),
            // element: (() => <div>TODO: Admin Index Page</div>)(),
          },
          {
            path: ADMIN_ROUTES.SUBMISSIONS,
            element: (
              <RequireAuthReactFire signInCheckProps={{ requiredClaims: { iDemandAdmin: true } }}>
                <Submissions />
              </RequireAuthReactFire>
            ),
            errorElement: <RouterErrorBoundary />,
            handle: {
              crumb: (match: CrumbMatch) => [
                {
                  label: 'Submissions',
                  link: createPath({
                    path: ADMIN_ROUTES.SUBMISSIONS,
                  }),
                },
              ],
            },
          },
          {
            path: ADMIN_ROUTES.SUBMISSION_VIEW,
            element: (
              <RequireAuthReactFire signInCheckProps={{ requiredClaims: { iDemandAdmin: true } }}>
                <SubmissionView />
              </RequireAuthReactFire>
            ),
            errorElement: <RouterErrorBoundary />,
            handle: {
              crumb: (match: CrumbMatch) => [
                {
                  label: 'Submissions',
                  link: createPath({
                    path: ADMIN_ROUTES.SUBMISSIONS,
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
              <RequireAuthReactFire signInCheckProps={{ requiredClaims: { iDemandAdmin: true } }}>
                <QuoteNew />
              </RequireAuthReactFire>
            ),
            handle: {
              crumb: (match: CrumbMatch) => [
                {
                  label: 'Quote',
                  link: createPath({
                    path: ADMIN_ROUTES.QUOTES,
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
              <RequireAuthReactFire signInCheckProps={{ requiredClaims: { iDemandAdmin: true } }}>
                <QuoteNewFromSub />
              </RequireAuthReactFire>
            ),
            handle: {
              crumb: (match: CrumbMatch) => [
                {
                  label: 'Quotes',
                  link: createPath({
                    path: ADMIN_ROUTES.QUOTES,
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
              <RequireAuthReactFire signInCheckProps={{ requiredClaims: { iDemandAdmin: true } }}>
                <QuoteEdit />
              </RequireAuthReactFire>
            ),
            handle: {
              crumb: (match: CrumbMatch) => [
                {
                  label: 'Quotes',
                  link: createPath({
                    path: ADMIN_ROUTES.QUOTES,
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
                  // link: createPath({
                  //   path: ADMIN_ROUTES.QUOTE,
                  //   params: { submissionId: `${match?.params?.quoteId}` },
                  // }),
                },
              ],
            },
          },
          {
            path: ADMIN_ROUTES.QUOTES,
            element: (
              <RequireAuthReactFire signInCheckProps={{ requiredClaims: { iDemandAdmin: true } }}>
                {/* <AdminQuotes /> */}
                <Quotes />
              </RequireAuthReactFire>
            ),
            handle: {
              crumb: (match: CrumbMatch) => [
                {
                  label: 'Quotes',
                  link: createPath({
                    path: ADMIN_ROUTES.QUOTES,
                  }),
                },
              ],
            },
          },
          {
            path: ADMIN_ROUTES.POLICY_DELIVERY,
            element: (
              <RequireAuthReactFire signInCheckProps={{ requiredClaims: { iDemandAdmin: true } }}>
                <PolicyDelivery />
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
          // {
          //   path: ADMIN_ROUTES.POLICIES,
          //   element: (
          //     <RequireAuthReactFire signInCheckProps={{ requiredClaims: { iDemandAdmin: true } }}>
          //       <PoliciesAdmin />
          //     </RequireAuthReactFire>
          //   ),
          // },
          // {
          //   path: ADMIN_ROUTES.SL_TAXES,
          //   element: (
          //     // <RequireAuth requiredClaims={['IDEMAND_ADMIN']}>
          //     <RequireAuthReactFire signInCheckProps={{ requiredClaims: { iDemandAdmin: true } }}>
          //       <SLTaxes />
          //     </RequireAuthReactFire>

          //     // </RequireAuth>
          //   ),
          //   // loader: adminTaxLoader,
          //   errorElement: <RouterErrorBoundary />,
          // },
          // {
          //   path: ADMIN_ROUTES.SL_TAXES_NEW,
          //   element: (
          //     // <RequireAuth requiredClaims={['IDEMAND_ADMIN']}>
          //     <RequireAuthReactFire signInCheckProps={{ requiredClaims: { iDemandAdmin: true } }}>
          //       <SLTaxNew />
          //     </RequireAuthReactFire>

          //     // </RequireAuth>
          //   ),
          // },
          // {
          //   path: ADMIN_ROUTES.SL_TAXES_EDIT,
          //   element: (
          //     <RequireAuthReactFire signInCheckProps={{ requiredClaims: { iDemandAdmin: true } }}>
          //       <SLTaxEdit />
          //     </RequireAuthReactFire>
          //   ),
          // },
          // {
          //   path: ADMIN_ROUTES.EDIT_ACTIVE_STATES,
          //   element: (
          //     <RequireAuthReactFire signInCheckProps={{ requiredClaims: { iDemandAdmin: true } }}>
          //       <EditActiveStates />
          //     </RequireAuthReactFire>
          //   ),
          // },
          // {
          //   path: ADMIN_ROUTES.MORATORIUMS,
          //   element: (
          //     // <RequireAuth requiredClaims={['IDEMAND_ADMIN']}>
          //     <RequireAuthReactFire signInCheckProps={{ requiredClaims: { iDemandAdmin: true } }}>
          //       <Moratoriums />
          //     </RequireAuthReactFire>

          //     // </RequireAuth>
          //   ),
          //   // loader: moratoriumsLoader,
          // },
          // {
          //   path: ADMIN_ROUTES.MORATORIUM_NEW,
          //   element: (
          //     // <RequireAuth requiredClaims={['IDEMAND_ADMIN']}>
          //     <RequireAuthReactFire signInCheckProps={{ requiredClaims: { iDemandAdmin: true } }}>
          //       <MoratoriumNew />
          //     </RequireAuthReactFire>

          //     // </RequireAuth>
          //   ),
          // },
          // {
          //   path: ADMIN_ROUTES.SL_LICENSES,
          //   // loader: licensesLoader,
          //   element: (
          //     <RequireAuthReactFire
          //       signInCheckProps={{
          //         validateCustomClaims: getRequiredClaimValidator(['IDEMAND_ADMIN']),
          //       }}
          //     >
          //       <Licenses />
          //     </RequireAuthReactFire>
          //   ),
          // },
          // {
          //   path: ADMIN_ROUTES.SL_LICENSE_NEW,
          //   element: (
          //     // <RequireAuth requiredClaims={['IDEMAND_ADMIN']}>
          //     <RequireAuthReactFire signInCheckProps={{ requiredClaims: { iDemandAdmin: true } }}>
          //       <LicenseNew />
          //     </RequireAuthReactFire>

          //     // </RequireAuth>
          //   ),
          // },
          {
            path: ADMIN_ROUTES.AGENCY_APPS,
            // loader: agencyAppsLoader,
            element: (
              <RequireAuthReactFire signInCheckProps={{ requiredClaims: { iDemandAdmin: true } }}>
                <AgencyApps />
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
              <RequireAuthReactFire signInCheckProps={{ requiredClaims: { iDemandAdmin: true } }}>
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
          // {
          //   path: ADMIN_ROUTES.DISCLOSURES,
          //   element: (
          //     <RequireAuthReactFire signInCheckProps={{ requiredClaims: { iDemandAdmin: true } }}>
          //       <Disclosures />
          //     </RequireAuthReactFire>
          //   ),
          // },
          // {
          //   path: ADMIN_ROUTES.DISCLOSURE_NEW,
          //   element: (
          //     <RequireAuthReactFire signInCheckProps={{ requiredClaims: { iDemandAdmin: true } }}>
          //       <DisclosureNew />
          //     </RequireAuthReactFire>
          //   ),
          // },
          // {
          //   path: ADMIN_ROUTES.DISCLOSURE_EDIT,
          //   element: (
          //     <RequireAuthReactFire signInCheckProps={{ requiredClaims: { iDemandAdmin: true } }}>
          //       <DisclosureEdit />
          //     </RequireAuthReactFire>
          //   ),
          // },
          {
            path: ADMIN_ROUTES.CREATE_TENANT,
            element: (
              <RequireAuthReactFire signInCheckProps={{ requiredClaims: { iDemandAdmin: true } }}>
                <CreateTenant />
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
              <RequireAuthReactFire signInCheckProps={{ requiredClaims: { iDemandAdmin: true } }}>
                <Organizations />
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
              <RequireAuthReactFire signInCheckProps={{ requiredClaims: { iDemandAdmin: true } }}>
                <Organization />
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
                  label: `${match?.params?.orgId || ''}`,
                },
              ],
            },
          },
          {
            path: ADMIN_ROUTES.USERS,
            element: (
              <RequireAuthReactFire signInCheckProps={{ requiredClaims: { iDemandAdmin: true } }}>
                <Users />
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
          // TODO: finish component & uncomment
          {
            path: ADMIN_ROUTES.PORTFOLIO_RATING,
            element: (
              <RequireAuthReactFire signInCheckProps={{ requiredClaims: { iDemandAdmin: true } }}>
                <PortfolioRating />
              </RequireAuthReactFire>
            ),
          },
          {
            path: '/admin/map/submissions',
            element: (
              <RequireAuthReactFire signInCheckProps={{ requiredClaims: { iDemandAdmin: true } }}>
                <PoliciesMap />
              </RequireAuthReactFire>
            ),
            handle: {
              crumb: (match: CrumbMatch) => [
                {
                  label: 'Submissions',
                  link: createPath({
                    path: ADMIN_ROUTES.SUBMISSIONS,
                  }),
                },
                {
                  label: 'Map',
                },
              ],
            },
          },
          {
            path: 'search',
            element: (
              <TempWrappedSearch />
              // <Search
              //   appId={process.env.REACT_APP_ALGOLIA_APP_ID as string}
              //   apiKey={process.env.REACT_APP_ALGOLIA_SEARCH_KEY as string}
              //   indexName='local_tasks'
              //   indexTitle='Tasks'
              //   placeholder='Search...'
              // />
            ),
          },
          // TODO: set up config routs
          {
            path: 'config',
            element: (
              // <RequireAuthReactFire signInCheckProps={{ requiredClaims: { iDemandAdmin: true } }}>
              <ConfigLayout />
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
                    signInCheckProps={{ requiredClaims: { iDemandAdmin: true } }}
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
                path: 'sl-tax',
                element: (
                  <RequireAuthReactFire
                    signInCheckProps={{ requiredClaims: { iDemandAdmin: true } }}
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
                // path: ADMIN_ROUTES.SL_TAXES_NEW,
                path: 'sl-tax/new',
                element: (
                  <RequireAuthReactFire
                    signInCheckProps={{ requiredClaims: { iDemandAdmin: true } }}
                  >
                    <SLTaxNew />
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
                // handle: {
                //   crumb: (match: CrumbMatch) => (
                //     <BreadCrumbLink
                //       to={createPath({
                //         path: ADMIN_ROUTES.SL_TAXES_NEW,
                //       })}
                //     >
                //       New
                //     </BreadCrumbLink>
                //   ),
                // },
              },
              {
                // path: ADMIN_ROUTES.SL_TAXES_EDIT,
                path: 'sl-tax/:taxId/edit',
                element: (
                  <RequireAuthReactFire
                    signInCheckProps={{ requiredClaims: { iDemandAdmin: true } }}
                  >
                    <SLTaxEdit />
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
                    signInCheckProps={{ requiredClaims: { iDemandAdmin: true } }}
                  >
                    <Disclosures />
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
                    signInCheckProps={{ requiredClaims: { iDemandAdmin: true } }}
                  >
                    <DisclosureNew />
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
                    signInCheckProps={{ requiredClaims: { iDemandAdmin: true } }}
                  >
                    <DisclosureEdit />
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
                    signInCheckProps={{ requiredClaims: { iDemandAdmin: true } }}
                    // signInCheckProps={{
                    //   validateCustomClaims: getRequiredClaimValidator(['IDEMAND_ADMIN']),
                    // }}
                  >
                    <Licenses />
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
                    signInCheckProps={{ requiredClaims: { iDemandAdmin: true } }}
                  >
                    <LicenseNew />
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
                    signInCheckProps={{ requiredClaims: { iDemandAdmin: true } }}
                  >
                    <LicenseEdit />
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
                    signInCheckProps={{ requiredClaims: { iDemandAdmin: true } }}
                  >
                    <Moratoriums />
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
                    signInCheckProps={{ requiredClaims: { iDemandAdmin: true } }}
                  >
                    <MoratoriumNew />
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
                // path: ADMIN_ROUTES.EDIT_ACTIVE_STATES,
                path: 'active-states/:productId/edit',
                element: (
                  <RequireAuthReactFire
                    signInCheckProps={{ requiredClaims: { iDemandAdmin: true } }}
                  >
                    <EditActiveStates />
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
                // path: ADMIN_ROUTES.SL_LICENSES,
                path: 'imports',
                element: (
                  <RequireAuthReactFire
                    signInCheckProps={{ requiredClaims: { iDemandAdmin: true } }}
                  >
                    <ImportsSummaryGrid />
                  </RequireAuthReactFire>
                ),
                handle: {
                  crumb: (match: CrumbMatch) => [
                    {
                      label: 'Import Summaries',
                    },
                  ],
                },
              },
              {
                // path: ADMIN_ROUTES.SL_LICENSES,
                path: 'email-activity',
                element: (
                  <RequireAuthReactFire
                    signInCheckProps={{ requiredClaims: { iDemandAdmin: true } }}
                  >
                    <EmailsGrid />
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
            ],
          },
        ],
      },
      {
        path: 'account',
        element: (
          <AuthActionsProvider>
            <Layout />
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
      // {
      //   path: '*',
      //   element: <Layout containerProps={{ maxWidth: 'lg' }} />,
      //   children: [
      //     {
      //       index: true,
      //       element: (() => (
      //         <div
      //           style={{
      //             display: 'flex',
      //             justifyContent: 'center',
      //             alignItems: 'center',
      //             minHeight: 400,
      //           }}
      //         >
      //           test
      //         </div>
      //       ))(), // <NotFound />,
      //     },
      //   ],
      // },
    ],
  },
]);
