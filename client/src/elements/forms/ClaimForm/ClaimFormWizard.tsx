import { setDoc } from 'firebase/firestore';
import { FormikConfig } from 'formik';
import { useCallback } from 'react';
import toast from 'react-hot-toast';
import { useFirestoreDocData } from 'reactfire';

import { DraftPolicyClaim, OptionalKeys, PolicyClaimFormValues, PreferredMethod } from 'common';
import { Wizard } from 'components/forms';
import { createClaim } from 'modules/db';
import { ContactStep, ContactValues } from './ContactStep';
import { DateStep, DateValues, FirestoreDateValues } from './DateStep';
import { DescriptionStep, DescriptionValues } from './DescriptionStep';
import { ImageValues, ImagesStep } from './ImagesStep';
import { ReviewStep } from './ReviewStep';
import { SuccessStep } from './SuccessStep';

export type ClaimValues = DateValues & DescriptionValues & ImageValues & ContactValues;
export type FirestoreClaimsValues = Omit<ClaimValues, 'occurrenceDate'> & FirestoreDateValues;

export interface BaseStepProps<T> extends Omit<FormikConfig<T>, 'onSubmit'> {
  saveFormValues: (values: T) => Promise<void>;
  onError?: (msg: string) => void;
}

// TODO: consider better solution to nav buttons
// (pass as footer, but need ability to disable if form is invalid)

// remove extends ?? not using anywhere ?? (and will override  most of the important props anyway)
interface ClaimFormWizardProps
  extends OptionalKeys<FormikConfig<ClaimValues>, 'initialValues' | 'onSubmit'> {
  claimResource: ReturnType<typeof createClaim>;
}

export const ClaimFormWizard = ({ claimResource }: ClaimFormWizardProps) => {
  const claimRef = claimResource.read();
  const { data } = useFirestoreDocData<Partial<DraftPolicyClaim>>(claimRef);
  if (!data.policyId) throw new Error('claim missing policyId');

  const saveValues = useCallback(
    async (values: Partial<PolicyClaimFormValues>) => {
      // FirestoreDateValues | DescriptionValues | ImageValues | ContactValues
      // TODO: save claim form values
      await setDoc(claimRef, values, { merge: true });
    },
    [claimRef]
  );

  const handleError = useCallback((msg: string) => toast.error(msg), []);

  // useEffect(() => {
  //   console.log('Data: ', data);
  // }, [data]);

  return (
    <Wizard>
      <DateStep
        // @ts-ignore
        saveFormValues={saveValues}
        onError={handleError}
        initialValues={{
          occurrenceDate: data.occurrenceDate ? data.occurrenceDate.toDate() : null,
        }}
      />
      <DescriptionStep
        saveFormValues={saveValues}
        onError={handleError}
        initialValues={{ description: data.description || '' }}
      />
      <ImagesStep
        saveFormValues={saveValues}
        onError={handleError}
        claimData={data}
        claimId={claimRef.id}
      />
      <ContactStep
        saveFormValues={saveValues}
        onError={handleError}
        initialValues={{
          contact: {
            firstName: data?.contact?.firstName || '', // TODO: default to named insured on policy ?? or signed in user ??
            lastName: data?.contact?.lastName || '',
            email: data?.contact?.email || '',
            phone: data?.contact?.phone || '',
            preferredMethod: (data?.contact?.preferredMethod || '') as PreferredMethod,
          },
        }}
      />
      <ReviewStep claim={data} onError={handleError} />
      <SuccessStep claimId={claimRef.id} policyId={data.policyId} />
    </Wizard>
  );
};
