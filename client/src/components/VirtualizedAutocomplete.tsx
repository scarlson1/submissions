import { Autocomplete } from '@mui/material';
import React from 'react';

export interface VirtualizedAutocompleteProps {
  data: string[]; // TODO: label, value, etc.
}

export const VirtualizedAutocomplete: React.FC<VirtualizedAutocompleteProps> = ({ data }) => {
  return <div>virtual autocomplete</div>;
  // return (
  //   <Autocomplete
  //     id='virtualize-demo'
  //     sx={{ width: 300 }}
  //     disableListWrap
  //     PopperComponent={StyledPopper}
  //     ListboxComponent={ListboxComponent}
  //     options={OPTIONS}
  //     groupBy={(option) => option[0].toUpperCase()}
  //     renderInput={(params) => <TextField {...params} label='10,000 options' />}
  //     renderOption={(props, option, state) => [props, option, state.index] as React.ReactNode}
  //     // TODO: Post React 18 update - validate this conversion, look like a hidden bug
  //     renderGroup={(params) => params as unknown as React.ReactNode}
  //   />
  // );
};
