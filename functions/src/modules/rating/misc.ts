export function getCarrierByState(state: string) {
  switch (state) {
    case 'CA':
    case 'NY':
      return 'Rockingham Insurance Company';
    default:
      return 'Rockingham Specialty Insurance, Inc.';
  }
}
