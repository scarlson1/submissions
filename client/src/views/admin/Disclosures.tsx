import React, { useCallback, useMemo } from 'react';
import { Box, Button, Tooltip, Typography } from '@mui/material';
import { ArticleRounded } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { GridActionsCellItem, GridColDef, GridRowParams } from '@mui/x-data-grid';
import { JSONContent } from '@tiptap/react';
import { generateHTML } from '@tiptap/html';
import StarterKit from '@tiptap/starter-kit';
import { Color } from '@tiptap/extension-color';
import ListItem from '@tiptap/extension-list-item';
import TextStyle from '@tiptap/extension-text-style'; // { TextStyleOptions }
import Link from '@tiptap/extension-link';

import { ServerDataGrid } from 'components';
import { ADMIN_ROUTES, createPath } from 'router';
import { formatGridFirestoreTimestamp } from 'modules/utils';
import { GridCellCopy, renderChips } from 'components/RenderGridCellHelpers';
import { useConfirmation } from 'modules/components';

const ContentSnippet = ({ json }: { json: JSONContent }) => {
  const content = useMemo(() => {
    return generateHTML(json, [
      Color.configure({ types: [TextStyle.name, ListItem.name] }), // @ts-ignore
      TextStyle.configure({ types: [ListItem.name] }),
      Link,
      StarterKit,
    ]);
  }, [json]);

  return (
    <Typography variant='body2' color='text.secondary' component='div'>
      {content}
    </Typography>
  );
};

export const Disclosures: React.FC = () => {
  const navigate = useNavigate();
  const dialog = useConfirmation();

  const showContent = useCallback(
    (params: GridRowParams) => async () => {
      const content = params.row.content;
      if (!content) return;

      const html = generateHTML(content, [
        Color.configure({ types: [TextStyle.name, ListItem.name] }), // @ts-ignore
        TextStyle.configure({ types: [ListItem.name] }),
        Link,
        StarterKit,
      ]);

      await dialog({
        variant: 'info',
        catchOnCancel: false,
        title: 'Disclosure Preview',
        description: (() => <div dangerouslySetInnerHTML={{ __html: html }} />)(), // html,
        dialogContentProps: { dividers: true },
        dialogProps: { maxWidth: 'sm' },
      });
    },
    [dialog]
  );

  const columns: GridColDef[] = useMemo(
    () => [
      {
        field: 'actions',
        headerName: 'Actions',
        type: 'actions',
        width: 120,
        getActions: (params: GridRowParams) => [
          <GridActionsCellItem
            icon={
              <Tooltip placement='top' title='View Disclosure'>
                <ArticleRounded />
              </Tooltip>
            }
            onClick={showContent(params)}
            label='Details'
          />,
        ],
      },
      {
        field: 'state',
        headerName: 'State',
        type: '',
        minWidth: 120,
        flex: 0.2,
        editable: false,
      },
      {
        field: 'products',
        headerName: 'Products',
        minWidth: 200,
        flex: 0.4,
        editable: false,
        renderCell: (params) => renderChips(params, { variant: 'outlined' }),
      },
      {
        field: 'type',
        headerName: 'Type',
        minWidth: 160,
        flex: 0.2,
        editable: false,
      },
      {
        field: 'content',
        headerName: 'Content',
        minWidth: 300,
        flex: 1,
        editable: false,
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
      {
        field: 'metadata.created',
        headerName: 'Created',
        minWidth: 160,
        flex: 0.6,
        editable: false,
        valueGetter: (params) => params.row.metadata.created || null,
        valueFormatter: formatGridFirestoreTimestamp,
      },
      {
        field: 'metadata.updated',
        headerName: 'Updated',
        minWidth: 160,
        flex: 0.6,
        editable: false,
        valueGetter: (params) => params.row.metadata.updated || null,
        valueFormatter: formatGridFirestoreTimestamp,
      },
      {
        field: 'id',
        headerName: 'Doc ID',
        minWidth: 200,
        flex: 0.8,
        editable: false,
        renderCell: (params) => {
          return <GridCellCopy value={params.value} />;
        },
      },
    ],
    [showContent]
  );

  return (
    <Box>
      <Box sx={{ display: 'flex', pb: 2 }}>
        <Typography variant='h5' sx={{ ml: { xs: 0, sm: 3, md: 4 }, flex: '1 1 auto' }}>
          Disclosures
        </Typography>
        <Button
          variant='contained'
          onClick={() => navigate(createPath({ path: ADMIN_ROUTES.DISCLOSURE_NEW }))}
          sx={{ maxHeight: 34 }}
        >
          New
        </Button>
      </Box>

      <ServerDataGrid collName='DISCLOSURES' columns={columns} />
    </Box>
  );
};
