import { createBrowserRouter } from 'react-router-dom';

import App from './App';
import { Layout } from 'components';
import { Quote, ContactUs, ViewQuote, Checkout } from 'views';
import { SuccessStep } from 'elements';

// TODO: add errorElement to routes
// TODO: admin views
//    - submission
//    - quote (submission is view with button to create quote)

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
            path: '/quotes/new',
            element: <Quote />,
          },
          {
            path: '/quotes/:quoteId',
            element: <ViewQuote />,
          },
          {
            path: '/quotes/:quoteId/checkout',
            element: <Checkout />,
          },
          {
            path: '/quotes/submitted',
            element: <SuccessStep />,
          },
          {
            path: '/contact',
            element: <ContactUs />,
          },
        ],
      },
    ],
  },
]);
