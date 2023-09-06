import { forwardRef, useMemo } from 'react';
import PropTypes from 'prop-types';
import {
  GridFilterItem,
  GridPreferencePanelsValue,
  GridTranslationKeys,
  getDataGridUtilityClass,
  gridColumnLookupSelector,
  gridFilterActiveItemsSelector,
  gridPreferencePanelStateSelector,
  useGridApiContext,
  useGridRootProps,
  useGridSelector,
} from '@mui/x-data-grid';
import { DataGridProcessedProps } from '@mui/x-data-grid/models/props/DataGridProps';
import {
  Badge,
  IconButton,
  IconButtonProps,
  TooltipProps,
  capitalize,
  unstable_composeClasses as composeClasses,
  styled,
} from '@mui/material';
import useId from '@mui/material/utils/useId';

type OwnerState = DataGridProcessedProps;

const useUtilityClasses = (ownerState: OwnerState) => {
  const { classes } = ownerState;

  const slots = {
    root: ['toolbarFilterList'],
  };

  return composeClasses(slots, getDataGridUtilityClass, classes);
};

const GridToolbarFilterListRoot = styled('ul', {
  name: 'MuiDataGrid',
  slot: 'ToolbarFilterList',
  overridesResolver: (_props, styles) => styles.toolbarFilterList,
})<{ ownerState: OwnerState }>(({ theme }) => ({
  margin: theme.spacing(1, 1, 0.5),
  padding: theme.spacing(0, 1),
}));

export interface GridToolbarFilterButtonProps
  extends Omit<TooltipProps, 'title' | 'children' | 'componentsProps'> {
  /**
   * The props used for each slot inside.
   * @default {}
   */
  componentsProps?: { button?: IconButtonProps };
}

const GridToolbarFilterIconButton = forwardRef<HTMLButtonElement, GridToolbarFilterButtonProps>(
  function GridToolbarFilterButton(props, ref) {
    const { componentsProps = {}, ...other } = props;
    const buttonProps = componentsProps.button || {};
    const apiRef = useGridApiContext();
    const rootProps = useGridRootProps();
    const activeFilters = useGridSelector(apiRef, gridFilterActiveItemsSelector);
    const lookup = useGridSelector(apiRef, gridColumnLookupSelector);
    const preferencePanel = useGridSelector(apiRef, gridPreferencePanelStateSelector);
    const classes = useUtilityClasses(rootProps);
    const filterButtonId = useId();
    const filterPanelId = useId();

    const tooltipContentNode = useMemo(() => {
      if (preferencePanel.open) {
        return apiRef.current.getLocaleText('toolbarFiltersTooltipHide') as React.ReactElement;
      }
      if (activeFilters.length === 0) {
        return apiRef.current.getLocaleText('toolbarFiltersTooltipShow') as React.ReactElement;
      }

      const getOperatorLabel = (item: GridFilterItem): string =>
        lookup[item.field!].filterOperators!.find((operator) => operator.value === item.operator)!
          .label ||
        apiRef.current
          .getLocaleText(`filterOperator${capitalize(item.operator!)}` as GridTranslationKeys)!
          .toString();

      const getFilterItemValue = (item: GridFilterItem): string => {
        const { getValueAsString } = lookup[item.field!].filterOperators!.find(
          (operator) => operator.value === item.operator
        )!;

        return getValueAsString ? getValueAsString(item.value) : item.value;
      };

      return (
        <div>
          {apiRef.current.getLocaleText('toolbarFiltersTooltipActive')(activeFilters.length)}
          <GridToolbarFilterListRoot className={classes.root} ownerState={rootProps}>
            {activeFilters.map((item, index) => ({
              ...(lookup[item.field!] && (
                <li key={index}>
                  {`${lookup[item.field!].headerName || item.field}
                  ${getOperatorLabel(item)}
                  ${
                    // implicit check for null and undefined
                    item.value != null ? getFilterItemValue(item) : ''
                  }`}
                </li>
              )),
            }))}
          </GridToolbarFilterListRoot>
        </div>
      );
    }, [apiRef, rootProps, preferencePanel.open, activeFilters, lookup, classes]);

    const toggleFilter = (event: React.MouseEvent<HTMLButtonElement>) => {
      const { open, openedPanelValue } = preferencePanel;
      if (open && openedPanelValue === GridPreferencePanelsValue.filters) {
        apiRef.current.hidePreferences();
      } else {
        apiRef.current.showPreferences(
          GridPreferencePanelsValue.filters, // @ts-ignore
          filterPanelId,
          filterButtonId
        );
      }
      buttonProps.onClick?.(event);
    };

    // Disable the button if the corresponding is disabled
    if (rootProps.disableColumnFilter) {
      return null;
    }

    // @ts-ignore
    const isOpen = preferencePanel.open && preferencePanel.panelId === filterPanelId;

    return (
      <rootProps.slots.baseTooltip
        title={tooltipContentNode}
        enterDelay={1000}
        {...other}
        {...rootProps.slotProps?.baseTooltip}
      >
        <IconButton
          ref={ref}
          id={filterButtonId}
          size='small'
          color='primary'
          aria-label={apiRef.current.getLocaleText('toolbarFiltersLabel')}
          aria-controls={isOpen ? filterPanelId : undefined}
          aria-expanded={isOpen}
          aria-haspopup
          // startIcon={
          //   <Badge badgeContent={activeFilters.length} color='primary'>
          //     <rootProps.slots.openFilterButtonIcon />
          //   </Badge>
          // }
          {...buttonProps}
          onClick={toggleFilter}
          {...rootProps.slotProps?.baseIconButton}
        >
          {/* {apiRef.current.getLocaleText('toolbarFilters')} */}
          <Badge badgeContent={activeFilters.length} color='primary'>
            <rootProps.slots.openFilterButtonIcon fontSize='inherit' />
          </Badge>
        </IconButton>
      </rootProps.slots.baseTooltip>
    );
  }
);

GridToolbarFilterIconButton.propTypes = {
  // ----------------------------- Warning --------------------------------
  // | These PropTypes are generated from the TypeScript type definitions |
  // | To update them edit the TypeScript types and run "yarn proptypes"  |
  // ----------------------------------------------------------------------
  /**
   * The props used for each slot inside.
   * @default {}
   */
  componentsProps: PropTypes.object,
} as any;

export { GridToolbarFilterIconButton };
