import React from 'react';
import { Control, UseFieldArrayProps, useFieldArray } from 'react-hook-form';
import { Box, Button, Unstable_Grid2 as Grid } from '@mui/material';

import { RHFTextField } from './RHFTextField';
import { InputSchemas } from './FormikFieldArray';

export interface RHFFieldArrayProps extends UseFieldArrayProps<any, any> {
  control: Control<any, any>;
  inputFields: InputSchemas[];
}

// TODO: finish rest of input types
export const RHFFieldArray: React.FC<RHFFieldArrayProps> = ({ inputFields, ...props }) => {
  const { fields, append, remove } = useFieldArray({
    ...props,
    // control, // control props comes from useForm (optional: if you are using FormContext)
    // name: 'test', // unique name for your Field Array
  }); // prepend, swap, move, insert

  console.log('FIELDS: ', fields);

  return (
    <>
      <ul>
        {fields.map((item, index) => (
          <Box key={item.id}>
            <Grid container spacing={3} sx={{ py: 2, width: '100%', flex: '1 1 auto' }}>
              {inputFields.map((f) => {
                if (f.inputType === 'text') {
                  return (
                    <Grid key={`${f.name}-${index}-${item.id}`} xs={12} sm={6} md={4}>
                      <RHFTextField
                        name={`${props.name}.${index}.${f.name}`}
                        control={props.control}
                        label={f.label}
                        textFieldProps={{ fullWidth: true }}
                      />
                    </Grid>
                  );
                }
                return null;
              })}
              <Grid xs={true}>
                <Button onClick={() => remove(index)}>remove</Button>
              </Grid>
            </Grid>
          </Box>
          // <li key={item.id}>
          //   {/* <input {...register(`test.${index}.name`)} /> */}
          //   <RHFTextField
          //     control={props.control}
          //     name={`${props.name}.${index}.name`}
          //     label='test'
          //   />

          //   <button type='button' onClick={() => remove(index)}>
          //     Delete
          //   </button>
          //   {/* <NestedArray nestIndex={index} {...{ control, register }} /> */}
          // </li>
        ))}
      </ul>
      <Button onClick={() => append({ firstName: '', lastName: '' })}>append</Button>
    </>
  );
};
