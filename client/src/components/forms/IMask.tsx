import React from 'react';
import { IMaskInput } from 'react-imask';
import { IMaskInputProps } from 'react-imask/dist/mixin';

export interface IMaskProps {
  onChange: (event: { target: { name: string; value: string } }) => void;
  name: string;
  maskProps?: Partial<IMaskInputProps>;
}

export const IMask = React.forwardRef<HTMLElement, IMaskProps>(function TextMaskCustom(props, ref) {
  const { onChange, maskProps, ...other } = props;

  return (
    <IMaskInput
      {...other}
      signed={false}
      normalizeZeros={true}
      unmask={true} // @ts-ignore
      inputRef={ref}
      overwrite
      {...maskProps}
      onAccept={(value: any) => onChange({ target: { name: props.name, value } })}
    />
  );
});

// USAGE:

// <FormikMaskField
//   label='Year Built'
//   name='yearBuilt'
//   maskComponent={IMask}
//   inputProps={{ maskProps: { mask: '#000', definitions: { '#': /[1-2]/ } } }}
// />;
