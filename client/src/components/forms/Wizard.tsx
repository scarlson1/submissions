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

// TODO: add step hash to URL
// https://github.com/devrnt/react-use-wizard/issues/149
// https://github.com/jcmcneal/react-step-wizard
// https://github.com/jcmcneal/react-step-wizard/blob/master/src/index.js
// react router hash: https://stackoverflow.com/a/74573358

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
  // hashEnabled?: boolean;
}

export const Wizard: React.FC<React.PropsWithChildren<WizardProps>> = memo(
  ({
    header,
    footer,
    children,
    wrapper: Wrapper,
    startIndex = 0,
    maxWidth = 'sm',
    // hashEnabled,
  }) => {
    // const navigate = useNavigate();
    // const { hash: h } = useLocation();
    // const hash = h.slice(1);

    const [activeStep, setActiveStep] = useState(startIndex);
    const [isLoading, setIsLoading] = useState(false);
    // const hashKeys = useRef<Map<number, string> & Map<string, number>>(new Map());

    const hasNextStep = useRef(true);
    const hasPreviousStep = useRef(false);
    const nextStepHandler = useRef<Handler>(() => {});

    const stepsArr = Children.toArray(children);
    const stepCount = Children.toArray(children).length;
    // const prevStepsArr = usePrevious(stepsArr);

    hasNextStep.current = activeStep < stepCount - 1;
    hasPreviousStep.current = activeStep > 0;

    // TODO: need to handle step validation somehow

    // useEffect(() => {
    //   console.log('MAPPING CHILDREN HASH KEYS TO STATE');
    //   if (!hashEnabled || isEqual(stepsArr, prevStepsArr)) return;
    //   stepsArr.forEach((child, i) => {
    //     let k = `step${i + 1}`;
    //     if (isObject(child) && 'props' in child && child.props.hashKey) k = child.props.hashKey;
    //     console.log(`Setting hash map: [${i}: ${k}]`);
    //     console.log(`Setting hash map: [${k}: ${i}]`);

    //     hashKeys.current.set(i, k);
    //     hashKeys.current.set(k, i);
    //   });
    // }, [hashEnabled, stepsArr, prevStepsArr]);

    // useEffect(() => {
    //   if (!hashEnabled || !hash) return;
    //   console.log('setting step index in useEffect');
    //   const index =
    //   setActiveStep(hashKeys.current.get(hash) ?? 0);
    // }, [hashEnabled, hash]);

    // const setHash = useCallback(
    //   (i: number) => {
    //     console.log('setHash - activeStep: ', i);
    //     let nextHash = hashKeys.current.get(i);
    //     if (nextHash !== undefined) navigate(`#${nextHash}`);
    //   },
    //   [navigate]
    // );

    const goToNextStep = useRef(() => {
      if (hasNextStep.current) {
        setActiveStep((activeStep) => activeStep + 1);
        // could use custom useStateWithCallback hook
        // https://github.com/the-road-to-learn-react/use-state-with-callback/tree/master
        // setActiveStep(
        //   (activeStep) => activeStep + 1,
        //   () => {
        //     if (hashEnabled) setHash(activeStep);
        //   }
        // );
        // causes error using navigate in setState
        // setActiveStep((activeStep) => {
        //   if (hashEnabled) {
        //     // TODO: try using setHash()
        //     let nextHash = hashKeys.current.get(activeStep + 1);
        //     if (nextHash !== undefined) navigate(`#${nextHash}`);
        //   }
        //   console.log('setting next step index');
        //   return activeStep + 1;
        // });
      }
    });

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

    // When nextStep() is called (call handler if provided, else go to next step)
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
