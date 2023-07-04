import { forwardRef } from 'react';
import { IconButton, IconButtonProps } from '@mui/material';
import {
  GridPreferencePanelsValue,
  gridPreferencePanelStateSelector,
  useGridApiContext,
  useGridRootProps,
  useGridSelector,
} from '@mui/x-data-grid';
import useId from '@mui/material/utils/useId';

export const GridToolbarColumnsIconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  function GridToolbarColumnsButton(props, ref) {
    const { onClick, ...other } = props;
    const columnButtonId = useId();
    const columnPanelId = useId();

    const apiRef = useGridApiContext();
    const rootProps = useGridRootProps();
    const preferencePanel = useGridSelector(apiRef, gridPreferencePanelStateSelector);

    const showColumns = (event: React.MouseEvent<HTMLButtonElement>) => {
      if (
        preferencePanel.open &&
        preferencePanel.openedPanelValue === GridPreferencePanelsValue.columns
      ) {
        apiRef.current.hidePreferences();
      } else {
        apiRef.current.showPreferences(
          GridPreferencePanelsValue.columns, // @ts-ignore
          columnPanelId,
          columnButtonId
        );
      }

      onClick?.(event);
    };

    // Disable the button if the corresponding is disabled
    if (rootProps.disableColumnSelector) {
      return null;
    }

    // @ts-ignore
    const isOpen = preferencePanel.open && preferencePanel.panelId === columnPanelId;

    return (
      <IconButton
        ref={ref}
        id={columnButtonId}
        size='small'
        color='info'
        aria-label={apiRef.current.getLocaleText('toolbarColumnsLabel')}
        aria-haspopup='menu'
        aria-expanded={isOpen}
        aria-controls={isOpen ? columnPanelId : undefined}
        // startIcon={<rootProps.slots.columnSelectorIcon />}
        {...other}
        onClick={showColumns}
        {...rootProps.slotProps?.baseButton}
      >
        {/* {apiRef.current.getLocaleText('toolbarColumns')} */}
        <rootProps.slots.columnSelectorIcon fontSize='inherit' />
      </IconButton>
    );
  }
);
