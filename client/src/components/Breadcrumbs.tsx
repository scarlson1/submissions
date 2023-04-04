import React, { useMemo } from 'react';
import {
  Breadcrumbs as MuiBreadcrumbs,
  BreadcrumbsProps,
  Link,
  LinkProps,
  Typography,
} from '@mui/material';
import { useLocation, Link as RouterLink } from 'react-router-dom';

interface LinkRouterProps extends LinkProps {
  to: string;
  replace?: boolean;
}

function LinkRouter(props: LinkRouterProps) {
  return <Link {...props} component={RouterLink as any} variant='body2' />;
}

const breadcrumbNameMap: { [key: string]: string } = {
  '/submissions': 'Submissions',
  '/quotes': 'Quotes',
  '/policies': 'Policies',
  '/account': 'Account',
  '/admin': 'Admin',
  '/admin/submissions': 'Submissions',
  '/admin/quotes': 'Quotes',
  '/admin/policies': 'Policies',
  '/admin/sl-taxes': 'Taxes',
  // '/admin/active-states': 'Active States',
  '/admin/moratoriums': 'Moratoriums',
  '/admin/licenses': 'Licenses',
  '/admin/agencies': 'Agencies',
  '/admin/agencies/submissions': 'Applications',
  '/admin/orgs': 'Orgs',
  '/admin/disclosures': 'Disclosures',
};

export const Breadcrumbs: React.FC<BreadcrumbsProps> = (props) => {
  const location = useLocation();

  const paths = useMemo<
    {
      to: string;
      label: string;
      isLast: boolean;
    }[]
  >(() => {
    const pathnames = location.pathname.split('/').filter((x) => x);
    return pathnames
      .map((value, index) => {
        const isLast = index === pathnames.length - 1;
        const to = `/${pathnames.slice(0, index + 1).join('/')}`;
        const label = isLast ? value : breadcrumbNameMap[to];

        if (!label) return { to, label: '', isLast };

        return { to, label, isLast };
      })
      .filter((x) => x.label !== '');
  }, [location]);

  return (
    <MuiBreadcrumbs aria-label='breadcrumb' {...props}>
      <LinkRouter to={'/'} underline='hover' color='inherit'>
        Home
      </LinkRouter>
      {paths.map(({ label, to, isLast }) =>
        isLast ? (
          <Typography variant='body2' color='text.secondary' key={to}>
            {label}
          </Typography>
        ) : (
          <LinkRouter underline='hover' color='inherit' to={to} key={to}>
            {label}
          </LinkRouter>
        )
      )}
    </MuiBreadcrumbs>
  );
};

// {
//   pathnames.map((value, index) => {
//     const last = index === pathnames.length - 1;
//     const to = `/${pathnames.slice(0, index + 1).join('/')}`;

//     // FILTERS, but cannot handle variables (doc ID, etc.)
//     const label = breadcrumbNameMap[to];
//     if (!last && !label) return null;

//     return last ? (
//       <Typography variant='body2' color='text.secondary' key={to}>
//         {/* {breadcrumbNameMap[to]} */}
//         {/* {value} */}
//         {value}
//       </Typography>
//     ) : (
//       <LinkRouter underline='hover' color='inherit' to={to} key={to}>
//         {/* {breadcrumbNameMap[to]} */}
//         {/* {value} */}
//         {label}
//       </LinkRouter>
//     );
//   });
// }
