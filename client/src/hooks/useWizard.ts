import { useContext } from 'react';

import { WizardContext, WizardValues } from 'context';

export const useWizard = () => {
  const context = useContext(WizardContext);

  if (!context) {
    throw Error('Wrap your step with `Wizard`');
  } else {
    return context as WizardValues;
  }
};
