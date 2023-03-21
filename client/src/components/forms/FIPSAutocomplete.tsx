import React from 'react';
import { Autocomplete, Checkbox, TextField } from '@mui/material';
import { CheckBox, CheckBoxOutlineBlank } from '@mui/icons-material';

import { FIPSDetails } from 'common';
import { useField } from 'formik';
import { FIPS } from 'common/fips';

// const FIPS = React.lazy('../../common/fips');

const icon = <CheckBoxOutlineBlank fontSize='small' />;
const checkedIcon = <CheckBox fontSize='small' />;

export interface FormikAutocompleteProps {
  name: string;
}

// TODO: generic autocomplete component: https://codesandbox.io/s/interesting-bash-yicwbc?fontsize=14&hidenavigation=1&theme=dark&file=/src/CustomAutoComplete.tsx

// export interface FormikAutocompleteProps<T> {
//   name: string;
//   autocompleteProps?: AutocompleteProps<
//     T,
//     boolean | undefined,
//     boolean | undefined,
//     boolean | undefined
//   >;
// }

// export const FIPSAutocomplete = <T extends unknown>({ name, autocompleteProps }: FormikAutocompleteProps<T>) => {

export const FIPSAutocomplete: React.FC<FormikAutocompleteProps> = ({ name }) => {
  const [field, { error, touched }, { setValue, setTouched }] = useField({ name, multiple: true });
  const [inputValue, setInputValue] = React.useState('');

  return (
    <Autocomplete
      value={field.value}
      onChange={(event: any, newValue: FIPSDetails[] | null) => {
        setTouched(true);
        if (newValue) return setValue(newValue, true);
        setValue([], true);
      }}
      inputValue={inputValue}
      onInputChange={(event, newInputValue) => {
        setInputValue(newInputValue);
      }}
      onClose={(event: React.SyntheticEvent, reason: string) => {
        // if (reason === 'blur') field.onBlur(event);
        setTouched(true, true);
      }}
      multiple
      options={FIPS}
      // options={FIPS.sort((a, b) => -b.state.localeCompare(a.state))}
      groupBy={(option) => option.state}
      disableCloseOnSelect
      limitTags={4}
      fullWidth
      getOptionLabel={(option) => option.countyName}
      renderOption={(props, option, { selected }) => (
        <li {...props} key={`${option.stateFP}${option.countyFP}`}>
          <Checkbox
            icon={icon}
            checkedIcon={checkedIcon}
            style={{ marginRight: 8 }}
            checked={selected}
          />
          {`${option.countyFP} - ${option.countyName}`}
        </li>
      )}
      style={{ width: 500 }}
      renderInput={(params) => (
        <TextField
          {...params}
          label='Counties'
          placeholder='search: fips, state, county name'
          error={Boolean(error) && touched}
          helperText={touched && Boolean(error) && error}
        />
      )}
      // {...autocompleteProps}
    />
  );
};
