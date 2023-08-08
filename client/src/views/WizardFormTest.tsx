import { ReactNode } from 'react';
import { LoadingButton } from '@mui/lab';
import { Box, Button, Container, Typography } from '@mui/material';

import { Wizard } from 'components/forms/Wizard';
import { useWizard } from 'hooks';

// TODO: pull maxWidth up to Wizard level
export const WizardFormTest = () => {
  return (
    <Wizard
      header={<Header />}
      footer={<WizardNavButtons />}
      wrapper={<Wrapper />}
      // wrapper={<AnimatedStep />}
    >
      <Step1 />
      <Step2 />
    </Wizard>
  );
};

const Step1 = () => {
  const { handleStep } = useWizard();

  // Attach an optional handler
  handleStep(async () => {
    alert('Going to step 2');
  });

  return (
    <Box>
      <Typography variant='h6' gutterBottom>
        Step 1
      </Typography>
    </Box>
  );
};

const Step2 = () => {
  const { handleStep } = useWizard();

  // Attach an optional handler
  handleStep(() => {
    alert('Done handleStep');
  });

  return (
    <Box>
      <Typography variant='h6' gutterBottom>
        Step 2
      </Typography>
    </Box>
  );
};

const WizardNavButtons = () => {
  const { nextStep, previousStep, isLoading, isFirstStep, maxWidth } = useWizard();
  // const formikCtx = useFormikContext();
  // const isValid = formikCtx ? formikCtx.isValid : true;

  return (
    <Container maxWidth={maxWidth}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 2 }}>
        {isFirstStep ? <Box /> : <Button onClick={() => previousStep()}>Previous</Button>}
        <LoadingButton
          onClick={() => nextStep()}
          loading={isLoading}
          // disabled={!isValid}
        >
          Next
        </LoadingButton>
      </Box>
    </Container>
  );
};

export const Wrapper = ({ children }: { children?: ReactNode }) => {
  const { maxWidth } = useWizard();

  return (
    <Container maxWidth={maxWidth} sx={{ p: 5 }}>
      {children}
    </Container>
  );
};

export const Header = () => (
  <Typography variant='h5' gutterBottom align='center'>
    Test Header
  </Typography>
);

// function AnimatedStep({ children }: { children?: ReactNode }) {
//   const { stepCount, activeStep, handleStep } = useWizard();
//   const data = useMemo(() => Array(stepCount).fill(null).map, [stepCount]);

//   const [transitions] = useTransition(data, () => ({
//     from: { opacity: 0 },
//     enter: { opacity: 1 },
//     leave: { opacity: 0 },
//   }));

//   return transitions((style, item) => <animated.div style={style}>{children}</animated.div>);
// }

// function AnimatedStep({ children }: { children?: ReactNode }) {
//   const previousStepIndex = useRef<number>(0);
//   const { stepCount, activeStep, handleStep } = useWizard();
//   const [springs, api] = useSprings(
//     stepCount,
//     (i) => {
//       // if (i !== activeStep) return { display: 'none ' };
//       return {
//         // from: {
//         //   opacity: 0,
//         //   scale: 0,
//         // },
//         // to: {
//         opacity: 1, // i === activeStep ? 1 : 0,
//         x: 0,
//         scale: 1,
//         // },
//         enter: {},
//         leave: {}
//         // display: i === activeStep ? 'block' : 'none',
//         // display: i < activeStep - 1 || i > activeStep + 1 ? 'none' : 'block',
//       };
//     },
//     [stepCount, activeStep]
//   );

//   handleStep(() => {
//     api.start(i => {
//       if (i < activeStep - 1 || i > activeStep + 1) return { display: 'none' };
//       // const x = (i - activeStep) * width + (active ? mx : 0);
//       const x = activeStep - previousStepIndex.current > 0 ? 800 : -800;
//       const scale = 1; // active ? 1 - distance / width / 2 : 1;
//       return { x, scale, display: 'block' };
//     });
//   });

//   return (
//     <div>
//       {springs.map((props, i) => (
//         <animated.div style={{ ...props, display: activeStep === i ? 'block' : 'none' }} key={i}>
//           <Wrapper>{children}</Wrapper>
//         </animated.div>
//       ))}
//     </div>
//   );
// }
