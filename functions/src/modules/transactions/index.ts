export { formatPremiumTrx } from './formatPremiumTrx';
export { getLocationAmendmentTrx } from './getLocationAmendmentTrx';
export { getOffsetTrx } from './getOffsetTrx';
export { getPolicyAmendmentTrx } from './getPolicyAmendmentTrx';
export { getReinstatementTrx } from './getReinstatementTrx';
export { handleCancelRating } from './handleCancelRating';
export { handleRatingForEndorsement, setChangeRequestErr } from './handleEndorsementRating';
export * from './taxes';
export * from './utils';

// trxEffDates:
//    - policy amendment: user
//    - location amendment: user
//    - renewal: location effective date
//    - new: location effective date
//    - cancel: cancellation date
//    - endorsement offset trx: current date
//    - endorsement trx: user, subject to 15 day validation
//    - reinstatement - eff date = cancellation date of previous trx
//        - term premium = daily prem * (exp. date - cancellation date (ie trxEffDate))
