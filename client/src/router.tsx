import { createBrowserRouter } from 'react-router-dom';

import App from './App';
import { Layout, RequireAuth, RouterErrorBoundary } from 'components';
import {
  SubmissionNew,
  ContactUs,
  ViewQuote,
  Checkout,
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
} from 'views/admin';
import { SuccessStep } from 'elements';
import { Product } from 'common';
import { TestDataGridPagination } from 'views/admin/TestDataGridPagination';
// import RouterErrorBoundary from 'components/errorBoundaries/RouterErrorBoundary';

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
  CHECKOUT = '/quotes/:quoteId/checkout',
  CONTACT = '/contact',
  USER_QUOTES = '/quotes/list/:userId',
  USER_POLICIES = '/policies',
  USER_POLICY = '/policies/:policyId',
  AGENCY_NEW = '/agency/new',
  PROTOSURE = '/protosure/new/:productId/:quoteId?',
}

export enum ADMIN_ROUTES {
  SUBMISSIONS = '/admin/submissions',
  SUBMISSION_VIEW = '/admin/submissions/:submissionId',
  QUOTE_NEW = '/admin/quote/new',
  SL_TAXES = '/admin/sl-tax',
  SL_TAXES_NEW = '/admin/sl-tax/new',
  EDIT_ACTIVE_STATES = '/admin/active-states/:productId/edit',
  MORATORIUMS = '/admin/moratoriums',
  MORATORIUM_NEW = '/admin/moratoriums/new',
  SL_LICENSES = '/admin/licenses',
  SL_LICENSE_NEW = '/admin/licenses/new',
}

export enum AUTH_ROUTES {
  LOGIN = '/auth/login',
  CREATE_ACCOUNT = '/auth/create-account',
}

type TArgs =
  | { path: ROUTES.SUBMISSION_NEW; params: { productId: Product } }
  | { path: ROUTES.SUBMISSION_SUBMITTED; params: { submissionId: string } }
  | { path: ROUTES.SUBMISSIONS }
  | { path: ROUTES.QUOTE_VIEW; params: { quoteId: string } }
  | { path: ROUTES.CHECKOUT; params: { quoteId: string } }
  | { path: ROUTES.USER_POLICIES }
  | { path: ROUTES.USER_POLICY; params: { policyId: string } }
  | { path: ROUTES.AGENCY_NEW }
  | { path: ROUTES.CONTACT }
  | { path: ROUTES.PROTOSURE; params: { productId: Product; quoteId?: string } }
  | { path: ADMIN_ROUTES.SUBMISSIONS }
  | { path: ADMIN_ROUTES.SUBMISSION_VIEW; params: { submissionId: string } }
  | { path: ADMIN_ROUTES.QUOTE_NEW }
  | { path: ADMIN_ROUTES.SL_TAXES }
  | { path: ADMIN_ROUTES.SL_TAXES_NEW }
  | { path: ADMIN_ROUTES.EDIT_ACTIVE_STATES; params: { productId: Product } }
  | { path: ADMIN_ROUTES.MORATORIUMS }
  | { path: ADMIN_ROUTES.MORATORIUM_NEW }
  | { path: ADMIN_ROUTES.SL_LICENSES }
  | { path: ADMIN_ROUTES.SL_LICENSE_NEW }
  | { path: AUTH_ROUTES.CREATE_ACCOUNT }
  | { path: AUTH_ROUTES.LOGIN };

type TArgsWithParams = Extract<TArgs, { path: any; params: any }>;

export function createPath(args: TArgs) {
  if (args.hasOwnProperty('params') === false) return args.path;

  // Create a path by replacing params in the route definition
  return Object.entries((args as TArgsWithParams).params).reduce(
    (previousValue: string, [param, value]) => previousValue.replace(`:${param}`, '' + value),
    args.path
  );
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
            element: <ViewQuote />,
          },
          {
            path: ROUTES.CHECKOUT, //  '/quotes/:quoteId/checkout',
            element: <Checkout />,
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
            element: (() => <div>Admin Index Page</div>)(),
          },
          {
            path: ADMIN_ROUTES.SUBMISSIONS,
            element: (
              <RequireAuth requiredClaims={['iDemandAdmin']}>
                <AdminSubmissions />
              </RequireAuth>
            ),
            loader: adminSubmissionsLoader,
            errorElement: <RouterErrorBoundary />,
          },
          {
            path: ADMIN_ROUTES.SUBMISSION_VIEW,
            element: (
              <RequireAuth requiredClaims={['iDemandAdmin']}>
                <SubmissionView />
              </RequireAuth>
            ),
            loader: submissionLoader,
            errorElement: <RouterErrorBoundary />,
          },
          {
            path: ADMIN_ROUTES.QUOTE_NEW,
            element: (
              <RequireAuth requiredClaims={['iDemandAdmin']}>
                <QuoteNew />
              </RequireAuth>
            ),
          },
          {
            path: ADMIN_ROUTES.SL_TAXES,
            loader: adminTaxLoader,
            element: (
              <RequireAuth requiredClaims={['iDemandAdmin']}>
                <SLTaxes />
              </RequireAuth>
            ),
            errorElement: <RouterErrorBoundary />,
          },
          {
            path: ADMIN_ROUTES.SL_TAXES_NEW,
            element: (
              <RequireAuth requiredClaims={['iDemandAdmin']}>
                <SLTaxNew />
              </RequireAuth>
            ),
          },
          {
            path: ADMIN_ROUTES.EDIT_ACTIVE_STATES,
            loader: activeStatesLoader,
            element: (
              <RequireAuth requiredClaims={['iDemandAdmin']}>
                <EditActiveStates />
              </RequireAuth>
            ),
          },
          {
            path: ADMIN_ROUTES.MORATORIUMS,
            loader: moratoriumsLoader,
            element: (
              <RequireAuth requiredClaims={['iDemandAdmin']}>
                <Moratoriums />
              </RequireAuth>
            ),
          },
          {
            path: ADMIN_ROUTES.MORATORIUM_NEW,
            element: (
              <RequireAuth requiredClaims={['iDemandAdmin']}>
                <MoratoriumNew />
              </RequireAuth>
            ),
          },
          {
            path: ADMIN_ROUTES.SL_LICENSES,
            loader: licensesLoader,
            element: (
              <RequireAuth requiredClaims={['iDemandAdmin']}>
                <Licenses />
              </RequireAuth>
            ),
          },
          {
            path: ADMIN_ROUTES.SL_LICENSE_NEW,
            element: (
              <RequireAuth requiredClaims={['iDemandAdmin']}>
                <SLLicenseNew />
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
