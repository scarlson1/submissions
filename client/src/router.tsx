import { createBrowserRouter } from 'react-router-dom';

import App from './App';
import { Layout } from 'components';
import { Quote, ContactUs } from 'routes';

// TODO: add errorElement to routes
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
            path: '/quote',
            element: <Quote />,
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
