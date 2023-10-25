import { Box, Typography } from '@mui/material';
import { GridColDef } from '@mui/x-data-grid';
import { JSONContent, generateHTML } from '@tiptap/react';
import { useMemo } from 'react';

import { Disclosure, DisclosureType } from 'common';
import { EDITOR_EXTENSION_DEFAULTS } from 'hooks';
import {
  createdCol,
  displayNameCol,
  idCol,
  productsCol,
  stateCol,
  updatedCol,
} from './gridColumns';

const ContentSnippet = ({ json }: { json: JSONContent }) => {
  const content = useMemo(() => {
    return generateHTML(json, EDITOR_EXTENSION_DEFAULTS);
  }, [json]);

  return (
    <Typography variant='body2' color='text.secondary' component='div'>
      {content}
    </Typography>
  );
};

export const disclosureCols: GridColDef<Disclosure>[] = [
  stateCol,
  productsCol,
  displayNameCol,
  {
    field: 'type',
    headerName: 'Type',
    minWidth: 140,
    flex: 0.2,
    editable: false,
    filterable: true,
    sortable: false,
    type: 'singleSelect',
    valueOptions: DisclosureType.options,
  },
  {
    field: 'content',
    headerName: 'Content',
    minWidth: 360,
    flex: 1,
    editable: false,
    sortable: false,
    filterable: false,
    renderCell: (params) => {
      if (!params.value) return null;
      return (
        <Box
          sx={{
            overflow: 'auto',
            whiteSpace: 'nowrap',
            '&::-webkit-scrollbar': { display: 'none' },
          }}
        >
          <ContentSnippet json={params.value} />
        </Box>
      );
    },
  },
  createdCol,
  updatedCol,
  idCol,
];
