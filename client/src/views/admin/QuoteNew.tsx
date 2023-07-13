import { useCallback, useMemo } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { useNavigate, useParams } from 'react-router-dom';
import { useFirestore } from 'reactfire';
import { Box } from '@mui/material';
import { FormikHelpers } from 'formik';
import invariant from 'tiny-invariant';
import { add } from 'date-fns';

import { RatingInputsWithAAL, useAsyncToast, useCreateQuote, useDocDataOnce } from 'hooks';
import { Optional, SUBMISSION_STATUS, Submission, submissionsCollection } from 'common';
import { QuoteForm, QuoteValues, getRatingInputsFromSubmission } from 'elements/QuoteForm';
import { ADMIN_ROUTES, createPath } from 'router';

// TODO: decide whether to pass along submission data ??

interface QuoteNewProps {
  submissionId?: string | null | undefined;
  initialValues?: QuoteValues;
  submissionData?: Submission;
  initialRatingSnap?: Optional<RatingInputsWithAAL> | null | undefined;
}

export const QuoteNew = ({
  submissionId,
  initialValues,
  submissionData,
  initialRatingSnap,
}: QuoteNewProps) => {
  const firestore = useFirestore();
  const navigate = useNavigate();
  const toast = useAsyncToast();

  const createQuote = useCreateQuote(
    async () => {
      if (submissionId) {
        await updateDoc(doc(submissionsCollection(firestore), submissionId), {
          status: SUBMISSION_STATUS.QUOTED,
        });
      }
      navigate(createPath({ path: ADMIN_ROUTES.QUOTES }), { replace: true });
    },
    (msg: string) => toast.success(msg, { duration: 3000 }),
    (msg: string, err: any) => toast.error(msg)
  );

  const handleSubmit = useCallback(
    async (values: QuoteValues, { setSubmitting }: FormikHelpers<QuoteValues>) => {
      await createQuote(values, submissionId, submissionData);

      setSubmitting(false);
    },
    [createQuote, submissionId, submissionData]
  );

  return (
    <Box>
      <QuoteForm
        initialValues={initialValues}
        // submissionData={submissionData}
        initialRatingSnap={initialRatingSnap}
        onSubmit={handleSubmit}
        title='New Quote'
      />
    </Box>
  );
};

export const QuoteNewFromSub = () => {
  const { submissionId } = useParams();
  invariant(submissionId);
  const { data: submissionData } = useDocDataOnce<Submission>('SUBMISSIONS', submissionId);

  // TODO: note if RCV source is from user
  // @ts-ignore TODO: fix types (can't pass null to iMask component)
  const initialValues: QuoteValues = useMemo(
    () => ({
      address: submissionData?.address || {
        addressLine1: submissionData?.address?.addressLine1 ?? '',
        addressLine2: submissionData?.address?.addressLine2 ?? '',
        city: submissionData?.address?.city ?? '',
        state: submissionData?.address?.state ?? '',
        postal: submissionData?.address?.postal ?? '',
        countyName: submissionData?.address?.countyName ?? '',
        countyFIPS: submissionData?.address?.countyFIPS ?? '',
      },
      coordinates: {
        latitude: submissionData?.coordinates?.latitude || null,
        longitude: submissionData?.coordinates?.longitude || null,
      },
      homeState: submissionData?.address?.state || '',
      limits: {
        limitA: submissionData?.limits.limitA ?? 250000,
        limitB: submissionData?.limits.limitB ?? 12500,
        limitC: submissionData?.limits.limitC ?? 68000,
        limitD: submissionData?.limits.limitD ?? 25000,
      },
      deductible: submissionData?.deductible ?? 1000,
      effectiveExceptionRequested: false,
      effectiveDate: add(new Date(), { days: 15 }),
      expirationDate: add(new Date(), { days: 15, years: 1 }),
      fees: [],
      taxes: [],
      annualPremium: submissionData?.annualPremium ?? null,
      subproducerCommission: submissionData?.subproducerCommission ?? 0.15,
      quoteTotal: null,
      namedInsured: {
        firstName: submissionData?.contact?.firstName ?? '',
        lastName: submissionData?.contact?.lastName ?? '',
        email: submissionData?.contact?.email ?? '', // @ts-ignore
        phone: submissionData?.contact?.phone ?? '',
      },
      agent: {
        userId: submissionData?.agent?.userId || '',
        name: submissionData?.agent?.name || '',
        email: submissionData?.agent?.email || '',
        phone: submissionData?.agent?.phone || '',
      },
      agency: {
        orgId: submissionData?.agency?.orgId || '',
        name: submissionData?.agency?.name || '',
        address: submissionData?.agency?.address || '',
      },
      priorLossCount: submissionData?.priorLossCount || '',
      ratingPropertyData: {
        CBRSDesignation: submissionData?.ratingPropertyData?.CBRSDesignation ?? '',
        basement: `${submissionData?.ratingPropertyData?.basement ?? ''}`.toLowerCase(), // @ts-ignore
        distToCoastFeet: `${submissionData?.ratingPropertyData?.distToCoastFeet ?? ''}`, // submissionData?.distToCoastFeet ?? null,
        floodZone: submissionData?.ratingPropertyData?.floodZone ?? '',
        numStories: submissionData?.ratingPropertyData?.numStories ?? 1,
        propertyCode: `${submissionData?.ratingPropertyData?.propertyCode ?? ''}`,
        replacementCost: submissionData?.ratingPropertyData?.replacementCost ?? null, // @ts-ignore
        sqFootage: `${submissionData?.ratingPropertyData?.sqFootage ?? ''}`, // @ts-ignore submissionData?.sqFootage ?? null,
        yearBuilt: `${submissionData?.ratingPropertyData?.yearBuilt ?? ''}`, // submissionData?.yearBuilt ?? null,
      },
      ratingDocId: submissionData.ratingDocId || '',
      AAL: {
        inland: submissionData?.AAL?.inland ?? null,
        surge: submissionData?.AAL?.surge ?? null,
        tsunami: submissionData?.AAL?.tsunami ?? null,
      },
      notes: [],
    }),
    [submissionData]
  );

  const initialRatingSnap = useMemo(() => {
    if (!submissionData) return undefined;
    let partial = getRatingInputsFromSubmission(submissionData);
    return {
      ...partial,
      inlandAAL: submissionData?.AAL?.inland,
      surgeAAL: submissionData?.AAL?.surge,
      tsunamiAAL: submissionData?.AAL?.tsunami,
    };
  }, [submissionData]);

  return (
    <QuoteNew
      initialValues={initialValues}
      submissionData={submissionData}
      submissionId={submissionId}
      initialRatingSnap={initialRatingSnap}
    />
  );
};
