import { ArticleRounded, DeleteRounded, EditRounded } from '@mui/icons-material';
import { Box, Button, Tooltip, Typography } from '@mui/material';
import { GridActionsCellItem, GridColDef, GridRowParams } from '@mui/x-data-grid';
import { generateHTML } from '@tiptap/html';
import { deleteDoc, doc } from 'firebase/firestore';
import { useCallback, useMemo } from 'react';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { useFirestore } from 'reactfire';

import { COLLECTIONS } from 'common';
import { ServerDataGrid } from 'components';
import { useConfirmation } from 'context';
import { EDITOR_EXTENSION_DEFAULTS, useWidth } from 'hooks';
import { disclosureCols } from 'modules/muiGrid/gridColumnDefs';
import { ADMIN_ROUTES, createPath } from 'router';

// TODO: move disclosure columns to grid cols folder
export const Disclosures = () => {
  const navigate = useNavigate();
  const firestore = useFirestore();
  const dialog = useConfirmation();
  const { isMobile } = useWidth();

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
        width: isMobile ? 80 : 120,
        getActions: (params: GridRowParams) => [
          <GridActionsCellItem
            icon={
              <Tooltip placement='top' title='View Disclosure'>
                <ArticleRounded />
              </Tooltip>
            }
            onClick={showContent(params)}
            label='Preview'
            showInMenu={isMobile}
          />,
          <GridActionsCellItem
            icon={
              <Tooltip placement='top' title='Edit'>
                <EditRounded />
              </Tooltip>
            }
            onClick={editDisclosure(params)}
            label='Edit'
            showInMenu={isMobile}
          />,
          <GridActionsCellItem
            icon={
              <Tooltip placement='top' title='Delete'>
                <DeleteRounded />
              </Tooltip>
            }
            onClick={deleteDisclosure(params)}
            label='Delete'
            showInMenu={isMobile}
          />,
        ],
      },
      ...disclosureCols,
    ],
    [showContent, editDisclosure, deleteDisclosure, isMobile]
  );

  return (
    <Box>
      <Box sx={{ display: 'flex', pb: 2 }}>
        <Typography variant='h5' sx={{ ml: { xs: 2, sm: 3, md: 4 }, flex: '1 1 auto' }}>
          Disclosures
        </Typography>
        <Button
          onClick={() => navigate(createPath({ path: ADMIN_ROUTES.DISCLOSURE_NEW }))}
          sx={{ maxHeight: 34 }}
        >
          New
        </Button>
      </Box>
      {/* <Box sx={{ height: 500, width: '100%' }}> */}
      <ServerDataGrid colName='DISCLOSURES' columns={columns} autoHeight />
      {/* </Box> */}
    </Box>
  );
};
