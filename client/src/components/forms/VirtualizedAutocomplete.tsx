import React, { useState } from 'react';
import {
  Autocomplete,
  autocompleteClasses,
  AutocompleteProps,
  Box,
  Checkbox,
  ListSubheader,
  TextField,
  TextFieldProps,
  Typography,
  UseAutocompleteProps,
} from '@mui/material';
import { CheckBox, CheckBoxOutlineBlank } from '@mui/icons-material';
import { defaultRangeExtractor, Range, useVirtualizer } from '@tanstack/react-virtual';
import { useField } from 'formik';

const icon = <CheckBoxOutlineBlank fontSize='small' />;
const checkedIcon = <CheckBox fontSize='small' />;

export interface VirtualizedAutocompleteProps {
  name: string;
  options: any[]; // string[]; // TODO: label, value, etc.
  // multiple?: boolean;
  getOptionLabel: UseAutocompleteProps<any, true, undefined, undefined>['getOptionLabel'];
  autocompleteProps?: Partial<AutocompleteProps<any, any, false, false, any>>; // Partial<UseAutocompleteProps<any, true, undefined, undefined>>;
  textFieldProps?: TextFieldProps;
}

export const VirtualizedAutocomplete: React.FC<VirtualizedAutocompleteProps> = ({
  name,
  options,
  // multiple = true,
  getOptionLabel = (o) => `${o}`,
  autocompleteProps,
  textFieldProps,
}) => {
  const [field, { error, touched }, { setValue, setTouched }] = useField({
    name,
    multiple: autocompleteProps?.multiple || false,
  });
  const [inputValue, setInputValue] = useState('');

  return (
    <Autocomplete
      value={field.value}
      onChange={(e: any, newValue: any | null) => {
        setTouched(true);
        if (newValue) return setValue(newValue, true);
        setValue([], true);
      }}
      inputValue={inputValue}
      onInputChange={(e, newInputValue) => {
        setInputValue(newInputValue);
      }}
      onClose={() => {
        setTouched(true, true);
      }}
      multiple={autocompleteProps?.multiple || false}
      options={options}
      disableCloseOnSelect
      limitTags={4}
      fullWidth
      getOptionLabel={getOptionLabel}
      ListboxComponent={ListboxComponent}
      componentsProps={{
        popper: {
          sx: {
            [`& .${autocompleteClasses.listbox}`]: {
              boxSizing: 'border-box',
              '& ul': {
                padding: 0,
                margin: 0,
              },
            },
          },
        },
      }}
      renderOption={(props, option, state) => [props, option, state] as React.ReactNode}
      renderInput={(params) => (
        <TextField
          {...params}
          {...textFieldProps}
          error={Boolean(error) && touched}
          helperText={touched && Boolean(error) ? error : textFieldProps?.helperText}
        />
      )}
      // TODO: Post React 18 update - validate this conversion, look like a hidden bug
      renderGroup={(params) => params as unknown as React.ReactNode}
      {...autocompleteProps}
    />
  );
};

const ListboxComponent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLElement>>(
  function ListboxComponent({ children, ...rest }, ref) {
    const itemData: any[] = [];
    (children as any[]).forEach((item: any & { children?: any[] }) => {
      itemData.push(item);
      itemData.push(...(item.children || []));
    });

    const parentRef = React.useRef<any>();

    const activeStickyIndexRef = React.useRef(0);
    const stickyIndexes = React.useMemo<number[]>(
      () => itemData.map((r, i) => (r.hasOwnProperty('group') ? i : -1)).filter((x) => x !== -1), // eslint-disable-next-line react-hooks/exhaustive-deps
      []
    );

    const rowVirtualizer = useVirtualizer({
      count: itemData.length,
      getScrollElement: () => parentRef.current,
      estimateSize: () => 35,
      overscan: 5,
      rangeExtractor: React.useCallback(
        (range: Range) => {
          activeStickyIndexRef.current = [...stickyIndexes]
            .reverse()
            .find((index) => range.startIndex >= index) as number;

          const next = new Set([activeStickyIndexRef.current, ...defaultRangeExtractor(range)]);

          return [...next].sort((a, b) => a - b);
        },
        [stickyIndexes]
      ),
    });

    return (
      <div ref={ref}>
        <div
          ref={parentRef}
          {...rest}
          style={{
            height: `200px`,
            width: `100%`,
            overflow: 'auto',
          }}
          role='listbox'
        >
          <Box
            sx={{
              height: `${rowVirtualizer.getTotalSize()}px`,
              width: '100%',
              position: 'relative',
            }}
          >
            {rowVirtualizer.getVirtualItems().map((virtualRow) => {
              const row = itemData[virtualRow.index];

              if (row.hasOwnProperty('group')) {
                return (
                  <ListSubheader key={row.key} component='div' sx={{ top: -10 }}>
                    {row.group}
                  </ListSubheader>
                );
              }

              const itemProps = row[0];
              // const option = row[1];
              const optionState = row[2];

              return (
                <Typography
                  {...itemProps}
                  component='li'
                  sx={{
                    listStyle: 'none',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: `${virtualRow.size}px`,
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                  noWrap
                >
                  <Checkbox
                    icon={icon}
                    checkedIcon={checkedIcon}
                    style={{ marginRight: 8 }}
                    checked={optionState?.selected}
                  />
                  {itemProps.key}
                </Typography>
              );
            })}
          </Box>
        </div>
      </div>
    );
  }
);
