import React from 'react';
import { IMaskInput } from 'react-imask';

export interface FeinMaskProps {
  onChange: (event: { target: { name: string; value: string } }) => void;
  name: string;
}

export const FeinMask = React.forwardRef<HTMLElement, FeinMaskProps>(function TextMaskCustom(
  props,
  ref
) {
  const { onChange, ...other } = props;
  return (
    <IMaskInput
      {...other}
      mask='#0-0000000'
      unmask={false}
      definitions={{
        '#': /[1-9]/,
      }} // @ts-ignore
      inputRef={ref}
      onAccept={(value: any) => onChange({ target: { name: props.name, value } })}
      overwrite
    />
  );
});

export default FeinMask;
