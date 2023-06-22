import React from 'react';
import {
  Breadcrumbs as MuiBreadcrumbs,
  BreadcrumbsProps,
  Link,
  LinkProps,
  Typography,
} from '@mui/material';
import { Link as RLink, useMatches } from 'react-router-dom';

import {
  // createPath, ROUTES, ADMIN_ROUTES, ACCOUNT_ROUTES,
  CrumbMatch,
} from 'router';

// TODO: refactor:
// DOCS - use routes & useMatches
// https://reactrouter.com/en/6.13.0/hooks/use-matches#breadcrumbs

interface RouterLinkProps extends Omit<LinkProps, 'component'> {
  to: string;
  replace?: boolean;
}

export function RouterLink(props: RouterLinkProps) {
  return (
    <Link
      component={RLink as any}
      variant='body2'
      underline='hover'
      color='inherit'
      sx={{ fontSize: '0.75rem !important' }}
      {...props}
    />
  );
}

// interface BreadcrumbTextProps extends TypographyProps {
//   label: React.ReactNode;
// }
// export function BreadcrumbText({ label, ...props }: BreadcrumbTextProps) {
//   return (
//     <Typography
//       variant='body2'
//       color='text.secondary'
//       {...props}
//       sx={{ fontSize: '0.75rem', ...(props?.sx || {}) }}
//     >
//       {label}
//     </Typography>
//   );
// }

export const Breadcrumbs: React.FC<BreadcrumbsProps> = (props) => {
  const matches = useMatches() as CrumbMatch[];

  let crumbs = matches
    .filter((match: CrumbMatch) => Boolean(match.handle?.crumb))
    .map((match: any) => match.handle.crumb(match)); // match.data

  return (
    <MuiBreadcrumbs aria-label='breadcrumb' {...props}>
      <RouterLink to={'/'}>Home</RouterLink>
      {crumbs.map((crumb, j) => {
        if (Array.isArray(crumb)) {
          return crumb.map((c, i) => {
            if (c?.label && c?.link)
              return (
                <RouterLink to={c.link} key={`${i}-${j}`}>
                  {c.label}
                </RouterLink>
              );

            if (c.label)
              return (
                <Typography
                  variant='body2'
                  color='text.secondary'
                  sx={{ fontSize: '0.75rem', pt: '3px' }}
                >
                  {c.label}
                </Typography>
              );

            return null;
          });
        }
        return <div key={`crumb-${j}`}>{crumb}</div>;
      })}
    </MuiBreadcrumbs>
  );
};

// interface BreadcrumbTextProps extends TypographyProps {
//   label: React.ReactNode;
// }
// export function BreadcrumbText({ label, ...props }: BreadcrumbTextProps) {
//   return (
//     <Typography variant='body2' color='text.secondary' sx={{ fontSize: '0.75rem' }} {...props}>
//       {label}
//     </Typography>
//   );
// }

// export const Breadcrumbs: React.FC<BreadcrumbsProps> = (props) => {
//   const location = useLocation();
//   // const matches = useMatches();
//   // console.log('MATCHES: ', matches);

//   // TODO: derive from ROUTES
//   const breadcrumbNameMap = useMemo(
//     () => ({
//       [createPath({ path: ROUTES.SUBMISSIONS })]: 'Submissions',
//       [createPath({ path: ROUTES.QUOTES })]: 'Quotes',
//       [createPath({ path: ROUTES.POLICIES })]: 'Policies',
//       [createPath({ path: ACCOUNT_ROUTES.ACCOUNT })]: 'Account',
//       // [createPath({ path: ADMIN_ROUTES.HOME })]: 'Admin',
//       '/admin': 'Admin', // TODO: create admin home route
//       [createPath({ path: ADMIN_ROUTES.SUBMISSIONS })]: 'Submissions',
//       // TODO: REFACTOR TO NOT HAVE ADMIN ROUTE FOR COMMON ROUTES & ADD BREADCRUMBS TO USER LAYOUT
//       [createPath({ path: ADMIN_ROUTES.QUOTES })]: 'Quotes',
//       // [createPath({ path: ADMIN_ROUTES.POLICIES})]: 'Policies',
//       '/admin/config': 'Config',
//       [createPath({ path: ADMIN_ROUTES.SL_TAXES })]: 'Taxes',
//       // '/admin/active-states': 'Active States',
//       [createPath({ path: ADMIN_ROUTES.MORATORIUMS })]: 'Moratoriums',
//       [createPath({ path: ADMIN_ROUTES.SL_LICENSES })]: 'Licenses',
//       [createPath({ path: ADMIN_ROUTES.DISCLOSURES })]: 'Disclosures',
//       [createPath({ path: ADMIN_ROUTES.ORGANIZATIONS })]: 'Orgs',
//       [createPath({ path: ADMIN_ROUTES.AGENCY_APPS })]: 'Applications',
//     }),
//     []
//   );

//   const paths = useMemo<
//     {
//       to: string;
//       label: string;
//       isLast: boolean;
//     }[]
//   >(() => {
//     const pathnames = location.pathname.split('/').filter((x) => x);
//     return pathnames
//       .map((value, index) => {
//         const isLast = index === pathnames.length - 1;
//         const to = `/${pathnames.slice(0, index + 1).join('/')}`;
//         const label = isLast ? value : breadcrumbNameMap[to]; // startCase(value) --> docId issues

//         // TODO: use matchPath to validate to (don't use link if not valid)

//         if (!label) return { to, label: '', isLast };

//         return { to, label, isLast };
//       })
//       .filter((x) => x.label !== '');
//   }, [location, breadcrumbNameMap]);

//   return (
//     <MuiBreadcrumbs aria-label='breadcrumb' {...props}>
//       <RouterLink to={'/'} underline='hover' color='inherit'>
//         Home
//       </RouterLink>
//       {paths.map(({ label, to, isLast }) =>
//         isLast ? (
//           <Typography variant='body2' color='text.secondary' key={to} sx={{ fontSize: '0.75rem' }}>
//             {label}
//           </Typography>
//         ) : (
//           <RouterLink to={to} key={to}>
//             {label}
//           </RouterLink>
//         )
//       )}
//     </MuiBreadcrumbs>
//   );
// };
