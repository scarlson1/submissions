import { getPanelId, getTabId, useToggleContext } from 'context';
import { ReactNode, forwardRef } from 'react';
// MUI tab panel ref: https://github.com/mui/material-ui/blob/master/packages/mui-lab/src/TabPanel/TabPanel.js

interface TogglePanelProps {
  children: ReactNode;
  value: string;
}

// TODO: generic TogglePanelProps ??: https://fettblog.eu/typescript-react-generic-forward-refs/#option-2%3A-create-a-custom-ref-%2F-the-wrapper-component

export const ToggleViewPanel = forwardRef<HTMLDivElement, TogglePanelProps>(
  function ToggleViewPanel({ value, children, ...other }, ref) {
    const context = useToggleContext();

    const id = getPanelId(context, value);
    const tabId = getTabId(context, value);

    return (
      <div
        aria-labelledby={tabId || undefined}
        hidden={value !== context.value}
        id={id || undefined}
        ref={ref}
        {...other}
      >
        {context.value === value && children}
      </div>
    );
  }
);

// const TabPanel = React.forwardRef(function TabPanel(inProps, ref) {
//   const props = useThemeProps({ props: inProps, name: 'MuiTabPanel' });

//   const { children, className, value, ...other } = props;

//   const ownerState = {
//     ...props,
//   };

//   const classes = useUtilityClasses(ownerState);

//   const context = useTabContext();
//   if (context === null) {
//     throw new TypeError('No TabContext provided');
//   }
//   const id = getPanelId(context, value);
//   const tabId = getTabId(context, value);

//   return (
//     <TabPanelRoot
//       aria-labelledby={tabId}
//       className={clsx(classes.root, className)}
//       hidden={value !== context.value}
//       id={id}
//       ref={ref}
//       role='tabpanel'
//       ownerState={ownerState}
//       {...other}
//     >
//       {value === context.value && children}
//     </TabPanelRoot>
//   );
// });
