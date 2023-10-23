import { isValid } from 'date-fns';
import { warn } from 'firebase-functions/logger';
import {
  AmendmentTransaction,
  DeepNullable,
  Limits,
  OffsetTransaction,
  PremiumTransaction,
  Product,
  RCVs,
  Transaction,
  TransactionType,
} from '../../common/index.js';
import { validateDeductible, validateLimits, validateRCVs } from '../../modules/rating/index.js';
import { verify } from '../../utils/index.js';

const trxTypes: TransactionType[] = [
  'amendment',
  'cancellation',
  'endorsement',
  'flat_cancel',
  'new',
  'reinstatement',
  'renewal',
];
const products: Product[] = ['flood', 'wind'];

export function validateTrxRow(data: DeepNullable<Omit<Transaction, 'metadata'>>): boolean {
  try {
    switch (data.trxInterfaceType) {
      case 'amendment':
        amendmentTrxValidation(data as DeepNullable<Omit<AmendmentTransaction, 'metadata'>>);
        break;
      case 'offset':
        offsetTrxValidation(data as DeepNullable<Omit<OffsetTransaction, 'metadata'>>);
        break;
      case 'premium':
        premiumTrxValidation(data as DeepNullable<Omit<PremiumTransaction, 'metadata'>>);
        break;
      default:
        throw new Error('trxInterfaceType not matched');
    }

    return true;
  } catch (err: any) {
    warn(err?.message || 'Validation failed');
    return false;
  }
}
// : asserts data is Omit<BaseTransaction, 'metadata'>
function commonTrxValidation(data: DeepNullable<Omit<Transaction, 'metadata'>>) {
  verify(data.trxType && trxTypes.includes(data.trxType), 'invalid trxType');
  verify(data.product && products.includes(data.product), 'invalid product');
  verify(data.policyId, 'invalid policyId');
  verify(data.locationId, 'invalid locationId');
  verify(data.term, 'term required');
  // @ts-ignore
  verify(data.bookingDate && isValid(data.bookingDate.toDate()), 'invalid booking date');
  // TODO: booking date validation (date range validation)
  verify(data.issuingCarrier, 'issuingCarrier required');
  verify(data.namedInsured, 'namedInsured required');
  verify(
    data.mailingAddress?.addressLine1 &&
      data.mailingAddress?.city &&
      data.mailingAddress.state &&
      data.mailingAddress?.postal,
    'mailing address required'
  );
  verify(data.homeState, 'homeState required');

  // @ts-ignore (DeepNullable bug)
  verify(data.trxEffDate && isValid(data.trxEffDate?.toDate()), 'invalid trxEffDate'); // @ts-ignore
  verify(data.trxExpDate && isValid(data.trxExpDate?.toDate()), 'invalid trxExpDate');
}

function amendmentTrxValidation(data: DeepNullable<Omit<AmendmentTransaction, 'metadata'>>) {
  commonTrxValidation(data);

  arrayOfStringsVal(data.otherInterestedParties, 'other parties must be an array');
  arrayOfStringsVal(data.additionalNamedInsured, 'additional insureds must be an array');
}

function commonOffsetAndPremiumTrxValidation(
  data: DeepNullable<Omit<OffsetTransaction | PremiumTransaction, 'metadata'>>
) {
  // TODO:
  // insuredLocation (limits, deductible, etc.) deductible required in offset ??

  verify(data.termPremium && typeof data.termPremium === 'number', 'term premium required');
  verify(data.netDWP && typeof data.netDWP === 'number', 'netDWP required');
  verify(data.MGACommission && typeof data.MGACommission === 'number', 'invalid MGA Commission');
  verify(
    data.MGACommissionPct && typeof data.MGACommissionPct === 'number',
    'invalid mga commission pct'
  );
  verify(
    data.MGACommissionPct > 0.05 && data.MGACommissionPct < 0.5,
    'invalid mga commission (outside range)'
  );

  verify(data.dailyPremium && typeof data.dailyPremium === 'number', 'invalid dailyPremium');
  verify(!data.netErrorAdj || typeof data.netErrorAdj === 'number', 'invalid netErrorAdj');

  verify(typeof data.surplusLinesTax === 'number', 'invalid surplusLinesTax');
  verify(typeof data.surplusLinesRegulatoryFee === 'number', 'invalid SL Regulatory Fee');
  verify(typeof data.MGAFee === 'number', 'invalid MGA Fee');
  verify(typeof data.inspectionFee === 'number', 'invalid inspectionFee');

  // TODO: validate sums (termPremium - mga === netDWP, etc.)
}

function offsetTrxValidation(
  data: DeepNullable<Omit<OffsetTransaction, 'metadata'>>
): asserts data is Omit<OffsetTransaction, 'metadata'> {
  commonTrxValidation(data);

  commonOffsetAndPremiumTrxValidation(data);

  verify(data.insuredLocation?.limits, 'missing location limits');
  validateLimits(data.insuredLocation?.limits as Limits);

  validateDeductible(data.insuredLocation?.deductible as number);
}

function premiumTrxValidation(
  data: DeepNullable<Omit<PremiumTransaction, 'metadata'>>
): asserts data is Omit<PremiumTransaction, 'metadata'> {
  commonTrxValidation(data);

  commonOffsetAndPremiumTrxValidation(data);

  validateRCVs(data.RCVs as RCVs);
  // premium calc data

  arrayOfStringsVal(data.otherInterestedParties, 'other parties must be an array');
  arrayOfStringsVal(data.additionalNamedInsured, 'additional insureds must be an array');

  verify(
    typeof data.premiumCalcData?.techPremium?.inland === 'number',
    'invalid inland tech premium'
  );
  verify(
    typeof data.premiumCalcData?.techPremium?.surge === 'number',
    'invalid surge tech premium'
  );
  verify(
    typeof data.premiumCalcData?.techPremium?.tsunami === 'number',
    'invalid tsunami tech premium'
  );

  verify(
    typeof data.premiumCalcData?.provisionalPremium === 'number',
    'invalid provisional premium'
  );
}

function arrayOfStringsVal(val: any, errMsg?: string) {
  verify(val && Array.isArray(val) && val.every((v) => typeof v === 'string'), errMsg);
}
