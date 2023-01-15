import React from 'react';
import { IMaskInput } from 'react-imask';

// TODO: turn into reuable component
// pass mask etc as props

export interface PhoneMaskProps {
  onChange: (event: { target: { name: string; value: string } }) => void;
  name: string;
}

export const PhoneMask = React.forwardRef<HTMLElement, PhoneMaskProps>(function TextMaskCustom(
  props,
  ref
) {
  const { onChange, ...other } = props;
  return (
    <IMaskInput
      {...other}
      mask='{+1} (#00) 000-0000'
      unmask={true}
      definitions={{
        '#': /[1-9]/,
      }} // @ts-ignore
      inputRef={ref}
      onAccept={(value: any) => onChange({ target: { name: props.name, value } })}
      overwrite
    />
  );
});

export default PhoneMask;
