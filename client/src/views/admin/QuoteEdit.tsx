import { useCallback, useMemo } from 'react';
import { Box } from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import invariant from 'tiny-invariant';
import { useFirestore, useSigninCheck } from 'reactfire';
import {
  // FieldValue,
  GeoPoint,
  Timestamp,
  doc,
  setDoc,
} from 'firebase/firestore';
import { FormikHelpers } from 'formik';
import { endOfToday, isValid, startOfDay } from 'date-fns';
import { round } from 'lodash';

import { useAsyncToast, useDocDataOnce } from 'hooks';
import { QUOTE_STATUS, Quote, quotesCollection } from 'common';
import { QuoteForm } from 'elements';
import { QuoteValues } from 'elements/QuoteForm';
import { CUSTOM_CLAIMS } from 'modules/components';
import { ADMIN_ROUTES, createPath } from 'router';
import { addToDate, extractNumber } from 'modules/utils';
import { CARD_FEE_RATE } from 'hooks/useCreateQuote';

const useEditQuote = (
  quoteId: string,
  onSuccess?: () => void,
  onError?: (msg: string, err: any) => void
) => {
  const { data: authCheckResult } = useSigninCheck({
    requiredClaims: { [CUSTOM_CLAIMS.IDEMAND_ADMIN]: true },
  });
  const firestore = useFirestore();
  const quotesColRef = quotesCollection(firestore);

  const editQuote = useCallback(
    async (newValues: QuoteValues) => {
      try {
        invariant(authCheckResult.hasRequiredClaims, 'missing admin permissions');
        invariant(newValues.quoteTotal, 'missing quote total');
        invariant(newValues.annualPremium, 'missing annual premium');
        invariant(
          newValues.namedInsured?.email || newValues.agent?.email,
          'Must have at least one email (insured or agent)'
        );
        invariant(isValid(newValues.effectiveDate), 'Invalid effective date');

        let effDateStartOfDay = startOfDay(newValues.effectiveDate);
        let expDateStartOfDay = addToDate({ years: 1 }, effDateStartOfDay);

        let numTaxes = newValues?.taxes?.map((t) => ({
          ...t,
          value: extractNumber(`${t.value}`) ?? null,
          rate: extractNumber(`${t.rate}`) ?? null,
        }));

        let quoteRef = doc(quotesColRef, quoteId);
        // TODO: validation
        let quoteUpdates: Partial<Quote> = {
          // @ts-ignore
          product: newValues?.product || 'flood',
          address: newValues?.address,
          // TODO: add homestate to the form
          homeState: newValues?.homeState,
          coordinates:
            newValues.coordinates?.longitude && newValues.coordinates?.latitude
              ? new GeoPoint(newValues.coordinates.latitude, newValues.coordinates.longitude)
              : null,
          limits: newValues?.limits,
          deductible: newValues?.deductible,
          fees: newValues?.fees || [],
          taxes: numTaxes || [], //  newValues?.taxes || [], // @ts-ignore
          // TODO: create type wrapping Qutoe with annPrem as optional
          annualPremium: newValues.annualPremium,
          subproducerCommission: newValues?.subproducerCommission,
          cardFee: round(newValues.quoteTotal * CARD_FEE_RATE, 2),
          quoteTotal: round(newValues.quoteTotal, 2),
          mailingAddress: {
            // TODO: add mailing address and name fields
            name: '',
            ...newValues?.address,
          },
          quoteExpirationDate: newValues?.quoteExpirationDate
            ? Timestamp.fromDate(newValues.quoteExpirationDate)
            : Timestamp.fromDate(addToDate({ days: 60 }, endOfToday())),
          effectiveDate: Timestamp.fromDate(effDateStartOfDay),
          expirationDate: Timestamp.fromDate(expDateStartOfDay),
          namedInsured: newValues?.namedInsured,
          agent: newValues?.agent,
          agency: {
            orgId: newValues?.agency?.orgId || null,
            name: newValues?.agency?.name || null,
            address: newValues?.agency?.address || null,
          },
          userId: newValues?.namedInsured?.userId || null,
          status: QUOTE_STATUS.AWAITING_USER,
          ratingPropertyData: {
            CBRSDesignation: newValues.ratingPropertyData.CBRSDesignation,
            basement: newValues.ratingPropertyData.basement,
            distToCoastFeet: extractNumber(`${newValues.ratingPropertyData.distToCoastFeet}`),
            floodZone: newValues.ratingPropertyData.floodZone,
            numStories: newValues.ratingPropertyData.numStories,
            propertyCode: newValues.ratingPropertyData.propertyCode,
            replacementCost: newValues.ratingPropertyData.replacementCost,
            sqFootage: extractNumber(`${newValues.ratingPropertyData.sqFootage}`),
            yearBuilt: extractNumber(`${newValues.ratingPropertyData.yearBuilt}`),
          },
          notes:
            newValues.notes && newValues.notes.length > 0
              ? newValues.notes
                  .filter((n) => n.note)
                  .map((n) => ({
                    note: n.note,
                    created: Timestamp.now(),
                    userId: authCheckResult?.user?.uid || null,
                  }))
              : [],
          // @ts-ignore
          'metadata.updated': Timestamp.now(),
          // TODO: increment version
          // 'metadata.version': FieldValue.increment(1)
        };
        await setDoc(quoteRef, quoteUpdates, { merge: true });

        if (onSuccess) onSuccess();
      } catch (err: any) {
        let msg = 'Error updating quote';
        if (err.message) msg = err.message.replace('Invariant failed: ', '');
        if (onError) onError(msg, err);
      }
    },
    [quoteId, quotesColRef, authCheckResult, onSuccess, onError]
  );

  return editQuote;
};

export const QuoteEdit = () => {
  const { quoteId } = useParams();
  const navigate = useNavigate();
  const toast = useAsyncToast();
  invariant(quoteId);

  const { data: quoteData } = useDocDataOnce<Quote>('QUOTES', quoteId, { suspense: true });

  const editQuote = useEditQuote(
    quoteId,
    () => {
      toast.success('quote saved!');
      navigate(createPath({ path: ADMIN_ROUTES.QUOTES }));
    },
    (msg: string, err: any) => toast.error(msg)
  );
  // TODO: figure out how to get AALs for initialValues ??
  // TODO: need to get rating doc from submission (use rxjs combined observable ??)

  // @ts-ignore
  const initialValues: QuoteValues = useMemo(
    () => ({
      address: quoteData?.address || {
        addressLine1: quoteData?.address?.addressLine1 ?? '',
        addressLine2: quoteData?.address?.addressLine2 ?? '',
        city: quoteData?.address?.city ?? '',
        state: quoteData?.address?.state ?? '',
        postal: quoteData?.address?.postal ?? '',
        countyName: quoteData?.address?.countyName ?? '',
        countyFIPS: quoteData?.address?.countyFIPS ?? '',
      },
      homeState: quoteData?.homeState || '',
      coordinates: {
        latitude: quoteData?.coordinates?.latitude || null,
        longitude: quoteData?.coordinates?.longitude || null,
      },
      limits: {
        limitA: quoteData?.limits?.limitA ?? 250000,
        limitB: quoteData?.limits?.limitB ?? 12500,
        limitC: quoteData?.limits?.limitC ?? 68000,
        limitD: quoteData?.limits?.limitD ?? 25000,
      },
      deductible: quoteData?.deductible ?? 1000,
      quoteExpirationDate: quoteData?.quoteExpirationDate?.toDate() || null, // TODO: delete ?? set on quote created
      effectiveExceptionRequested: quoteData?.effectiveExceptionRequested || false, // @ts-ignore
      effectiveDate: quoteData?.effectiveDate?.toDate() || null, // @ts-ignore
      expirationDate: quoteData?.expirationDate?.toDate() || null,
      fees:
        quoteData?.fees?.map((f) => ({
          ...f,
          value: `${f.feeValue ?? ''}`,
        })) || [],
      taxes:
        quoteData?.taxes?.map((t) => ({
          ...t,
          value: `${t.value ?? ''}`,
          rate: `${t.rate ?? ''}`,
        })) || [],
      annualPremium: quoteData?.annualPremium ?? null,
      subproducerCommission: quoteData?.subproducerCommission ?? 0.15,
      quoteTotal: quoteData?.quoteTotal ?? null,
      namedInsured: {
        firstName: quoteData?.namedInsured?.firstName ?? '',
        lastName: quoteData?.namedInsured?.lastName ?? '',
        email: quoteData?.namedInsured?.email ?? '',
        phone: quoteData?.namedInsured?.phone ?? '',
      },
      agent: {
        userId: quoteData?.agent?.userId || '',
        name: quoteData?.agent?.name || '',
        email: quoteData?.agent?.email || '',
        phone: quoteData?.agent?.phone || '',
      },
      agency: {
        orgId: quoteData?.agency?.orgId || '',
        name: quoteData?.agency?.name || '',
        address: quoteData?.agency?.address || {
          addressLine1: '',
          addressLine2: '',
          city: '',
          state: '',
          postal: '',
        },
      },
      // @ts-ignore
      priorLossCount: quoteData?.priorLossCount ?? '',
      ratingPropertyData: {
        CBRSDesignation: quoteData?.ratingPropertyData?.CBRSDesignation ?? '',
        basement: `${quoteData?.ratingPropertyData?.basement ?? ''}`.toLowerCase(), // @ts-ignore
        distToCoastFeet: `${quoteData?.ratingPropertyData?.distToCoastFeet ?? ''}`, // submissionData?.distToCoastFeet ?? null,
        floodZone: quoteData?.ratingPropertyData?.floodZone ?? '',
        numStories: quoteData?.ratingPropertyData?.numStories ?? 1,
        propertyCode: `${quoteData?.ratingPropertyData?.propertyCode ?? ''}`,
        replacementCost: quoteData?.ratingPropertyData?.replacementCost ?? null, // @ts-ignore
        sqFootage: `${quoteData?.ratingPropertyData?.sqFootage ?? ''}`, // @ts-ignore submissionData?.sqFootage ?? null,
        yearBuilt: `${quoteData?.ratingPropertyData?.yearBuilt ?? ''}`, // submissionData?.yearBuilt ?? null,
      },
      AAL: {
        inland: null,
        surge: null,
        tsunami: null,
      },
      notes: quoteData?.notes?.map((n) => n.note) || [],
    }),
    [quoteData]
  );

  const initialRatingSnap = useMemo(() => {
    if (!quoteData) return undefined;
    return getRatingInputsFromQuote(quoteData);
  }, [quoteData]);

  const handleSubmit = useCallback(
    async (values: QuoteValues, { setSubmitting }: FormikHelpers<QuoteValues>) => {
      await editQuote(values);
      setSubmitting(false);
    },
    [editQuote]
  );

  if (!quoteData) throw new Error(`Quote not found with ID ${quoteId}`);

  return (
    <Box>
      {/* <Typography variant='h5' color='warning.main' align='center' sx={{ py: 5 }}>
        {`TODO: Finish QuoteEdit Component (ID: ${quoteId})`}
      </Typography> */}
      <QuoteForm
        title='Edit Quote'
        onSubmit={handleSubmit}
        initialValues={initialValues}
        submissionId={quoteData.submissionId || null}
        initialRatingSnap={initialRatingSnap}
      />
    </Box>
  );
};

function getRatingInputsFromQuote(data: Partial<Quote> | null) {
  return {
    latitude: data?.coordinates?.latitude,
    longitude: data?.coordinates?.longitude,
    replacementCost: data?.ratingPropertyData?.replacementCost,
    limitA: data?.limits?.limitA,
    limitB: data?.limits?.limitB,
    limitC: data?.limits?.limitC,
    limitD: data?.limits?.limitD,
    deductible: data?.deductible,
    numStories: data?.ratingPropertyData?.numStories,
    // priorLossCount: data?.ratingPropertyData.priorLossCount, // data.priorLossCount,
    state: data?.address?.state,
    floodZone: data?.ratingPropertyData?.floodZone,
    basement: data?.ratingPropertyData?.basement?.toLowerCase(),
    commissionPct: data?.subproducerCommission || 0.15, // TODO: delete - must look up subproducer comm from agent ID or org ID from server, or producer from clinet if idemand admin
    // TODO: need to get rating doc from submission (use rxjs combined observable ??)
    // @ts-ignore
    inlandAAL: data?.AAL?.inland, // @ts-ignore
    surgeAAL: data?.AAL?.surge, // @ts-ignore
    tsunamiAAL: data?.AAL?.tsunami,
  };
}
