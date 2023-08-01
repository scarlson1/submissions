import { useCallback } from 'react';

import { AddPaymentMethodValues } from 'elements/forms/AddPaymentDialog';
import { ePayInstance, verifyEPayToken, VerifyEPayTokenResponse } from 'api';
import { useAsyncToast } from './useAsyncToast';
import { getFunctions } from 'firebase/functions';

export const useVerifyPaymentMethod = (
  onSuccess?: (data: VerifyEPayTokenResponse) => void,
  onError?: (msg: string, err?: unknown) => void
) => {
  const toast = useAsyncToast();

  const exchangeForToken = useCallback(async (tokenReqModel: any) => {
    let {
      headers: { location },
    } = await ePayInstance.post('/api/v1/tokens', {
      ...tokenReqModel,
    });
    let tokenId = location?.split('/')[2];

    if (!tokenId) {
      throw new Error('Error generating payment token');
    }
    return tokenId;
  }, []);

  const verifyToken = useCallback(async (tokenId: string, accountHolder: string) => {
    const { data } = await verifyEPayToken(getFunctions(), {
      tokenId,
      accountHolder,
    });
    // console.log('TOKEN DATA => ', data);

    if (!data.id) {
      console.log('TOKEN VERIFICATION FAILED');
      throw new Error("Something went wrong. We're unable to verify the payment method.");
    } else {
      return data;
    }
  }, []);

  const verifyPmtMethod = useCallback(
    async (values: AddPaymentMethodValues) => {
      try {
        let tokenReqModel = null;
        let cardExpArray = values.cardExpDate.split('/');
        let expMonth = cardExpArray[0].length === 1 ? `0${cardExpArray[0]}` : cardExpArray[0];
        if (values.cardPaymentMethod) {
          tokenReqModel = {
            payer: values.payerName,
            emailAddress: values.payerEmail,
            creditCardInformation: {
              accountHolder: values.accountHolder,
              cardNumber: values.cardNumber,
              cvc: values.cvc,
              month: expMonth,
              year: parseInt(`20${values.cardExpDate.slice(-2)}`),
              postalCode: values.postalCode,
            },
          };
        } else {
          tokenReqModel = {
            payer: values.payerName,
            emailAddress: values.payerEmail,
            bankAccountInformation: {
              accountHolder: values.accountHolder,
              accountType: values.accountType,
              routingNumber: values.routingNumber,
              accountNumber: values.accountNumber,
            },
          };
        }

        toast.loading('Securing payment method...');
        const tokenId = await exchangeForToken(tokenReqModel);

        toast.updateLoadingMsg('Verifying payment method...');
        const res = await verifyToken(tokenId, values.accountHolder);

        toast.success(`Payment method added! (${res.maskedAccountNumber.replaceAll('X', '*')})`);
        if (onSuccess) onSuccess(res);

        return res;
      } catch (err: any) {
        console.log('ERROR: ', err);
        const msg =
          err && err.message
            ? err.message
            : 'Unable to add payment method. See console for details.';

        toast.error(msg);
        if (onError) onError(msg);
      }
    },
    [onSuccess, onError, exchangeForToken, verifyToken, toast]
  );

  return verifyPmtMethod;
};
