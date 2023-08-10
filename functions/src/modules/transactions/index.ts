export * from './utils';
export { formatPremiumTrx } from './formatPremiumTrx';
export { getOffsetTrx } from './getOffsetTrx';
export { getReinstatementTrx } from './getReinstatementTrx';
export { getLocationAmendmentTrx } from './getLocationAmendmentTrx';
export { getPolicyAmendmentTrx } from './getPolicyAmendmentTrx';

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
