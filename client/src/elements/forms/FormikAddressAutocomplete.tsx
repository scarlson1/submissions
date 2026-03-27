import { setNestedObjectValues, useFormikContext } from 'formik';
import { useCallback } from 'react';

import { DEFAULT_ADDRESS_FIELD_NAMES } from 'common';
import { AddressAutocomplete, AddressAutocompleteProps, NewAddress } from 'components/forms';
import { extractAddressFromGeoCode } from 'modules/utils';
import { AddressFieldNames } from './FormikAddress';

export interface FormikAddressAutocompleteProps
  extends Omit<AddressAutocompleteProps, 'resetFields' | 'handleSelection'> {
  cb?: (coords: { lat: number | null; lng: number | null }, state?: string) => void;
  names?: Partial<AddressFieldNames>;
}

export const FormikAddressAutocomplete = ({
  cb,
  names = DEFAULT_ADDRESS_FIELD_NAMES,
  ...autocompleteProps
}: // autocompleteProps,
FormikAddressAutocompleteProps) => {
  const { setFieldValue, touched, setTouched } = useFormikContext();

  const touchAll = useCallback(
    async () =>
      setTimeout(
        () =>
          setTouched({
            ...touched,
            ...setNestedObjectValues(Object.keys(names), true),
          }),
        0
      ),
    [names, touched, setTouched]
  );

  const handleAddressSelection = useCallback(
    (geocodeResult: NewAddress) => {
      const { addressLine1, city, state, postal, county, latitude, longitude } =
        extractAddressFromGeoCode(geocodeResult);

      names.addressLine1 && setFieldValue(names.addressLine1, addressLine1);
      names.addressLine2 && setFieldValue(names.addressLine2, '');
      names.city && setFieldValue(names.city, city || '');
      names.state && setFieldValue(names.state, state || '');
      names.postal && setFieldValue(names.postal, postal || '');
      names.county && setFieldValue(names.county, county || '');
      names.latitude && setFieldValue(names.latitude, latitude ?? null);
      names.longitude && setFieldValue(names.longitude, longitude ?? null);

      if (cb) {
        cb({ lat: latitude, lng: longitude }, `${state || ''}`);
      }

      names.addressLine2 && document.getElementById(names.addressLine2)?.focus();

      touchAll();
    },
    [setFieldValue, touchAll, cb, names]
  );

  const handleClearAutocomplete = () => {
    names.addressLine2 && setFieldValue(names.addressLine2, '');
    names.city && setFieldValue(names.city, '');
    names.state && setFieldValue(names.state, '');
    names.postal && setFieldValue(names.postal, '');
    names.county && setFieldValue(names.county, '');
    names.latitude && setFieldValue(names.latitude, '');
    names.longitude && setFieldValue(names.longitude, '');
  };

  return (
    <AddressAutocomplete
      handleSelection={handleAddressSelection}
      resetFields={handleClearAutocomplete}
      {...autocompleteProps}
    />
  );
};
