import { ReactNode, useState } from 'react';
import { useSpring, animated, config } from '@react-spring/web'; // to
import { Box, Card } from '@mui/material';

import styles from './Flip.module.css';

const AnimatedCard = animated(Card);

// TODO: how should front & back content be passed to component ??
//    - pass as children --> children: [ReactNode, ReactNode] --> render first as front, etc.
//    - pass as two props --> frontContent, backContent

interface FlipProps {
  front: ReactNode;
  back: ReactNode;
}

export const Flip = ({ front, back }: FlipProps) => {
  const [flipped, setFlipped] = useState(false);

  // HACK: use two useSprings to use different config values for transform & opacity (opacity needs to start ~50% later)
  const { transform, opacity } = useSpring({
    opacity: flipped ? 1 : 0,
    transform: `perspective(600px) rotateX(${flipped ? 180 : 0}deg)`,
    // config: { mass: 5, tension: 500, friction: 80 },
    config: (key) => {
      if (key === 'opacity') {
        return { ...config.default, mass: 2, clamp: true }; // mass: 10, progress: 0.3 // { mass: 10, tension: 500, friction: 80 };
      }
      return { ...config.default, mass: 3, friction: 40 }; // { mass: 5, tension: 500, friction: 80 };
    },
  });

  return (
    <Box
      onClick={() => setFlipped((s) => !s)}
      sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}
    >
      <AnimatedCard
        className={`${styles.c} ${styles.back}`}
        style={{
          opacity: opacity.to((o) => 1 - 2 * o),
          transform,
        }}
      >
        {front}
      </AnimatedCard>
      <AnimatedCard
        className={`${styles.c} ${styles.front}`}
        style={{
          // opacity.to(val => flipped && val < 0.5 ? 0 : val), REQUIRES USING to: / from: in useSpring ??
          // opacity: to(opacity, (val) => (val > 0.3 ? val : 0)),
          // opacity: opacity.to((o) => (flipped ? o : o / 2.5)),
          opacity: opacity.to((o) => (flipped && o < 0.65 ? 0 : o)),
          // opacity,
          transform,
          rotateX: '180deg',
          // backgroundImage: `url(https://images.unsplash.com/photo-1540206395-68808572332f?ixlib=rb-1.2.1&w=1181&q=80&auto=format&fit=crop)`,
          // backgroundSize: 'cover',
        }}
      >
        {back}
      </AnimatedCard>
    </Box>
  );

  // return (
  //   <Box
  //     onClick={() => setFlipped((s) => !s)}
  //     sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}
  //   >
  //     <a.div
  //       className={`${styles.c} ${styles.back}`}
  //       style={{
  //         // minHeight: 500,
  //         // minWidth: 500,
  //         // height: '30vw',
  //         // width: '80vw',
  //         // position: 'absolute',
  //         // cursor: 'pointer',
  //         // willChange: 'transform, opacity',
  //         opacity: opacity.to((o) => 1 - o),
  //         transform,
  //         backgroundImage:
  //           'url(https://images.unsplash.com/photo-1544511916-0148ccdeb877?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&w=1901&q=80i&auto=format&fit=crop)',
  //         backgroundSize: 'cover',
  //       }}
  //     />
  //     <a.div
  //       className={`${styles.c} ${styles.front}`}
  //       style={{
  //         // minHeight: 500,
  //         // minWidth: 500,
  //         // height: '30vw',
  //         // width: '80vw',
  //         // position: 'absolute',
  //         // cursor: 'pointer',
  //         // willChange: 'transform, opacity',
  //         opacity,
  //         transform,
  //         rotateX: '180deg',
  //         backgroundImage: `url(https://images.unsplash.com/photo-1540206395-68808572332f?ixlib=rb-1.2.1&w=1181&q=80&auto=format&fit=crop)`,
  //         backgroundSize: 'cover',
  //       }}
  //     />
  //   </Box>
  // );
};
