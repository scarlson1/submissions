import { useCallback, useRef } from 'react';
import { Firestore, Timestamp, addDoc, doc, getDoc } from 'firebase/firestore';
import { useFirestore } from 'reactfire';
import { FormikHelpers, FormikProps } from 'formik';

import { useAuth, useDialog } from 'context';
import { PolicyChangeForm, PolicyChangeValues } from 'elements/forms/PolicyChangeForm';
import {
  CHANGE_REQUEST_STATUS,
  ChangeRequest,
  changeReqestsCollection,
  policiesCollection,
} from 'common';
import { useAsyncToast } from './useAsyncToast';
import { getDifference } from 'modules/utils';
import { pick } from 'lodash';

// TODO: maybe add some sort of config to the Policy interface
//    - trxType value associated with changes to a field ??

export const useCreateChangeRequest = (
  onSuccess?: (docIds: string[]) => void,
  onError?: (msg: string, err: any) => void
) => {
  const firestore = useFirestore();
  const { user } = useAuth();
  const dialog = useDialog();
  const toast = useAsyncToast();
  const formikRef = useRef<FormikProps<PolicyChangeValues>>(null);

  const triggerSubmit = useCallback(async () => {
    console.log('submitting form...');
    await formikRef.current?.submitForm();
  }, []);

  // TODO: We can save the values in submit handler (don't need to return new values from dialog)
  const handleSubmit = useCallback(
    async (values: PolicyChangeValues, { setSubmitting }: FormikHelpers<PolicyChangeValues>) => {
      try {
        console.log('on submit called...', values);

        setSubmitting(false);
        dialog?.handleAccept(values);
        return values;
      } catch (err: any) {
        console.log('err submitting form: ', err);
      }
    },
    [dialog]
  );

  const policyChangeRequest = useCallback(
    async (policyId: string) => {
      try {
        const policy = await fetchPolicy(firestore, policyId);
        let initialValues: PolicyChangeValues = {
          namedInsured: {
            displayName: policy?.namedInsured?.displayName || '',
            email: policy?.namedInsured?.email || '',
            phone: policy?.namedInsured?.phone || '',
          },
          mailingAddress: {
            addressLine1: policy?.mailingAddress?.addressLine1 || '',
            addressLine2: policy?.mailingAddress?.addressLine2 || '',
            city: policy?.mailingAddress?.city || '',
            state: policy?.mailingAddress?.state || '',
            postal: policy?.mailingAddress?.postal || '',
          },
          homeState: policy?.homeState || '',
          effectiveDate: policy.effectiveDate?.toDate() || null,
          expirationDate: policy.expirationDate?.toDate() || null,
          requestEffDate: new Date(),
        };
        console.log('INITIAL VALUES: ', initialValues);

        const newValues = await dialog?.prompt({
          variant: 'danger',
          onSubmit: triggerSubmit,
          catchOnCancel: true,
          title: 'Policy change request',
          // description: ''
          content: (
            <PolicyChangeForm
              initialValues={initialValues}
              formRef={formikRef}
              onSubmit={handleSubmit}
            />
          ),
          slotProps: { dialog: { maxWidth: 'md' }, acceptButton: { variant: 'contained' } },
        });

        let requestEffDate = Timestamp.fromDate(newValues.requestEffDate);

        delete newValues.requestEffDate;
        let { requestEffDate: reqEffDate, ...initVals } = initialValues;

        const changes = formatChanges(newValues, initVals);

        console.log('DIFF: ', changes);

        const requiresEndorsement = isEndorsement(changes);
        const requiresAmendment = isAmendment(changes);
        console.log('requires (end / amd): ', requiresEndorsement, requiresAmendment);
        if (!(requiresEndorsement || requiresAmendment)) throw new Error('no changes detected');

        const common: Omit<ChangeRequest, 'changes' | 'trxType'> = {
          requestEffDate,
          policyId,
          locationId: null,
          externalId: null,
          userId: policy.userId || '', // user?.uid || '',
          agent: {
            userId: policy.agent.userId || null,
          },
          agency: {
            orgId: policy.agency.orgId || null,
          },
          status: CHANGE_REQUEST_STATUS.SUBMITTED,
          submittedBy: {
            userId: user?.uid || null,
            displayName: user?.displayName || '',
          },
          metadata: {
            created: Timestamp.now(),
            updated: Timestamp.now(),
          },
        };

        toast.loading('saving...');
        const colRef = changeReqestsCollection(firestore, policyId);
        const docIds = [];

        if (requiresEndorsement) {
          let endorsementChanges: ChangeRequest['changes'] = {};
          if (changes.effectiveDate)
            endorsementChanges['effectiveDate'] = Timestamp.fromDate(newValues.effectiveDate);
          if (changes.expirationDate)
            endorsementChanges['expirationDate'] = Timestamp.fromDate(newValues.expirationDate);
          console.log('endorsement changes: ', endorsementChanges);

          const changeRequestJson: ChangeRequest = {
            ...common,
            trxType: 'endorsement',
            changes: endorsementChanges,
          };

          let endorsementDocRef = await addDoc(colRef, { ...changeRequestJson });
          docIds.push(endorsementDocRef.id);
        }

        if (requiresAmendment) {
          let amendmentChanges = pick(changes, ['namedInsured', 'mailingAddress', 'homeState']);
          console.log('amendment changes: ', amendmentChanges);

          const changeRequestJson: ChangeRequest = {
            ...common,
            trxType: 'amendment',
            changes: amendmentChanges,
          };

          let amendmentDocRef = await addDoc(colRef, { ...changeRequestJson });
          docIds.push(amendmentDocRef.id);
        }

        toast.success('change request saved');
        if (onSuccess) onSuccess(docIds);
      } catch (err: any) {
        let msg = 'error creating change request';
        if (err?.message) msg = err.message;
        if (onError && err) onError(msg, err);
      }
    },
    [onSuccess, onError, dialog, user, firestore, toast, handleSubmit, triggerSubmit]
  );

  // const locationChangeRequest (separate hook ??)

  return policyChangeRequest;
};

// TODO: generalize function (pass in doc ref) (id doc(policiesCollection(db), policyId))
async function fetchPolicy(db: Firestore, policyId: string) {
  const snap = await getDoc(doc(policiesCollection(db), policyId));
  const data = snap.data();
  if (!(snap.exists() && data)) throw new Error(`policy not found`);
  return data;
}

function formatChanges(
  newValues: Omit<PolicyChangeValues, 'requestEffDate'>,
  initialValues: Omit<PolicyChangeValues, 'requestEffDate'>
): ChangeRequest['changes'] {
  return getDifference(initialValues, newValues);
}

const endorsementFields = ['effectiveDate', 'expirationDate'];

// function getPolicyTrxType(changes: ChangeRequest['changes']): TransactionType {
//   let k = Object.keys(changes);
//   const isAmendment = k.every((val) => {
//     return endorsementFields.indexOf(val) !== -1;
//   });
//   return isAmendment ? 'amendment' : 'endorsement';
// }

// if one key matches, "every" returns false
function isEndorsement(changes: ChangeRequest['changes']) {
  return !Object.keys(changes).every((k) => endorsementFields.indexOf(k) !== -1);
}

const amendmentKeys = ['namedInsured', 'mailingAddress', 'homeState'];
function isAmendment(changes: ChangeRequest['changes']) {
  return !Object.keys(changes).every((k) => amendmentKeys.indexOf(k) !== -1);
}
