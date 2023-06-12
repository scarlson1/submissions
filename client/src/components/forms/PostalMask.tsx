import React from 'react';
import { IMaskInput } from 'react-imask';

// import { postalRegEx } from 'common';

export interface PostalMaskProps {
  onChange: (event: { target: { name: string; value: string } }) => void;
  name: string;
}

export const PostalMask = React.forwardRef<HTMLElement, PostalMaskProps>(function TextMaskCustom(
  props,
  ref
) {
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
