import { forwardRef } from 'react';
import { IMaskInput } from 'react-imask';

import { IMaskProps } from './IMask';

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

export const PercentMask = forwardRef<HTMLElement, IMaskProps>(function TextMaskCustom(props, ref) {
  const { onChange, maskProps, ...other } = props;

  return (
    <IMaskInput
      scale={2}
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
      signed={false}
      normalizeZeros={true}
      unmask={true} // @ts-ignore
      inputRef={ref}
      overwrite
      {...maskProps}
      max={100}
      onAccept={(value: any) => onChange({ target: { name: props.name, value } })}
    />
  );
});

// ^\d{1,5}$|(?=^.{1,5}$)^\d+\.\d{0,2}$
// ^[0-9]{1,2}(\.[0-9]{1,2})?$
