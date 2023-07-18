import { forwardRef } from 'react';
import { IMaskInput } from 'react-imask';
import { IMaskInputProps } from 'react-imask/dist/mixin';
import { MaskedRange } from 'imask';

export interface IMaskProps {
  onChange: (event: { target: { name: string; value: string } }) => void;
  name: string;
  maskProps?: Partial<IMaskInputProps>;
}

export const IMask = forwardRef<HTMLElement, IMaskProps>(function TextMaskCustom(props, ref) {
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

export const cardExpDateMaskProps: Partial<IMaskInputProps> = {
  mask: 'MM/YY',
  blocks: {
    MM: {
      mask: MaskedRange,
      from: 1,
      to: 12,
      autofix: 'pad',
    },
    YY: {
      mask: MaskedRange,
      from: 23,
      to: 99,
      autofix: true,
    },
  },
  unmask: false,
  overwrite: true,
};

export const feinMaskProps: Partial<IMaskInputProps> = {
  mask: '#0-0000000',
  definitions: {
    '#': /[1-9]/,
  },
  unmask: false,
};

export const percentMaskProps: Partial<IMaskInputProps> = {
  scale: 2,
  mask: Number,
  radix: '.',
  signed: false,
  normalizeZeros: true,
  overwrite: true,
  max: 100,
};

export const phoneMaskProps: Partial<IMaskInputProps> = {
  mask: '{+1} (#00) 000-0000',
  definitions: {
    '#': /[1-9]/,
  },
  overwrite: true,
};

export const postalMaskProps: Partial<IMaskInputProps> = {
  mask: /^[0-9]{0,5}|[0-9]{5}(?:-[0-9]{0,4}|[0-9]{4})?/, // {postalRegEx}
  unmask: false,
  overwrite: true,
};

export const routingNumberMaskProps: Partial<IMaskInputProps> = {
  mask: '000000000',
  overwrite: true,
};
