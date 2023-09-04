import { useFormikContext } from 'formik';
import { useEffect } from 'react';
import invariant from 'tiny-invariant';

import { useDialog } from 'hooks';

// CAUSES BUG:

export function UpdateDialogSubmitDisabled() {
  const formikContext = useFormikContext();
  const dialog = useDialog();

  invariant(formikContext, 'UpdateDialogSubmitDisabled must be withing formik form');
  invariant(dialog, 'UpdateDialogSubmitDisabled must be within DialogProvider');

  let { isValid, isSubmitting, isValidating } = formikContext;

  useEffect(() => {
    const disable = !isValid || isSubmitting || isValidating;
    // console.log('DISABLE: ', disable);
    // console.log('valid, sub, validating: ', isValid, isSubmitting, isValidating);
    if (disable !== dialog.submitDisabled) dialog?.setDisabled(disable);

    return () => dialog?.setDisabled(false);
  }, [isValid, isSubmitting, isValidating, dialog]);
  return null;
}
