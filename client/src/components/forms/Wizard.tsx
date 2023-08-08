import {
  Children,
  ReactElement,
  ReactNode,
  cloneElement,
  memo,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Breakpoint } from '@mui/material';

import { Handler, WizardContext } from 'context';

export interface WizardProps {
  /** Optional header that is shown above the active step */
  header?: ReactNode;
  /** Optional footer that is shown below the active step */
  footer?: ReactNode;
  /** Optional start index @default 0 */
  startIndex?: number;
  /**
   * Optional wrapper that is exclusively wrapped around the active step component. It is not wrapped around the `header` and `footer`
   *
   * @example With `framer-motion` - `<AnimatePresence />`
   * ```jsx
   * <Wizard wrapper={<AnimatePresence exitBeforeEnter />}>
   * ...
   * </Wizard>
   * ```
   */
  wrapper?: ReactElement;
  maxWidth?: Breakpoint | false;
}

export const Wizard: React.FC<React.PropsWithChildren<WizardProps>> = memo(
  ({ header, footer, children, wrapper: Wrapper, startIndex = 0, maxWidth = 'sm' }) => {
    const [activeStep, setActiveStep] = useState(startIndex);
    const [isLoading, setIsLoading] = useState(false);

    const hasNextStep = useRef(true);
    const hasPreviousStep = useRef(false);
    const nextStepHandler = useRef<Handler>(() => {});

    const stepsArr = Children.toArray(children);
    const stepCount = Children.toArray(children).length;

    hasNextStep.current = activeStep < stepCount - 1;
    hasPreviousStep.current = activeStep > 0;

    const goToNextStep = useRef(() => {
      if (hasNextStep.current) {
        setActiveStep((activeStep) => activeStep + 1);
      }
    });

    // When previousStep() is called
    const goToPreviousStep = useRef(() => {
      if (hasPreviousStep.current) {
        nextStepHandler.current = null;
        setActiveStep((activeStep) => activeStep - 1);
      }
    });

    const goToStep = useRef((stepIndex: number) => {
      if (stepIndex >= 0 && stepIndex < stepCount) {
        nextStepHandler.current = null;
        setActiveStep(stepIndex);
      }
    });

    // Callback to attach the step handler
    const handleStep = useRef((handler: Handler) => {
      nextStepHandler.current = handler;
    });

    // When nextStep() is called
    const doNextStep = useRef(async () => {
      if (hasNextStep.current && nextStepHandler.current) {
        try {
          setIsLoading(true);
          await nextStepHandler.current();
          setIsLoading(false);
          nextStepHandler.current = null;
          goToNextStep.current();
        } catch (error) {
          setIsLoading(false);
          throw error;
        }
      } else {
        goToNextStep.current();
      }
    });

    const wizardValue = useMemo(
      () => ({
        nextStep: doNextStep.current,
        previousStep: goToPreviousStep.current,
        handleStep: handleStep.current,
        goToStep: goToStep.current,
        activeStep,
        isLoading,
        stepCount,
        isFirstStep: !hasPreviousStep.current,
        isLastStep: !hasNextStep.current,
        maxWidth,
      }),
      [activeStep, stepCount, isLoading, maxWidth]
    );

    const currentView = useMemo(() => stepsArr[activeStep], [activeStep, stepsArr]);

    const wrappedCurrentView = useMemo(
      () => (Wrapper ? cloneElement(Wrapper, { children: currentView }) : currentView),
      [Wrapper, currentView]
    );

    return (
      <WizardContext.Provider value={wizardValue}>
        {header}
        {wrappedCurrentView}
        {footer}
      </WizardContext.Provider>
    );
  }
);
