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

  // return <a href={url}>{children}</a>;
  return (
    <Link component={RouterLink} to={url}>
      {children}
    </Link>
  );
}
