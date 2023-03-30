import React, { useCallback, useMemo } from 'react';
import { Box, Button, Tooltip, Typography } from '@mui/material';
import { ArticleRounded, EditRounded, DeleteRounded } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { GridActionsCellItem, GridColDef, GridRowParams } from '@mui/x-data-grid';
import { useFirestore } from 'reactfire';
import { JSONContent } from '@tiptap/react';
import { generateHTML } from '@tiptap/html';
import { toast } from 'react-hot-toast';

import { ServerDataGrid } from 'components';
import { ADMIN_ROUTES, createPath } from 'router';
import { formatGridFirestoreTimestamp } from 'modules/utils';
import { GridCellCopy, renderChips } from 'components/RenderGridCellHelpers';
import { useConfirmation } from 'modules/components';
import { deleteDoc, doc } from 'firebase/firestore';
import { COLLECTIONS } from 'common';
import { EDITOR_EXTENSION_DEFAULTS } from 'hooks';

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

export const Disclosures: React.FC = () => {
  const navigate = useNavigate();
  const firestore = useFirestore();
  const dialog = useConfirmation();

  const showContent = useCallback(
    (params: GridRowParams) => async () => {
      const content = params.row.content;
      if (!content) return;

      const html = generateHTML(content, EDITOR_EXTENSION_DEFAULTS);

      await dialog({
        variant: 'info',
        catchOnCancel: false,
        title: 'Disclosure Preview',
        description: (() => <div dangerouslySetInnerHTML={{ __html: html }} />)(),
        dialogContentProps: { dividers: true },
        dialogProps: { maxWidth: 'sm' },
      });
    },
    [dialog]
  );

  const editDisclosure = useCallback(
    ({ id }: GridRowParams) =>
      async () => {
        navigate(
          createPath({ path: ADMIN_ROUTES.DISCLOSURE_EDIT, params: { disclosureId: id as string } })
        );
      },
    [navigate]
  );

  const deleteDisclosure = useCallback(
    ({ id }: GridRowParams) =>
      async () => {
        try {
          await dialog({
            variant: 'danger',
            catchOnCancel: false,
            title: 'Are you sure?',
            description: `Would you like to delete disclosure ${id}? This action cannot be undone.`,
            confirmButtonText: 'delete',
            dialogContentProps: { dividers: true },
            dialogProps: { maxWidth: 'xs' },
          });
          await deleteDoc(doc(firestore, COLLECTIONS.DISCLOSURES, `${id}`));
          toast.success('Document deleted');
        } catch (err) {}
      },
    [dialog, firestore]
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
          <GridActionsCellItem
            icon={
              <Tooltip placement='top' title='Edit'>
                <EditRounded />
              </Tooltip>
            }
            onClick={editDisclosure(params)}
            label='Edit'
          />,
          <GridActionsCellItem
            icon={
              <Tooltip placement='top' title='Delete'>
                <DeleteRounded />
              </Tooltip>
            }
            onClick={deleteDisclosure(params)}
            label='Delete'
          />,
        ],
      },
      {
        field: 'state',
        headerName: 'State',
        type: '',
        minWidth: 60,
        flex: 0.2,
        editable: false,
      },
      {
        field: 'products',
        headerName: 'Products',
        minWidth: 160,
        flex: 0.4,
        editable: false,
        renderCell: (params) => renderChips(params, { variant: 'outlined' }),
      },
      {
        field: 'displayName',
        headerName: 'Name',
        minWidth: 180,
        flex: 0.2,
        editable: false,
      },
      {
        field: 'type',
        headerName: 'Type',
        minWidth: 140,
        flex: 0.2,
        editable: false,
      },
      {
        field: 'content',
        headerName: 'Content',
        minWidth: 360,
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
        minWidth: 240,
        flex: 0.8,
        editable: false,
        renderCell: (params) => {
          return <GridCellCopy value={params.value} />;
        },
      },
    ],
    [showContent, editDisclosure, deleteDisclosure]
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
