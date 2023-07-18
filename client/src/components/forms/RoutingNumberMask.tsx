import { forwardRef } from 'react';
import { IMaskInput } from 'react-imask';

import { IMaskProps } from './IMask';

export const RoutingNumberMask = forwardRef<HTMLElement, IMaskProps>(function TextMaskCustom(
  props,
  ref
) {
  const { onChange, ...other } = props;
  return (
    <IMaskInput
      {...other}
      mask='000000000' // '{+1} (#00) 000-0000'
      unmask={true}
      // definitions={{
      //   '#': /[1-9]/,
      // }}
      // @ts-ignore
      inputRef={ref}
      onAccept={(value: any) => onChange({ target: { name: props.name, value } })}
      overwrite
    />
  );
});
