import { ReactNode, useCallback } from 'react';
import {
  Button,
  ButtonProps,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from '@mui/material';

import { useDialog } from 'context';

// TODO: slots & slotsProps --> allow replacing header & actions area
// useGridRootProps: https://github.com/mui/mui-x/blob/master/packages/grid/x-data-grid/src/hooks/utils/useGridRootProps.ts
// computeSlots: https://github.com/mui/mui-x/blob/master/packages/grid/x-data-grid/src/DataGrid/useDataGridProps.ts
// https://github.com/mui/mui-x/blob/master/packages/grid/x-data-grid/src/internals/utils/computeSlots.ts

// TODO: use selector
// mui grid createSelector: https://github.com/mui/mui-x/blob/master/packages/grid/x-data-grid/src/utils/createSelector.ts

// export function CtxDialog({ children }: { children: ReactNode }) {
function CtxDialog({ children }: { children: ReactNode }) {
  const dialog = useDialog();

  return (
    <Dialog
      open={Boolean(dialog?.isOpen)}
      onClose={dialog?.handleClose}
      maxWidth='xs'
      fullWidth
      {...(dialog?.slotProps?.dialog || {})}
    >
      {children}
    </Dialog>
  );
}

const Title = () => {
  const dialog = useDialog();

  return dialog?.title ? (
    <DialogTitle {...(dialog?.slotProps?.title || {})}>{dialog.title}</DialogTitle>
  ) : null;
};

CtxDialog.Title = Title;

const Content = () => {
  const dialog = useDialog();

  return (
    <DialogContent {...(dialog?.slotProps?.content || {})}>
      {dialog?.content ? dialog?.content : null}
    </DialogContent>
  );
};

CtxDialog.Content = Content;

interface ActionsProps {
  confirmButtonProps?: Omit<ButtonProps, 'onClick'>;
  confirmButtonText?: string;
}
const Actions = ({ confirmButtonProps, confirmButtonText = 'submit' }: ActionsProps) => {
  const dialog = useDialog();

  const handleSubmit = useCallback(() => {
    let fn = dialog?.onSubmit ?? dialog?.handleAccept;
    fn && fn();
  }, [dialog]);

  return (
    <DialogActions {...(dialog?.slotProps?.actions || {})}>
      {dialog?.variant === 'danger' && (
        <>
          <Button
            color='primary'
            onClick={dialog?.handleClose}
            {...(dialog?.slotProps?.cancelButton || {})}
          >
            Cancel
          </Button>
          <Button
            color='primary'
            onClick={handleSubmit}
            // disabled={submitDisabled}
            {...(confirmButtonProps || {})}
            {...(dialog?.slotProps?.acceptButton || {})}
          >
            {confirmButtonText}
          </Button>
        </>
      )}
      {dialog?.variant === 'info' && (
        <Button
          color='primary'
          onClick={handleSubmit}
          // disabled={submitDisabled}
          {...(confirmButtonProps || {})}
          {...(dialog?.slotProps?.acceptButton || {})}
        >
          OK
        </Button>
      )}
    </DialogActions>
  );
};

CtxDialog.Actions = Actions;

// function Usage({ children }: { children: ReactNode }) {
function ContextDialog() {
  return (
    <CtxDialog>
      <CtxDialog.Title />
      <CtxDialog.Content />
      <CtxDialog.Actions />
    </CtxDialog>
  );
}

export { CtxDialog, ContextDialog }; // ContextDialog as default

// export function computeSlots<SlotComponents extends object>({
//   defaultSlots,
//   slots,
//   components,
// }: {
//   defaultSlots: SlotComponents;
//   slots?: Partial<SlotComponents>;
//   components?: Partial<SlotComponents>;
// }): SlotComponents {
//   const overrides = slots ?? (components ? components : null);

//   if (!overrides || Object.keys(overrides).length === 0) {
//     return defaultSlots;
//   }

//   return { ...defaultSlots, ...overrides };
// }

// then:
// https://github.com/mui/mui-x/blob/master/packages/grid/x-data-grid/src/DataGrid/useDataGridProps.ts

// export const useDataGridProps = <R extends GridValidRowModel>(inProps: DataGridProps<R>) => {
//   const [components, componentsProps, themedProps] = useProps(
//     useThemeProps({
//       props: inProps,
//       name: 'MuiDataGrid',
//     })
//   );

//   const localeText = React.useMemo(
//     () => ({ ...GRID_DEFAULT_LOCALE_TEXT, ...themedProps.localeText }),
//     [themedProps.localeText]
//   );

//   const slots = React.useMemo<UncapitalizeObjectKeys<GridSlotsComponent>>(
//     () =>
//       computeSlots<GridSlotsComponent>({
//         defaultSlots,
//         slots: themedProps.slots,
//         components,
//       }),
//     [components, themedProps.slots]
//   );

//   return React.useMemo<DataGridProcessedProps<R>>(
//     () => ({
//       ...DATA_GRID_PROPS_DEFAULT_VALUES,
//       ...themedProps,
//       localeText,
//       slots,
//       slotProps: themedProps.slotProps ?? componentsProps,
//       ...DATA_GRID_FORCED_PROPS,
//     }),
//     [themedProps, localeText, slots, componentsProps]
//   );
// };

// https://github.com/mui/mui-x/blob/master/packages/grid/x-data-grid/src/constants/defaultGridSlotsComponents.ts

// export const DATA_GRID_DEFAULT_SLOTS_COMPONENTS: GridSlotsComponent = {
//   ...materialSlots,
//   Cell: GridCellV7,
//   SkeletonCell: GridSkeletonCell,
//   ColumnHeaderFilterIconButton: GridColumnHeaderFilterIconButton,
//   ColumnMenu: GridColumnMenu,
//   ColumnHeaders: GridColumnHeaders,
//   Footer: GridFooter,
//   Toolbar: null,
//   PreferencesPanel: GridPreferencesPanel,
//   LoadingOverlay: GridLoadingOverlay,
//   NoResultsOverlay: GridNoResultsOverlay,
//   NoRowsOverlay: GridNoRowsOverlay,
//   Pagination: GridPagination,
//   FilterPanel: GridFilterPanel,
//   ColumnsPanel: GridColumnsPanel,
//   Panel: GridPanel,
//   Row: GridRow,
// };

// export const DEFAULT_CONTEXT_DIALOG_SLOTS = {
//   header: DialogTitle,
//   content: DialogContent,
//   actions: DialogActions,
//   button: Button,
// };

// export const DEFAULT_CONTEXT_DIALOG_SLOT_PROPS = {
//   header: {},
//   content: { dividers: true },
//   actions: {},
//   button: { variant: 'contained' },
// };
