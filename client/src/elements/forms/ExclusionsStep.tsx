import { useEffect, useState } from 'react';

import { DoNotDisturbAltRounded } from '@mui/icons-material';
import {
  Box,
  Checkbox,
  Chip,
  Collapse,
  Container,
  Divider,
  FormControl,
  InputLabel,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  MenuItem,
  OutlinedInput,
  Select,
  SelectChangeEvent,
  ToggleButton,
  Typography,
} from '@mui/material';
import { useFormikContext } from 'formik';

import type { FloodValues } from '@idemand/common';
import { FormikToggleButtonGroup } from 'components/forms';

// TODO: move to zod enum
const exclusions = [
  'Open wall or roof',
  'Under construction',
  'Building located over water',
  'Unrepaired damage',
  'Mold',
];
const ITEM_HEIGHT = 36;
const ITEM_PADDING_TOP = 8;
const MenuProps = {
  PaperProps: {
    style: {
      maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
      width: 250,
    },
  },
  MenuListProps: {
    dense: true,
    sx: {
      '& .MuiMenuItem-root': {
        '& .MuiCheckbox-root': {
          padding: 1,
        },
      },
    },
  },
};

export const ExclusionsStep = () => {
  const { values, setFieldValue, validateField } =
    useFormikContext<FloodValues>();
  const [collapseIn, setCollapseIn] = useState(false);

  useEffect(() => {
    values.exclusionsExist ? setCollapseIn(true) : setCollapseIn(false);
  }, [values.exclusionsExist]);

  const handleSelectChange = (event: SelectChangeEvent<typeof exclusions>) => {
    const {
      target: { value },
    } = event;
    setFieldValue('exclusions', value);
    // updateQuote({ exclusions: [...value] });
  };

  const handleExclusionsExistChange = (
    event: React.MouseEvent<HTMLElement>,
    newValue: boolean | null,
  ) => {
    setFieldValue('exclusionsExist', newValue);
    if (newValue === false) {
      setFieldValue('exclusions', []);
      // updateQuote({ exclusions: [] });
    }
    setTimeout(() => {
      validateField('exclusions');
      validateField('exclusionsExist');
    }, 100);
  };

  return (
    <Container maxWidth='xs'>
      <Typography>Do any of the items listed below exist?</Typography>
      <List dense sx={{ py: 4 }}>
        {exclusions.map((exclusion) => (
          <ListItem dense key={exclusion}>
            <ListItemIcon sx={{ minWidth: 24 }}>
              <DoNotDisturbAltRounded color='error' sx={{ fontSize: 14 }} />
            </ListItemIcon>
            <ListItemText
              primary={exclusion}
              primaryTypographyProps={{ sx: { color: 'text.secondary' } }}
            />
          </ListItem>
        ))}
      </List>
      <FormikToggleButtonGroup
        name='exclusionsExist'
        onChange={handleExclusionsExistChange}
      >
        <ToggleButton
          name='exclusionsExist'
          value={true}
          aria-label='yes'
          sx={{ py: 2, px: 4 }}
        >
          Yes
        </ToggleButton>
        <ToggleButton
          name='exclusionsExist'
          value={false}
          aria-label='no'
          sx={{ py: 2, px: 4 }}
        >
          No
        </ToggleButton>
      </FormikToggleButtonGroup>
      <Collapse in={collapseIn}>
        <Box>
          <Divider sx={{ my: 4 }} />
          <Typography>
            Please select all that apply from the dropdown.
          </Typography>
          {/* TODO: configure FormikSelect to handle multiple values & chip */}
          {/* <FormikSelect
            id='exclusions-select'
            name='exclusions-select'
            label=''
            selectOptions={exclusions}
          /> */}
          <FormControl
            size='small'
            sx={{ m: 1, width: '100%', maxWidth: 400, my: 4 }}
          >
            <InputLabel id='multiple-exclusions-label'>
              Existing item(s):
            </InputLabel>
            <Select
              labelId='multiple-exclusions-label'
              id='exclusions-select'
              multiple
              value={values.exclusions || ''}
              onChange={handleSelectChange}
              input={<OutlinedInput label='Existing item(s): ' />}
              renderValue={(selected) => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {selected.map((value) => (
                    <Chip key={value} label={value} />
                  ))}
                </Box>
              )}
              MenuProps={MenuProps}
            >
              {exclusions.map((exclusion) => (
                <MenuItem
                  key={exclusion}
                  value={exclusion}
                  sx={{
                    fontWeight: (theme) =>
                      values.exclusions.indexOf(exclusion) === -1
                        ? theme.typography.fontWeightRegular
                        : theme.typography.fontWeightBold,
                  }}
                >
                  <Checkbox
                    checked={values.exclusions.indexOf(exclusion) > -1}
                  />
                  <ListItemText primary={exclusion} />
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      </Collapse>
    </Container>
  );
};
