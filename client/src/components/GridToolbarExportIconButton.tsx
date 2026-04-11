import { SaveAltRounded } from '@mui/icons-material';
import {
  IconButton,
  IconButtonProps,
  MenuList,
  useForkRef,
} from '@mui/material';
import useId from '@mui/material/utils/useId';
import {
  gridClasses,
  GridMenu,
  useGridApiContext,
  useGridRootProps,
} from '@mui/x-data-grid';
import { isHideMenuKey, isTabKey } from '@mui/x-data-grid/utils/keyboardUtils';
import {
  Children,
  cloneElement,
  forwardRef,
  isValidElement,
  useRef,
  useState,
} from 'react';

// TODO: delete - exporting from server data, not grid

export const GridToolbarExportIconButton = forwardRef<
  HTMLButtonElement,
  IconButtonProps
>(function GridToolbarExportContainer(props, ref) {
  const { children, onClick, ...other } = props;

  const apiRef = useGridApiContext();
  const rootProps = useGridRootProps();
  const exportButtonId = useId();
  const exportMenuId = useId();

  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const handleRef = useForkRef(ref, buttonRef);

  const handleMenuOpen = (event: React.MouseEvent<HTMLButtonElement>) => {
    setOpen((prevOpen) => !prevOpen);
    onClick?.(event);
  };

  const handleMenuClose = () => setOpen(false);

  const handleListKeyDown = (event: React.KeyboardEvent) => {
    if (isTabKey(event.key)) {
      event.preventDefault();
    }
    if (isHideMenuKey(event.key)) {
      handleMenuClose();
    }
  };

  const handleMenuClickAway = (event) => {
    // : GridMenuProps['onClickAway']
    if (
      buttonRef.current === event.target ||
      // if user clicked on the icon
      buttonRef.current?.contains(event.target as Element)
    ) {
      return;
    }
    setOpen(false);
  };

  if (children == null) {
    return null;
  }

  return (
    <>
      <IconButton
        ref={handleRef}
        size='small'
        color='primary'
        aria-expanded={open}
        aria-label={apiRef.current.getLocaleText('toolbarExportLabel')}
        aria-haspopup='menu'
        aria-controls={open ? exportMenuId : undefined}
        id={exportButtonId}
        {...other}
        onClick={handleMenuOpen}
        {...rootProps.slotProps?.baseIconButton}
      >
        <SaveAltRounded fontSize='inherit' />
      </IconButton>
      <GridMenu
        open={open}
        target={buttonRef.current}
        onClickAway={handleMenuClickAway}
        onClose={() => {}}
        position='bottom-start'
      >
        <MenuList
          id={exportMenuId}
          className={gridClasses.menuList}
          aria-labelledby={exportButtonId}
          onKeyDown={handleListKeyDown}
          autoFocusItem={open}
        >
          {Children.map(children, (child) => {
            if (!isValidElement(child)) {
              return child;
            }
            return cloneElement<any>(child, { hideMenu: handleMenuClose });
          })}
        </MenuList>
      </GridMenu>
    </>
  );
});
