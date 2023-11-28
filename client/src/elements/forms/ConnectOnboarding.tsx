export {};

// import { Container, useTheme } from '@mui/material';
// import { loadConnectAndInitialize } from '@stripe/connect-js';
// import { ConnectAccountOnboarding, ConnectComponentsProvider } from '@stripe/react-connect-js';
// import { useState } from 'react';
// import { useNavigate } from 'react-router-dom';

// import { functionsInstance } from 'api';
// import { ACCOUNT_ROUTES, createPath } from 'router';

// // DELETE - REPLACED WITH STRIPE HOSTED ONBOARDING

// // docs quick start: https://stripe.com/docs/connect/connect-embedded-components/quickstart
// // TODO: styles: https://stripe.com/docs/connect/get-started-connect-embedded-components#full-list-of-variables

// const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;

// // TODO: need to create connected account when org is created

// export const ConnectOnboarding = ({ accountId }: { accountId: string }) => {
//   const navigate = useNavigate();
//   const { palette, shape } = useTheme();
//   // TODO: suspense resource ??
//   const [stripeConnectInstance] = useState(() => {
//     const fetchClientSecret = async () => {
//       // Fetch the AccountSession client secret
//       try {
//         const { data } = await functionsInstance.post('/stripe/accountSession', {
//           accountId,
//         });
//         return data.clientSecret;
//       } catch (err: any) {
//         console.log('Error: ', err);
//         return undefined;
//       }
//     };

//     return loadConnectAndInitialize({
//       publishableKey,
//       fetchClientSecret: fetchClientSecret,
//       appearance: {
//         overlays: 'dialog',
//         variables: {
//           colorPrimary: palette.primary.main,
//           colorText: palette.text.primary,
//           colorSecondaryText: palette.text.secondary,
//           colorBackground: palette.background.paper,
//           colorBorder: palette.divider, // TODO: look up border color
//           borderRadius: `${shape.borderRadius}px`,
//           spacingUnit: '8px',
//           overlayBorderRadius: '10px',
//         },
//       },
//     });
//   });

//   return (
//     <Container disableGutters maxWidth='lg'>
//       <ConnectComponentsProvider connectInstance={stripeConnectInstance}>
//         <ConnectAccountOnboarding
//           onExit={() => {
//             console.log('TODO: handle exit');
//             navigate(createPath({ path: ACCOUNT_ROUTES.ORG_SETTINGS }));
//           }}
//         />
//       </ConnectComponentsProvider>
//     </Container>
//   );
// };
