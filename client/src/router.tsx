import { createBrowserRouter } from 'react-router-dom';

import App from './App';
import { Layout } from 'components';
import { Quote, ContactUs, ViewQuote, Checkout, submissionLoader, SubmissionView } from 'views';
import { SuccessStep } from 'elements';

// TODO: add errorElement to routes
// TODO: admin views
//    - submission
//    - quote (submission is view with button to create quote)

// TODO: routes enum
// https://betterprogramming.pub/the-best-way-to-manage-routes-in-a-react-project-with-typescript-c4e8d4422d64
// https://codesandbox.io/s/affectionate-mirzakhani-c7lvr?from-embed
export enum ROUTES {
  QUOTE_NEW = '/quotes/new',
  QUOTE_VIEW = '/quotes/:quoteId',
  QUOTE_SUBMITTED = '/quotes/:submissionId/submitted',
  SUBMISSION_VIEW = '/submissions/:submissionId',
  CHECKOUT = '/quotes/:quoteId/checkout',
  CONTACT = '/contact',
}

type TArgs =
  | { path: ROUTES.QUOTE_NEW }
  | { path: ROUTES.QUOTE_VIEW; params: { quoteId: string } }
  | { path: ROUTES.QUOTE_SUBMITTED; params: { submissionId: string } }
  | { path: ROUTES.SUBMISSION_VIEW; params: { submissionId: string } }
  | { path: ROUTES.CHECKOUT; params: { quoteId: string } }
  | { path: ROUTES.CONTACT };

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
    children: [
      {
        path: '/',
        element: <Layout />,
        children: [
          {
            index: true,
            element: <Quote />,
          },
          {
            path: ROUTES.QUOTE_NEW, // path: '/quotes/new',
            element: <Quote />,
          },
          {
            path: ROUTES.QUOTE_VIEW, //  '/quotes/:quoteId',
            element: <ViewQuote />,
          },
          {
            path: ROUTES.CHECKOUT, //  '/quotes/:quoteId/checkout',
            element: <Checkout />,
          },
          {
            path: ROUTES.QUOTE_SUBMITTED, // '/quotes/submitted',
            element: <SuccessStep />,
            loader: submissionLoader,
          },
          {
            path: ROUTES.SUBMISSION_VIEW,
            element: <SubmissionView />, //  (() => <div>TODO: view submission</div>)(),
            loader: submissionLoader,
          },
          {
            path: ROUTES.CONTACT, //  '/contact',
            element: <ContactUs />,
          },
        ],
      },
    ],
  },
]);
