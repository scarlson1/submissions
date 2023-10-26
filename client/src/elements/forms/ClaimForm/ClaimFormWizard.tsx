import { setDoc } from 'firebase/firestore';
import { FormikConfig } from 'formik';
import { useCallback, useEffect } from 'react';
import { useFirestoreDocData } from 'reactfire';

import { DraftPolicyClaim, OptionalKeys } from 'common';
import { Wizard } from 'components/forms';
import { createClaim } from 'modules/db';
import { Header } from '../AddLocation/Header';
import { ContactStep, ContactValues } from './ContactStep';
import { DateStep, DateValues, FirestoreDateValues } from './DateStep';
import { DescriptionStep, DescriptionValues } from './DescriptionStep';
import { ImageValues, ImagesStep } from './ImagesStep';

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

  const saveValues = useCallback(
    async (values: FirestoreDateValues | DescriptionValues | ImageValues | ContactValues) => {
      // TODO: save claim form values
      await setDoc(claimRef, values, { merge: true });
    },
    [claimRef]
  );

  useEffect(() => {
    console.log('Data: ', data);
  }, [data]);

  return (
    <Wizard header={<Header title='New Claim' />}>
      <DateStep
        // @ts-ignore
        saveFormValues={saveValues}
        initialValues={{
          occurrenceDate: data.occurrenceDate ? data.occurrenceDate.toDate() : null,
        }}
      />
      <DescriptionStep
        saveFormValues={saveValues}
        initialValues={{ description: data.description || '' }}
      />
      <ImagesStep saveFormValues={saveValues} claimData={data} claimId={claimRef.id} />
      <ContactStep
        saveFormValues={saveValues}
        initialValues={{
          contact: {
            firstName: data?.contact?.firstName || '', // TODO: default to named insured on policy ?? or signed in user ??
            lastName: data?.contact?.lastName || '',
            email: data?.contact?.email || '',
            phone: data?.contact?.phone || '',
            preferredMethod: data?.contact?.preferredMethod || '',
          },
        }}
      />
    </Wizard>
  );
};
