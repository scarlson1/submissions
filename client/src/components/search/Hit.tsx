import { Box, Link } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

import { Collection, InternalDocSearchHit, StoredDocSearchHit } from 'common';
import { ADMIN_ROUTES, ROUTES, createPath } from 'router';

interface HitProps {
  hit: InternalDocSearchHit | StoredDocSearchHit;
  children: React.ReactNode;
}

export function Hit({ hit, children }: HitProps) {
  const url = hit.url || getURLByType(hit);

  return (
    <Link
      component={RouterLink}
      to={url}
      // sx={{ display: 'flex !important', '& .DocSearch-Hit-Container': { flex: 1, minWidth: 0 } }}
    >
      {children}
      {/* {hit.type && renderChip(hit.type)} */}
    </Link>
  );
}

// TODO: get url func (different routes for agents vs idemand admin vs user ?? orgs, for example)
export function getURLByType(item: any) {
  // const base = import.meta.env.VITE_HOSTING_URL;
  let url = '';
  // TODO: user route, financial trx,
  // if (item.type === 'user') {
  //   // url = `${base}/user/${item.objectID}`;
  //   url = `/user/${item.objectID}`;
  // }
  if (item.collectionName === Collection.Enum.quotes) {
    url = createPath({ path: ROUTES.QUOTE_VIEW, params: { quoteId: item.objectID } });
  }
  if (item.collectionName === Collection.Enum.organizations) {
    url = createPath({ path: ADMIN_ROUTES.ORGANIZATION, params: { orgId: item.objectID } });
  }
  // TODO: need to create user submission view
  if (item.collectionName === Collection.Enum.submissions) {
    url = createPath({
      path: ADMIN_ROUTES.SUBMISSION_VIEW,
      params: { submissionId: item.objectID },
    });
  }
  // TODO: standardize routes
  if (item.collectionName === Collection.Enum.policies) {
    url = createPath({ path: ROUTES.POLICY, params: { policyId: item.objectID } });
  }
  if (item.collectionName === Collection.Enum.users) {
    // TODO: create user route
    url = createPath({ path: ROUTES.USER, params: { userId: item.objectID } });
  }
  // TODO: finish getUrl func
  return url;
}

export function OnSelectHit({ hit, children }: HitProps) {
  return (
    // <Box onClick={() => handleSelect(hit)} sx={{ width: '100%' }}>
    <Box sx={{ width: '100%' }} className='onSelect-Item'>
      {children}
    </Box>
  );
}

// https://github.com/mui/material-ui/blob/master/docs/src/modules/components/AppSearch.js#L24

// function DocSearchHit(props) {
//   const { children, hit } = props;

//   function displayTag(pathname) {
//     // does not need to show product label for MUI X because they are grouped by the product name in the search
//     // ie. Data Grid, Date Picker
//     if (!pathname.match(/^\/(material-ui|joy-ui|base)\//)) {
//       return null;
//     }
//     let text = '';
//     if (pathname.startsWith('/material-ui/')) {
//       text = 'Material UI';
//     }
//     if (pathname.startsWith('/joy-ui/')) {
//       text = 'Joy UI';
//     }
//     if (pathname.startsWith('/base/')) {
//       text = 'Base UI';
//     }
//     return <Chip label={text} size='small' variant='outlined' sx={{ mr: 1 }} />;
//   }

//   if (hit.pathname) {
//     return (
//       <Link
//         href={hit.pathname}
//         as={hit.as}
//         sx={{ display: 'flex !important', '& .DocSearch-Hit-Container': { flex: 1, minWidth: 0 } }}
//       >
//         {children}
//         {displayTag(hit.pathname)}
//       </Link>
//     );
//   }

//   // DocSearch stores the old results in its cache
//   // hit.pathname won't be defined for them.
//   return <Link href={hit.url}>{children}</Link>;
// }

// DocSearchHit.propTypes = {
//   children: PropTypes.node,
//   hit: PropTypes.object.isRequired,
// };
