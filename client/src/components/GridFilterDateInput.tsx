import React from 'react';
import { GridFilterInputValueProps } from '@mui/x-data-grid';
import { DatePicker, DateTimePicker } from '@mui/x-date-pickers';
import { isDate } from 'date-fns';
import { Timestamp } from 'firebase/firestore';

export function GridFilterDateInput(props: GridFilterInputValueProps & { showTime?: boolean }) {
  const { item, showTime, applyValue, apiRef } = props;

  const Component = showTime ? DateTimePicker : DatePicker;

  const handleFilterChange = (newValue: unknown) => {
    if (newValue && typeof newValue === 'string' && isDate(new Date(newValue)))
      newValue = Timestamp.fromDate(new Date(newValue));

    console.log('new date val: ', newValue);
    applyValue({ ...item, value: newValue });
  };

  return (
    <Component
      value={item.value || null}
      autoFocus
      label={apiRef.current.getLocaleText('filterPanelInputLabel')}
      slotProps={{
        textField: {
          variant: 'standard',
        },
        inputAdornment: {
          sx: {
            '& .MuiButtonBase-root': {
              marginRight: -1,
            },
          },
        },
      }}
      onChange={handleFilterChange}
    />
  );
}
