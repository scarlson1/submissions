import { forwardRef } from 'react';
import { IMaskInput } from 'react-imask';

import { IMaskProps } from './IMask';

// import { postalRegEx } from 'common';

export const PostalMask = forwardRef<HTMLElement, IMaskProps>(function TextMaskCustom(props, ref) {
  const { onChange, ...other } = props;

  return (
    <IMaskInput
      {...other}
      // mask='00000-[0000]'
      mask={/^[0-9]{0,5}|[0-9]{5}(?:-[0-9]{0,4}|[0-9]{4})?/} // {postalRegEx}
      unmask={false}
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

export default PostalMask;
