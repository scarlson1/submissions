import React from 'react';
import { Link } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

import type { InternalDocSearchHit, StoredDocSearchHit } from 'common';

interface HitProps {
  hit: InternalDocSearchHit | StoredDocSearchHit;
  children: React.ReactNode;
}

export function Hit({ hit, children }: HitProps) {
  const url = hit.url || '';

  // function renderChip(type: string) {
  //   // if (!pathname.match(/^\/(material-ui|joy-ui|base)\//)) {
  //   if (!type.match(/^\/(policy|quote|user|submission|task)\//)) {
  //     return null;
  //   }
  //   // TODO: extact text from url ?? see example below
  //   return <Chip label={type} variant='outlined' size='small' sx={{ ml: 2 }} />;
  // }

  // return <a href={url}>{children}</a>;
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
