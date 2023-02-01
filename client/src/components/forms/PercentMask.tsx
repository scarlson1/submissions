import React from 'react';
import { IMaskInput } from 'react-imask';

// const percentagePattern = {
//   mask: [
//     {
//       mask: '',
//     },
//     {
//       mask: 'num%',
//       lazy: false,
//       blocks: {
//         num: {
//           mask: Number,
// scale: 3,
// min: 2,
// max: 100,
// radix: '.',
// mapToRadix: [','],
//         },
//       },
//     },
//   ],
// };

export interface PercentMaskProps {
  onChange: (event: { target: { name: string; value: string } }) => void;
  name: string;
}

export const PercentMask = React.forwardRef<HTMLElement, PercentMaskProps>(function TextMaskCustom(
  props,
  ref
) {
  const { onChange, ...other } = props;

  return (
    <IMaskInput
      {...other}
      mask={Number}
      // mask='[0]0.[0][0]\\%'
      // mask='[#]#.[#][#]%'
      // definitions={{
      //   // '#': {
      //   //   mask: Number,
      //   //   scale: 3,
      //   //   min: 2,
      //   //   max: 100,
      //   //   radix: '.',
      //   //   mapToRadix: [','],
      //   // },
      //   '#': /[0-9]/,
      // }}
      radix='.'
      scale={2}
      max={100}
      signed={false}
      normalizeZeros={true}
      unmask={true} // @ts-ignore
      inputRef={ref}
      onAccept={(value: any) => onChange({ target: { name: props.name, value } })}
      overwrite
    />
  );
});

// ^\d{1,5}$|(?=^.{1,5}$)^\d+\.\d{0,2}$
// ^[0-9]{1,2}(\.[0-9]{1,2})?$
