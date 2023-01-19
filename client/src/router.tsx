import { createBrowserRouter } from 'react-router-dom';

import App from './App';
import { Layout, RequireAuth, RouterErrorBoundary } from 'components';
import {
  Quote,
  ContactUs,
  ViewQuote,
  Checkout,
  submissionLoader,
  SubmissionView,
  submissionsLoader,
  Submissions,
  Login,
  CreateAccount,
} from 'views';
import { SuccessStep } from 'elements';
// import RouterErrorBoundary from 'components/errorBoundaries/RouterErrorBoundary';

// TODO: add errorElement to routes
// TODO: admin views
//    - submission
//    - quote (submission is view with button to create quote)

// TODO: routes enum
// https://betterprogramming.pub/the-best-way-to-manage-routes-in-a-react-project-with-typescript-c4e8d4422d64
// https://codesandbox.io/s/affectionate-mirzakhani-c7lvr?from-embed

// TODO: separate into admin routes

export enum ROUTES {
  SUBMISSION_NEW = '/new',
  SUBMISSION_SUBMITTED = '/quotes/:submissionId/submitted',
  QUOTE_VIEW = '/quotes/:quoteId',
  CHECKOUT = '/quotes/:quoteId/checkout',
  CONTACT = '/contact',
}

export enum ADMIN_ROUTES {
  SUBMISSIONS = '/admin/submissions',
  SUBMISSION_VIEW = '/admin/submissions/:submissionId',
}

type TArgs =
  | { path: ROUTES.SUBMISSION_NEW }
  | { path: ROUTES.SUBMISSION_SUBMITTED; params: { submissionId: string } }
  | { path: ROUTES.QUOTE_VIEW; params: { quoteId: string } }
  | { path: ROUTES.CHECKOUT; params: { quoteId: string } }
  | { path: ROUTES.CONTACT }
  | { path: ADMIN_ROUTES.SUBMISSIONS }
  | { path: ADMIN_ROUTES.SUBMISSION_VIEW; params: { submissionId: string } };

type TArgsWithParams = Extract<TArgs, { path: any; params: any }>;

export function createPath(args: TArgs) {
  if (args.hasOwnProperty('params') === false) return args.path;

  // Create a path by replacing params in the route definition
  return Object.entries((args as TArgsWithParams).params).reduce(
    (previousValue: string, [param, value]) => previousValue.replace(`:${param}`, '' + value),
    args.path
  );
}

// example: <Link to={createPath({ path: ROUTES.QUOTE_NEW })} />

// createPath({
//   path: ROUTES.CHECKOUT,
//   params: { quoteId: '123ID' },
// });

export const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    errorElement: <RouterErrorBoundary />,
    children: [
      {
        path: '/',
        element: <Layout />,
        errorElement: <RouterErrorBoundary />,
        children: [
          {
            index: true,
            element: <Quote />,
          },
          {
            path: ROUTES.SUBMISSION_NEW,
            element: <Quote />,
            errorElement: (
              <RouterErrorBoundary
                actionButtons={[{ path: ROUTES.SUBMISSION_NEW, label: 'Start new quote' }]}
              />
            ),
            // errorElement: (
            //   <FormError
            //     title='Error fetching quote'
            //     subTitle='Please try creating another quote'
            //     buttons={[{ label: 'Create a Quote', route: '/application/flood' }]}
            //   />
            // ),
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
            errorElement: <RouterErrorBoundary actionButtons={[{ path: '/', label: 'Home' }]} />,
          },
          {
            path: ROUTES.CONTACT,
            element: <ContactUs />,
            errorElement: <RouterErrorBoundary actionButtons={[{ path: '/', label: 'Home' }]} />,
          },
          {
            path: '/auth/login',
            element: <Login />,
          },
          {
            path: '/auth/create-account',
            element: <CreateAccount />,
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
                <Submissions />
              </RequireAuth>
            ),
            loader: submissionsLoader,
            errorElement: <RouterErrorBoundary actionButtons={[{ path: '/', label: 'Home' }]} />,
          },
          {
            path: ADMIN_ROUTES.SUBMISSION_VIEW,
            element: (
              <RequireAuth requiredClaims={['iDemandAdmin']}>
                <SubmissionView />
              </RequireAuth>
            ),
            loader: submissionLoader,
            errorElement: <RouterErrorBoundary actionButtons={[{ path: '/', label: 'Home' }]} />,
          },
        ],
      },
    ],
  },
]);
