import { createBrowserRouter, createSearchParams, URLSearchParamsInit } from 'react-router-dom';

import App from './App';
import { Layout, RequireAuth, RouterErrorBoundary } from 'components';
import {
  SubmissionNew,
  ContactUs,
  ViewQuote,
  // Checkout,
  Login,
  CreateAccount,
  Policy,
  policyLoader,
  Policies,
  UserSubmissions,
  Home,
  newSubmissionLoader,
  AgencyNew,
  Protosure,
  protosureLoader,
  Account,
  QuoteBind,
  quoteLoader,
} from 'views';
import {
  submissionLoader,
  SubmissionView,
  adminSubmissionsLoader,
  Submissions as AdminSubmissions,
  QuoteNew,
  SLTaxes,
  SLTaxNew,
  adminTaxLoader,
  EditActiveStates,
  activeStatesLoader,
  moratoriumsLoader,
  Moratoriums,
  MoratoriumNew,
  SLLicenseNew,
  licensesLoader,
  Licenses,
  AgencyApp,
  agencyAppLoader,
  AgencyApps,
  agencyAppsLoader,
  Quotes,
  newQuoteSubmissionLoader,
  quotesLoader,
} from 'views/admin';
import { SuccessStep, ActionHandler } from 'elements';
import { Product } from 'common';
import { TestDataGridPagination } from 'views/admin/TestDataGridPagination';
import { auth } from 'firebaseConfig';
import { BindSuccess } from 'elements/SuccessStep';
// import RouterErrorBoundary from 'components/errorBoundaries/RouterErrorBoundary';

// provider for react-router (pass user etc.): https://stackoverflow.com/a/74929447/10887890

// TODO: add errorElement to routes
// TODO: admin views
//    - submission
//    - quote (submission is view with button to create quote)

// TODO: routes enum
// https://betterprogramming.pub/the-best-way-to-manage-routes-in-a-react-project-with-typescript-c4e8d4422d64
// https://codesandbox.io/s/affectionate-mirzakhani-c7lvr?from-embed

// TODO: reuse loaders: https://reactrouter.com/en/main/hooks/use-route-loader-data
// Available in custom hooks and any other nested component

export enum ROUTES {
  SUBMISSION_NEW = '/new/:productId',
  SUBMISSION_SUBMITTED = '/quotes/:submissionId/submitted',
  SUBMISSIONS = '/submissions',
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
  QUOTE_NEW = '/admin/quotes/:productId/new',
  SL_TAXES = '/admin/sl-tax',
  SL_TAXES_NEW = '/admin/sl-tax/new',
  EDIT_ACTIVE_STATES = '/admin/active-states/:productId/edit',
  MORATORIUMS = '/admin/moratoriums',
  MORATORIUM_NEW = '/admin/moratoriums/new',
  SL_LICENSES = '/admin/licenses',
  SL_LICENSE_NEW = '/admin/licenses/new',
  AGENCY_APPS = '/admin/agencies/submissions',
  AGENCY_APP = '/admin/agencies/submissions/:submissionId',
}

export enum AUTH_ROUTES {
  LOGIN = '/auth/login',
  CREATE_ACCOUNT = '/auth/create-account',
  ACTIONS_HANDLER = '/auth/actions-handler',
}

type TArgs =
  | { path: ROUTES.SUBMISSION_NEW; params: { productId: Product } }
  | { path: ROUTES.SUBMISSION_SUBMITTED; params: { submissionId: string } }
  | { path: ROUTES.SUBMISSIONS }
  | { path: ROUTES.QUOTE_VIEW; params: { quoteId: string } }
  | { path: ROUTES.QUOTE_BIND; params: { quoteId: string } } // INCLUDE PRODUCT ID ??
  | { path: ROUTES.QUOTE_BIND_SUCCESS; params: { quoteId: string; transactionId?: string } }
  | { path: ROUTES.USER_POLICIES }
  | { path: ROUTES.USER_POLICY; params: { policyId: string } }
  | { path: ROUTES.AGENCY_NEW }
  | { path: ROUTES.CONTACT }
  | { path: ROUTES.PROTOSURE; params: { productId: Product; quoteId?: string } }
  | { path: ROUTES.ACCOUNT }
  | { path: ADMIN_ROUTES.SUBMISSIONS }
  | { path: ADMIN_ROUTES.SUBMISSION_VIEW; params: { submissionId: string } }
  | { path: ADMIN_ROUTES.QUOTES }
  | { path: ADMIN_ROUTES.QUOTE_NEW; params: { productId: Product } }
  | { path: ADMIN_ROUTES.SL_TAXES }
  | { path: ADMIN_ROUTES.SL_TAXES_NEW }
  | { path: ADMIN_ROUTES.EDIT_ACTIVE_STATES; params: { productId: Product } }
  | { path: ADMIN_ROUTES.MORATORIUMS }
  | { path: ADMIN_ROUTES.MORATORIUM_NEW }
  | { path: ADMIN_ROUTES.SL_LICENSES }
  | { path: ADMIN_ROUTES.SL_LICENSE_NEW }
  | { path: ADMIN_ROUTES.AGENCY_APPS }
  | { path: ADMIN_ROUTES.AGENCY_APP; params: { submissionId: string } }
  | { path: AUTH_ROUTES.CREATE_ACCOUNT }
  | { path: AUTH_ROUTES.LOGIN }
  | {
      path: AUTH_ROUTES.ACTIONS_HANDLER;
      search: { mode: string; oobCode: string; continueUrl?: string | null };
    };

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
            loader: newSubmissionLoader,
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
          {
            path: ROUTES.PROTOSURE,
            loader: protosureLoader,
            element: (
              <RequireAuth shouldSignInAnonymously={true}>
                <Protosure />
              </RequireAuth>
            ),
            errorElement: (
              <RouterErrorBoundary
                actionButtons={[
                  {
                    path: createPath({
                      path: ROUTES.PROTOSURE,
                      params: { productId: 'flood', quoteId: '' },
                    }),
                    label: 'Start new quote',
                  },
                ]}
              />
            ),
          },
          {
            path: ROUTES.SUBMISSIONS,
            element: <UserSubmissions />,
            errorElement: <RouterErrorBoundary />,
          },
          {
            path: ROUTES.QUOTE_VIEW,
            loader: quoteLoader(auth),
            element: <ViewQuote />,
          },
          {
            path: ROUTES.QUOTE_BIND,
            loader: quoteLoader(auth),
            element: <QuoteBind />,
          },
          {
            path: ROUTES.QUOTE_BIND_SUCCESS,
            loader: quoteLoader(auth),
            element: <BindSuccess />,
          },
          {
            path: ROUTES.SUBMISSION_SUBMITTED,
            element: <SuccessStep />,
            loader: submissionLoader,
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
            element: <Login />,
          },
          {
            path: AUTH_ROUTES.CREATE_ACCOUNT,
            element: <CreateAccount />,
          },
          {
            path: AUTH_ROUTES.ACTIONS_HANDLER,
            element: <ActionHandler />,
          },
          {
            path: ROUTES.ACCOUNT,
            element: <Account />,
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
            loader: policyLoader,
            errorElement: <RouterErrorBoundary />,
          },
        ],
      },
      {
        path: 'admin',
        element: <Layout />,
        errorElement: <RouterErrorBoundary />,
        children: [
          {
            index: true,
            element: (() => <div>TODO: Admin Index Page</div>)(),
          },
          {
            path: ADMIN_ROUTES.SUBMISSIONS,
            element: (
              <RequireAuth requiredClaims={['IDEMAND_ADMIN']}>
                <AdminSubmissions />
              </RequireAuth>
            ),
            loader: adminSubmissionsLoader,
            errorElement: <RouterErrorBoundary />,
          },
          {
            path: ADMIN_ROUTES.SUBMISSION_VIEW,
            element: (
              <RequireAuth requiredClaims={['IDEMAND_ADMIN']}>
                <SubmissionView />
              </RequireAuth>
            ),
            loader: submissionLoader,
            errorElement: <RouterErrorBoundary />,
          },
          {
            path: ADMIN_ROUTES.QUOTE_NEW,
            loader: newQuoteSubmissionLoader,
            element: (
              <RequireAuth requiredClaims={['IDEMAND_ADMIN']}>
                <QuoteNew />
              </RequireAuth>
            ),
          },
          {
            path: ADMIN_ROUTES.QUOTES,
            loader: quotesLoader,
            element: (
              <RequireAuth requiredClaims={['IDEMAND_ADMIN']}>
                <Quotes />
              </RequireAuth>
            ),
          },
          {
            path: ADMIN_ROUTES.SL_TAXES,
            loader: adminTaxLoader,
            element: (
              <RequireAuth requiredClaims={['IDEMAND_ADMIN']}>
                <SLTaxes />
              </RequireAuth>
            ),
            errorElement: <RouterErrorBoundary />,
          },
          {
            path: ADMIN_ROUTES.SL_TAXES_NEW,
            element: (
              <RequireAuth requiredClaims={['IDEMAND_ADMIN']}>
                <SLTaxNew />
              </RequireAuth>
            ),
          },
          {
            path: ADMIN_ROUTES.EDIT_ACTIVE_STATES,
            loader: activeStatesLoader,
            element: (
              <RequireAuth requiredClaims={['IDEMAND_ADMIN']}>
                <EditActiveStates />
              </RequireAuth>
            ),
          },
          {
            path: ADMIN_ROUTES.MORATORIUMS,
            loader: moratoriumsLoader,
            element: (
              <RequireAuth requiredClaims={['IDEMAND_ADMIN']}>
                <Moratoriums />
              </RequireAuth>
            ),
          },
          {
            path: ADMIN_ROUTES.MORATORIUM_NEW,
            element: (
              <RequireAuth requiredClaims={['IDEMAND_ADMIN']}>
                <MoratoriumNew />
              </RequireAuth>
            ),
          },
          {
            path: ADMIN_ROUTES.SL_LICENSES,
            loader: licensesLoader,
            element: (
              <RequireAuth requiredClaims={['IDEMAND_ADMIN']}>
                <Licenses />
              </RequireAuth>
            ),
          },
          {
            path: ADMIN_ROUTES.SL_LICENSE_NEW,
            element: (
              <RequireAuth requiredClaims={['IDEMAND_ADMIN']}>
                <SLLicenseNew />
              </RequireAuth>
            ),
          },
          {
            path: ADMIN_ROUTES.AGENCY_APPS,
            loader: agencyAppsLoader,
            element: (
              <RequireAuth requiredClaims={['IDEMAND_ADMIN']}>
                <AgencyApps />
              </RequireAuth>
            ),
          },
          {
            path: ADMIN_ROUTES.AGENCY_APP,
            loader: agencyAppLoader,
            element: (
              <RequireAuth requiredClaims={['IDEMAND_ADMIN']}>
                <AgencyApp />
              </RequireAuth>
            ),
          },
          // {
          //   path: 'pagination/tasks',
          //   element: <TestPagination />,
          // },
          {
            path: 'pagination/data-grid',
            element: <TestDataGridPagination />,
          },
        ],
      },
    ],
  },
]);
