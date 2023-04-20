import { createBrowserRouter, createSearchParams, URLSearchParamsInit } from 'react-router-dom';

import App from './App';
import { Layout, RequireAuth, RouterErrorBoundary } from 'components';
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
} from 'views';
import {
  SubmissionView,
  Submissions as AdminSubmissions,
  QuoteNew,
  SLTaxes,
  SLTaxNew,
  EditActiveStates,
  Moratoriums,
  MoratoriumNew,
  SLLicenseNew,
  Licenses,
  AgencyApp,
  AgencyApps,
  Quotes as AdminQuotes,
  PolicyDelivery,
  Policies as PoliciesAdmin,
  DisclosureNew,
  DisclosureEdit,
  Home as AdminHome,
  CreateTenant,
  Organizations,
  Organization,
  Users,
} from 'views/admin';
// import { Submissions as AgentSubmissions } from 'views/agent';
import { SuccessStep, ActionHandler } from 'elements';
import { Product } from 'common';
import { BindSuccess } from 'elements/SuccessStep';
import { TasksPagination } from 'views/admin/TasksPagination';
import { RequireAuthReactFire, getRequiredClaimValidator } from 'components/RequireAuthReactFire';
import { Disclosures } from 'views/admin/Disclosures';
import { QuoteNewFromSub } from 'views/admin/QuoteNew';
import { PoliciesMap } from 'elements/PoliciesMap';

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
  USER_POLICIES = '/policies',
  USER_POLICY = '/policies/:policyId',
  AGENCY_NEW = '/agency/new',
  PROTOSURE = '/protosure/new/:productId/:quoteId?',
  ACCOUNT = '/account',
}

export enum ADMIN_ROUTES {
  SUBMISSIONS = '/admin/submissions',
  SUBMISSION_VIEW = '/admin/submissions/:submissionId',
  QUOTES = '/admin/quotes',
  QUOTE_NEW_BLANK = '/admin/quotes/:productId/new', // QuoteNewFromSub
  QUOTE_NEW = '/admin/quotes/:productId/new/:submissionId',
  POLICY_DELIVERY = '/admin/policies/:policyId/delivery',
  POLICIES = '/admin/policies',
  SL_TAXES = '/admin/sl-tax',
  SL_TAXES_NEW = '/admin/sl-tax/new',
  EDIT_ACTIVE_STATES = '/admin/active-states/:productId/edit',
  MORATORIUMS = '/admin/moratoriums',
  MORATORIUM_NEW = '/admin/moratoriums/new',
  SL_LICENSES = '/admin/licenses',
  SL_LICENSE_NEW = '/admin/licenses/new',
  AGENCY_APPS = '/admin/agencies/submissions',
  AGENCY_APP = '/admin/agencies/submissions/:submissionId',
  DISCLOSURES = '/admin/disclosures',
  DISCLOSURE_NEW = '/admin/disclosures/new',
  DISCLOSURE_EDIT = '/admin/disclosures/:disclosureId/edit',
  CREATE_TENANT = '/admin/agencies/new',
  ORGANIZATIONS = '/admin/orgs',
  ORGANIZATION = '/admin/orgs/:orgId',
  USERS = '/admin/users',
}

// export enum AGENT_ROUTES {
//   SUBMISSIONS = '/agent/submissions',
//   SUBMISSION_VIEW = '/agent/submissions/:submissionId',
//   QUOTES = '/agent/quotes',
//   QUOTES_VIEW = '/agent/submissions',
// }

export enum AUTH_ROUTES {
  LOGIN = '/auth/login/',
  CREATE_ACCOUNT = '/auth/create-account',
  ACTIONS_HANDLER = '/auth/actions-handler',
  TENANT_LOGIN = '/auth/login/:tenantId?',
  TENANT_CREATE_ACCOUNT = '/auth/create-account/:tenantId?',
  TENANT_ACTIONS_HANDLER = '/auth/actions-handler/:tenantId?',
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
  | { path: ROUTES.USER_POLICIES }
  | { path: ROUTES.USER_POLICY; params: { policyId: string } }
  | { path: ROUTES.AGENCY_NEW }
  | { path: ROUTES.CONTACT }
  | { path: ROUTES.PROTOSURE; params: { productId: Product; quoteId?: string } }
  // | { path: ROUTES.ACCOUNT }
  | { path: ADMIN_ROUTES.SUBMISSIONS }
  | { path: ADMIN_ROUTES.SUBMISSION_VIEW; params: { submissionId: string } }
  | { path: ADMIN_ROUTES.QUOTES }
  | { path: ADMIN_ROUTES.QUOTE_NEW_BLANK; params: { productId: Product } }
  | { path: ADMIN_ROUTES.QUOTE_NEW; params: { productId: Product; submissionId: string } }
  | { path: ADMIN_ROUTES.POLICY_DELIVERY; params: { policyId: string } }
  | { path: ADMIN_ROUTES.POLICIES; search?: { productId?: Product } }
  | { path: ADMIN_ROUTES.SL_TAXES }
  | { path: ADMIN_ROUTES.SL_TAXES_NEW }
  | { path: ADMIN_ROUTES.EDIT_ACTIVE_STATES; params: { productId: Product } }
  | { path: ADMIN_ROUTES.MORATORIUMS }
  | { path: ADMIN_ROUTES.MORATORIUM_NEW }
  | { path: ADMIN_ROUTES.SL_LICENSES }
  | { path: ADMIN_ROUTES.SL_LICENSE_NEW }
  | { path: ADMIN_ROUTES.AGENCY_APPS }
  | { path: ADMIN_ROUTES.AGENCY_APP; params: { submissionId: string } }
  | { path: ADMIN_ROUTES.DISCLOSURES }
  | { path: ADMIN_ROUTES.DISCLOSURE_NEW }
  | { path: ADMIN_ROUTES.DISCLOSURE_EDIT; params: { disclosureId: string } }
  | { path: ADMIN_ROUTES.CREATE_TENANT }
  | { path: ADMIN_ROUTES.ORGANIZATIONS }
  | { path: ADMIN_ROUTES.ORGANIZATION; params: { orgId: string } }
  | { path: ADMIN_ROUTES.USERS }
  | { path: AUTH_ROUTES.CREATE_ACCOUNT }
  | { path: AUTH_ROUTES.LOGIN }
  | { path: AUTH_ROUTES.TENANT_CREATE_ACCOUNT; params?: { tenantId?: string } }
  | { path: AUTH_ROUTES.TENANT_LOGIN; params?: { tenantId?: string } }
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

export const router = createBrowserRouter([
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
          },
          {
            path: ROUTES.QUOTES,
            element: <Quotes />,
            errorElement: <RouterErrorBoundary />,
          },
          {
            path: ROUTES.QUOTE_VIEW,
            element: <ViewQuote />,
          },
          {
            path: ROUTES.QUOTE_BIND,
            element: <QuoteBind />,
          },
          {
            path: ROUTES.QUOTE_BIND_SUCCESS,
            element: <BindSuccess />,
          },
          {
            path: ROUTES.SUBMISSION_SUBMITTED,
            element: <SuccessStep />,
            errorElement: <RouterErrorBoundary />,
          },
          {
            path: ROUTES.AGENCY_NEW,
            element: <AgencyNew />,
            errorElement: <RouterErrorBoundary />,
          },
          {
            path: ROUTES.CONTACT,
            element: <ContactUs />,
            errorElement: <RouterErrorBoundary />,
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
          {
            path: ROUTES.ACCOUNT,
            element: (
              <RequireAuthReactFire signInCheckProps={{ suspense: false }}>
                {/* <Suspense fallback={<div>Loading user...</div>}> */}
                <Account />
                {/* </Suspense> */}
              </RequireAuthReactFire>
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
              containerProps={{ maxWidth: false, sx: { px: '0 !important' } }}
            />
          </RequireAuth>
        ),
        errorElement: <RouterErrorBoundary />,
        children: [
          {
            index: true,
            element: <Policies />,
            // loader: policiesLoader(auth),
            errorElement: <RouterErrorBoundary />,
          },
          {
            path: ROUTES.USER_POLICY,
            element: <Policy />,
            // loader: policyLoader,
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
                <AdminSubmissions />
              </RequireAuthReactFire>
            ),
            // loader: adminSubmissionsLoader,
            errorElement: <RouterErrorBoundary />,
          },
          {
            path: ADMIN_ROUTES.SUBMISSION_VIEW,
            element: (
              // <RequireAuth requiredClaims={['IDEMAND_ADMIN']}>
              <RequireAuthReactFire signInCheckProps={{ requiredClaims: { iDemandAdmin: true } }}>
                <SubmissionView />
              </RequireAuthReactFire>
              // </RequireAuth>
            ),
            // loader: submissionLoader,
            errorElement: <RouterErrorBoundary />,
          },
          {
            path: ADMIN_ROUTES.QUOTE_NEW_BLANK,
            element: (
              <RequireAuthReactFire signInCheckProps={{ requiredClaims: { iDemandAdmin: true } }}>
                <QuoteNew />
              </RequireAuthReactFire>
            ),
          },
          {
            path: ADMIN_ROUTES.QUOTE_NEW,
            element: (
              <RequireAuthReactFire signInCheckProps={{ requiredClaims: { iDemandAdmin: true } }}>
                <QuoteNewFromSub />
              </RequireAuthReactFire>
            ),
          },
          {
            path: ADMIN_ROUTES.QUOTES,
            element: (
              // <RequireAuth requiredClaims={['IDEMAND_ADMIN']}>
              <RequireAuthReactFire signInCheckProps={{ requiredClaims: { iDemandAdmin: true } }}>
                <AdminQuotes />
              </RequireAuthReactFire>

              // </RequireAuth>
            ),
            // loader: quotesLoader,
          },
          {
            path: ADMIN_ROUTES.POLICY_DELIVERY,
            element: (
              // <RequireAuth requiredClaims={['IDEMAND_ADMIN']}>
              <RequireAuthReactFire signInCheckProps={{ requiredClaims: { iDemandAdmin: true } }}>
                <PolicyDelivery />
              </RequireAuthReactFire>

              // </RequireAuth>
            ),
            // loader: policyLoader,
          },
          {
            path: ADMIN_ROUTES.POLICIES,
            element: (
              // <RequireAuth requiredClaims={['IDEMAND_ADMIN']}>
              <RequireAuthReactFire signInCheckProps={{ requiredClaims: { iDemandAdmin: true } }}>
                <PoliciesAdmin />
              </RequireAuthReactFire>

              // </RequireAuth>
            ),
            // loader: testPoliciesLoader(getAuth),
            // loader: (params) => async () => {
            //   const user = getAuth().currentUser;
            //   console.log('USER: ', user);
            //   return adminPoliciesLoader(params);
            // },
            // loader: async (params) => {
            //   await ensureUserSession();
            //   return adminPoliciesLoader(params);
            // },
          },
          {
            path: ADMIN_ROUTES.SL_TAXES,
            element: (
              // <RequireAuth requiredClaims={['IDEMAND_ADMIN']}>
              <RequireAuthReactFire signInCheckProps={{ requiredClaims: { iDemandAdmin: true } }}>
                <SLTaxes />
              </RequireAuthReactFire>

              // </RequireAuth>
            ),
            // loader: adminTaxLoader,
            errorElement: <RouterErrorBoundary />,
          },
          {
            path: ADMIN_ROUTES.SL_TAXES_NEW,
            element: (
              // <RequireAuth requiredClaims={['IDEMAND_ADMIN']}>
              <RequireAuthReactFire signInCheckProps={{ requiredClaims: { iDemandAdmin: true } }}>
                <SLTaxNew />
              </RequireAuthReactFire>

              // </RequireAuth>
            ),
          },
          {
            path: ADMIN_ROUTES.EDIT_ACTIVE_STATES,
            element: (
              // <RequireAuth requiredClaims={['IDEMAND_ADMIN']}>
              <RequireAuthReactFire signInCheckProps={{ requiredClaims: { iDemandAdmin: true } }}>
                <EditActiveStates />
              </RequireAuthReactFire>

              // </RequireAuth>
            ),
            // loader: activeStatesLoader,
          },
          {
            path: ADMIN_ROUTES.MORATORIUMS,
            element: (
              // <RequireAuth requiredClaims={['IDEMAND_ADMIN']}>
              <RequireAuthReactFire signInCheckProps={{ requiredClaims: { iDemandAdmin: true } }}>
                <Moratoriums />
              </RequireAuthReactFire>

              // </RequireAuth>
            ),
            // loader: moratoriumsLoader,
          },
          {
            path: ADMIN_ROUTES.MORATORIUM_NEW,
            element: (
              // <RequireAuth requiredClaims={['IDEMAND_ADMIN']}>
              <RequireAuthReactFire signInCheckProps={{ requiredClaims: { iDemandAdmin: true } }}>
                <MoratoriumNew />
              </RequireAuthReactFire>

              // </RequireAuth>
            ),
          },
          {
            path: ADMIN_ROUTES.SL_LICENSES,
            // loader: licensesLoader,
            element: (
              <RequireAuthReactFire
                signInCheckProps={{
                  validateCustomClaims: getRequiredClaimValidator(['IDEMAND_ADMIN']),
                }}
              >
                <Licenses />
              </RequireAuthReactFire>
            ),
          },
          {
            path: ADMIN_ROUTES.SL_LICENSE_NEW,
            element: (
              // <RequireAuth requiredClaims={['IDEMAND_ADMIN']}>
              <RequireAuthReactFire signInCheckProps={{ requiredClaims: { iDemandAdmin: true } }}>
                <SLLicenseNew />
              </RequireAuthReactFire>

              // </RequireAuth>
            ),
          },
          {
            path: ADMIN_ROUTES.AGENCY_APPS,
            // loader: agencyAppsLoader,
            element: (
              // <RequireAuth requiredClaims={['IDEMAND_ADMIN']}>
              <RequireAuthReactFire signInCheckProps={{ requiredClaims: { iDemandAdmin: true } }}>
                <AgencyApps />
              </RequireAuthReactFire>

              // </RequireAuth>
            ),
          },
          {
            path: ADMIN_ROUTES.AGENCY_APP,
            // loader: agencyAppLoader,
            element: (
              // <RequireAuth requiredClaims={['IDEMAND_ADMIN']}>
              <RequireAuthReactFire signInCheckProps={{ requiredClaims: { iDemandAdmin: true } }}>
                <AgencyApp />
              </RequireAuthReactFire>

              // </RequireAuth>
            ),
          },
          {
            path: ADMIN_ROUTES.DISCLOSURES,
            element: (
              <RequireAuthReactFire signInCheckProps={{ requiredClaims: { iDemandAdmin: true } }}>
                <Disclosures />
              </RequireAuthReactFire>
            ),
          },
          {
            path: ADMIN_ROUTES.DISCLOSURE_NEW,
            element: (
              <RequireAuthReactFire signInCheckProps={{ requiredClaims: { iDemandAdmin: true } }}>
                <DisclosureNew />
              </RequireAuthReactFire>
            ),
          },
          {
            path: ADMIN_ROUTES.DISCLOSURE_EDIT,
            element: (
              <RequireAuthReactFire signInCheckProps={{ requiredClaims: { iDemandAdmin: true } }}>
                <DisclosureEdit />
              </RequireAuthReactFire>
            ),
          },
          {
            path: ADMIN_ROUTES.CREATE_TENANT,
            element: (
              <RequireAuthReactFire signInCheckProps={{ requiredClaims: { iDemandAdmin: true } }}>
                <CreateTenant />
              </RequireAuthReactFire>
            ),
          },
          {
            path: ADMIN_ROUTES.ORGANIZATIONS,
            element: (
              <RequireAuthReactFire signInCheckProps={{ requiredClaims: { iDemandAdmin: true } }}>
                <Organizations />
              </RequireAuthReactFire>
            ),
          },
          {
            path: ADMIN_ROUTES.ORGANIZATION,
            element: (
              <RequireAuthReactFire signInCheckProps={{ requiredClaims: { iDemandAdmin: true } }}>
                <Organization />
              </RequireAuthReactFire>
            ),
          },
          {
            path: ADMIN_ROUTES.USERS,
            element: (
              <RequireAuthReactFire signInCheckProps={{ requiredClaims: { iDemandAdmin: true } }}>
                <Users />
              </RequireAuthReactFire>
            ),
          },
          {
            path: 'pagination/data-grid',
            element: <TasksPagination />,
            // element: <TestDataGridPagination />,
          },
          {
            path: '/admin/map/submissions',
            element: (
              <RequireAuthReactFire signInCheckProps={{ requiredClaims: { iDemandAdmin: true } }}>
                <PoliciesMap />
              </RequireAuthReactFire>
            ),
          },
        ],
      },
      {
        path: 'account',
        element: <Layout />,
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
