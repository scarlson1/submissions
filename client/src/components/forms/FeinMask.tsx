import { forwardRef } from 'react';
import { IMaskInput } from 'react-imask';

import { IMaskProps } from './IMask';

// TODO: replace using IMask component

export const FeinMask = forwardRef<HTMLElement, IMaskProps>(function TextMaskCustom(props, ref) {
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
