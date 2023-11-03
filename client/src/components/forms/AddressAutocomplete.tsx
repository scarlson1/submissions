import { LocationOn } from '@mui/icons-material';
import {
  Autocomplete,
  AutocompleteChangeReason,
  Box,
  Grid,
  Stack,
  TextField,
  TextFieldProps,
  Typography,
} from '@mui/material';
import parse from 'autosuggest-highlight/parse';
import { useField } from 'formik';
import { throttle } from 'lodash';
import { useEffect, useMemo, useRef, useState } from 'react';

function loadScript(src: string, position: HTMLElement | null, id: string) {
  if (!position) {
    return;
  }
  const script = document.createElement('script');
  script.setAttribute('async', '');
  script.setAttribute('id', id);
  script.src = src;
  position.appendChild(script);
}

const autocompleteService = { current: null };

interface MainTextMatchedSubstrings {
  offset: number;
  length: number;
}

interface StructuredFormatting {
  main_text: string;
  secondary_text: string;
  main_text_matched_substrings: readonly MainTextMatchedSubstrings[];
}

export interface PlaceType {
  description: string;
  structured_formatting: StructuredFormatting;
  place_id?: string;
}

export interface AddressComponent {
  long_name: string;
  short_name: string;
  types: AddressComponentType[];
}

export interface NewAddress {
  address_components: AddressComponent[];
  geometry?: { location: any; viewport: any };
  html_attributions?: any;
}

export type AddressComponentType =
  | 'street_number'
  | 'route'
  | 'locality'
  | 'administrative_area_level_1'
  | 'administrative_area_level_2'
  | 'postal_code'
  | 'country';

export interface AddressAutocompleteProps {
  name?: string;
  handleSelection?: (newValue: NewAddress) => void;
  resetFields?: () => void;
  textFieldProps?: TextFieldProps;
}

export const AddressAutocomplete = ({
  name = 'addressLine1',
  handleSelection,
  resetFields,
  textFieldProps,
  ...rest
}: AddressAutocompleteProps) => {
  const [field, meta, helpers] = useField(name);
  const [value, setValue] = useState<PlaceType | null>(null); // VALUE WHEN USER SELECTS OPTION
  const [options, setOptions] = useState<readonly PlaceType[]>([]);
  const loaded = useRef(false);

  if (typeof window !== 'undefined' && !loaded.current) {
    if (!document.querySelector('#google-maps')) {
      loadScript(
        `https://maps.googleapis.com/maps/api/js?key=${
          import.meta.env.VITE_GOOGLE_GEO_KEY
        }&libraries=places&types=address`,
        document.querySelector('head'),
        'google-maps'
      );
    }

    loaded.current = true;
  }

  const fetch = useMemo(
    () =>
      throttle((request: { input: string }, callback: (results?: readonly PlaceType[]) => void) => {
        (autocompleteService.current as any).getPlacePredictions(request, callback);
      }, 200),
    []
  );

  useEffect(() => {
    let active = true;

    if (!autocompleteService.current && (window as any).google) {
      autocompleteService.current = new (window as any).google.maps.places.AutocompleteService();
    }
    if (!autocompleteService.current) {
      return undefined;
    }

    if (field.value === '') {
      setOptions(value ? [value] : []);
      return undefined;
    }

    fetch({ input: field.value }, (results?: readonly PlaceType[]) => {
      if (active) {
        let newOptions: readonly PlaceType[] = [];

        if (value) {
          newOptions = [value];
        }
        if (results) {
          newOptions = [...newOptions, ...results];
        }

        setOptions(newOptions);
      }
    });

    return () => {
      active = false;
    };
  }, [value, field.value, fetch]);

  const handleChange = (newValue: PlaceType | null) => {
    setOptions(newValue ? [newValue, ...options] : options);
    setValue(newValue);
    if (!newValue || !newValue.place_id) return;

    var request = {
      placeId: newValue.place_id,
      fields: ['address_component', 'geometry'],
    };

    var service = new (window as any).google.maps.places.PlacesService(
      document.createElement('div')
    );
    service.getDetails(request, callback);

    function callback(place: NewAddress, status: any) {
      if (status === (window as any).google.maps.places.PlacesServiceStatus.OK) {
        if (handleSelection) handleSelection(place);
      } else {
        console.log('Error calling places service to get coordinates and address details');
      }
      document.getElementById('address-autocomplete')?.blur();
    }
  };

  return (
    <Box>
      <Autocomplete
        id='address-autocomplete'
        filterOptions={(x) => x}
        options={options}
        autoHighlight
        includeInputInList
        filterSelectedOptions
        size='medium'
        clearOnBlur={false}
        // blurOnSelect={true} // causes infinite loop
        value={value}
        // when user selects option
        onChange={(
          event: React.SyntheticEvent<Element, Event>,
          newValue: PlaceType | null,
          reason: AutocompleteChangeReason
        ) => {
          event.stopPropagation();
          if (reason === 'clear' && resetFields) resetFields();
          if (reason === 'clear' || reason === 'selectOption') handleChange(newValue);
        }}
        // inputValue={field.value} // causes infinite loop when clicking "back" (old version)
        inputValue={field.value}
        onInputChange={(event, newInputValue) => {
          helpers.setValue(newInputValue);
        }}
        // renderInput={(params) => {
        //   console.log('AUTOCOMPLETE PARAMS: ', params);
        //   return (
        //     <TextField
        //       {...params}
        //       id='address.addressLine1'
        //       label='Address'
        //       size='medium'
        //       autoComplete='off'
        //       fullWidth
        //       error={Boolean(meta) && meta.touched && Boolean(meta.error)}
        //       onBlur={() => helpers.setTouched(true)}
        //       {...textFieldProps}
        //       helperText={(meta && meta.touched && meta.error) ?? meta.error}
        //       // helperText={
        //       //   meta && meta.touched && meta.error
        //       //     ? meta.error
        //       //     : textFieldProps?.helperText || undefined
        //       // }
        //       InputProps={{
        //         autoComplete: 'new-password',
        //         ...params.InputProps,
        //         endAdornment:
        //           textFieldProps?.InputProps?.endAdornment || params?.InputProps?.endAdornment ? (
        //             <Stack direction='row' spacing={1}>
        //               {textFieldProps?.InputProps?.endAdornment}
        //               {params?.InputProps?.endAdornment}
        //             </Stack>
        //           ) : undefined,
        //       }}
        //     />
        //   );
        // }}
        renderInput={(params) => (
          <TextField
            {...params}
            // id='addressLine1'
            label='Address'
            size='medium'
            autoComplete='off'
            fullWidth
            error={Boolean(meta) && meta.touched && Boolean(meta.error)}
            onBlur={() => helpers.setTouched(true)}
            {...textFieldProps}
            helperText={(meta && meta.touched && meta.error) ?? meta.error}
            // helperText={
            //   meta && meta.touched && meta.error
            //     ? meta.error
            //     : textFieldProps?.helperText || undefined
            // }
            InputProps={{
              autoComplete: 'new-password',
              ...params.InputProps,
              endAdornment:
                textFieldProps?.InputProps?.endAdornment || params?.InputProps?.endAdornment ? (
                  <Stack direction='row' spacing={1}>
                    {textFieldProps?.InputProps?.endAdornment}
                    {params?.InputProps?.endAdornment}
                  </Stack>
                ) : undefined,
            }}
          />
        )}
        getOptionLabel={(option) => option.structured_formatting.main_text}
        renderOption={(props, option) => {
          const matches = option.structured_formatting.main_text_matched_substrings;
          const parts = parse(
            option.structured_formatting.main_text,
            matches.map((match: any) => [match.offset, match.offset + match.length])
          );
          return (
            <li {...props} key={props.id}>
              <Grid container alignItems='center'>
                <Grid item>
                  <Box component={LocationOn} sx={{ color: 'text.secondary', mr: 2 }} />
                </Grid>
                <Grid item xs>
                  {parts.map((part, index) => (
                    <span
                      key={index}
                      style={{
                        fontWeight: part.highlight ? 700 : 400,
                      }}
                    >
                      {part.text}
                    </span>
                  ))}
                  <Typography variant='body2' color='text.secondary'>
                    {option.structured_formatting.secondary_text}
                  </Typography>
                </Grid>
              </Grid>
            </li>
          );
        }}
        {...rest}
      />
    </Box>
  );
};
