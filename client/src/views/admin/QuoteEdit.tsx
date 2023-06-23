import React, { useCallback, useMemo } from 'react';
import { Box, Typography } from '@mui/material';
import { useParams } from 'react-router-dom';
import invariant from 'tiny-invariant';

import { useDocDataOnce } from 'hooks';
import { Quote } from 'common';
import { QuoteForm } from 'elements';
import { QuoteValues } from 'elements/QuoteForm';

export const QuoteEdit = () => {
  const { quoteId } = useParams();
  invariant(quoteId);
  const { data: quoteData } = useDocDataOnce<Quote>('QUOTES', quoteId, { suspense: true });
  // TODO: figure out how to get AALs for initialValues ??

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
      coordinates: {
        latitude: quoteData?.coordinates?.latitude || null,
        longitude: quoteData?.coordinates?.longitude || null,
      },
      limits: {
        limitA: quoteData?.limits.limitA ?? 250000,
        limitB: quoteData?.limits.limitB ?? 12500,
        limitC: quoteData?.limits.limitC ?? 68000,
        limitD: quoteData?.limits.limitD ?? 25000,
      },
      deductible: quoteData?.deductible ?? 1000,
      quoteExpirationDate: quoteData?.quoteExpirationDate?.toDate() || null, // TODO: delete ?? set on quote created
      effectiveExceptionRequested: quoteData?.effectiveExceptionRequested || false, // @ts-ignore
      effectiveDate: quoteData?.effectiveDate?.toDate() || null, // @ts-ignore
      expirationDate: quoteData?.expirationDate?.toDate() || null,
      fees: quoteData?.fees || [],
      taxes: quoteData?.taxes || [],
      annualPremium: quoteData?.annualPremium ?? null,
      subproducerCommission: quoteData?.subproducerCommission ?? 0.15,
      quoteTotal: null,
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

  const handleSubmit = useCallback(() => {
    alert('saving "edit quote" not implemented yet');
  }, []);

  if (!quoteData) throw new Error(`Quote not found with ID ${quoteId}`);

  return (
    <Box>
      <Typography variant='h5' color='warning.main' align='center' sx={{ py: 5 }}>
        {`TODO: Finish QuoteEdit Component (ID: ${quoteId})`}
      </Typography>
      <QuoteForm
        title='Edit Quote'
        onSubmit={handleSubmit}
        initialValues={initialValues}
        submissionId={quoteData.submissionId || null}
      />
    </Box>
  );
};
