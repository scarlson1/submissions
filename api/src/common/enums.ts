export enum COLLECTIONS {
  SURPLUS_LINES_TAXES = 'surplusLinesTaxes',
  MORATORIUMS = 'moratoriums',
  LICENSES = 'licenses',
  USERS = 'users',
  SR_RES = 'swissReRes',
}

export enum SUBJECT_BASE {
  PREMIUM = 'premium',
  PREMIUM_AND_FEES = 'premium_and_fees',
  OUTSTATE_PREMIUM_AND_FEES = 'outstate_premium_and_fees',
  PREMIUM_AND_INSPECTION = 'premium_and_inspection',
  FLAT_DOLLAR = 'flat_dollar',
}

export enum ROUNDING_TYPE {
  NEAREST = 'nearest',
  UP = 'up',
  DOWN = 'down',
}
