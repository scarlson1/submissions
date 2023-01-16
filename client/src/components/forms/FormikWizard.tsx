import React, { useState, useMemo } from 'react';
import { Box, Button, MobileStepper, Stack } from '@mui/material';
import { KeyboardArrowRight, KeyboardArrowLeft, NavigateNextRounded } from '@mui/icons-material';
import LoadingButton from '@mui/lab/LoadingButton';
import { Formik, Form, FormikHelpers, FormikErrors } from 'formik';

import { StepProps, StepperNav } from 'components/forms';
import { useWidth, useScroll } from 'hooks';

// TODO: create application layout - hide footer on mobile (sits under stepper)

// TODO: use router instead of index state ??
// https://blog.logrocket.com/building-multi-step-wizards-with-formik-and-react-query/

export interface FormikWizardProps {
  children: React.ReactElement<StepProps> | React.ReactElement<StepProps>[]; // JSX.Element | JSX.Element[]; // React.ReactNode;
  initialValues: { [key: string]: any };
  onSubmit: (values: any, helpers: FormikHelpers<any>) => void;
  onCancel?: () => void;
  mutateOnSubmit?: (values: any, helpers: FormikHelpers<any>) => any;
  enableReinitialize?: boolean;
  initialErrors?: { [key: string]: any };
  loading?: boolean;
  submitButtonText?: string;
  disableNext?: boolean;
  initialIndex?: number;
  withStepper?: boolean;
}

export const FormikWizard: React.FC<FormikWizardProps> = ({
  children,
  initialValues,
  initialErrors = {},
  onSubmit,
  onCancel,
  mutateOnSubmit,
  loading = false,
  submitButtonText = 'Submit',
  disableNext = false,
  initialIndex = 0,
  withStepper = true,
  ...rest
}) => {
  const [stepIndex, setStepIndex] = useState<number>(initialIndex);
  const [snapshot, setSnapshot] = useState(initialValues);
  const { isMobile } = useWidth();
  const { scrollToTop } = useScroll();

  const steps = useMemo(() => React.Children.toArray(children), [children]);

  const stepperNavProps = useMemo(
    () =>
      steps
        .filter((child) => React.isValidElement(child)) // @ts-ignore
        .map((step) => ({ navLabel: step.props?.stepperNavLabel || '' })),
    [steps]
  );

  let currentStep = useMemo(
    () => React.cloneElement(steps[stepIndex] as React.ReactElement),
    [steps, stepIndex]
  );
  const isLastStep = () => stepIndex === steps.length - 1;

  const next = (values: any, helpers?: FormikHelpers<any>) => {
    setSnapshot(values);
    setStepIndex(Math.min(stepIndex + 1, steps.length - 1));
    scrollToTop();

    setTimeout(() => {
      helpers?.validateForm(values);
    }, 100);
  };

  const previous = (values: any, validateForm: (values?: any) => Promise<FormikErrors<any>>) => {
    setSnapshot(values);
    setStepIndex(Math.max(stepIndex - 1, 0));
    scrollToTop();

    setTimeout(() => {
      validateForm(values);
    }, 100);
  };

  const handleSubmit = async (values: any, bag: FormikHelpers<any>) => {
    if (currentStep.props.onSubmit) {
      await currentStep.props.onSubmit(values, bag);
    }
    if (currentStep.props.mutateOnSubmit) {
      try {
        values = await currentStep.props.mutateOnSubmit(values, bag);
        console.log('MUTATED VALUES: ', values);
      } catch (err) {
        console.log('MUTATE ON SUBMIT ERROR: ', err);
      }
    }
    if (isLastStep()) {
      return onSubmit(values, bag);
    } else {
      bag.setTouched({});

      next(values, bag);
    }
  };

  const handleCancel = (
    handleReset: (e?: React.SyntheticEvent<any, Event> | undefined) => void,
    setValues: (
      values: React.SetStateAction<{
        [key: string]: any;
      }>,
      shouldValidate?: boolean | undefined
    ) => void
  ) => {
    handleReset();
    console.log('RESETING TO INITIAL VALUES: ', initialValues);
    setValues(initialValues, false);
    setStepIndex(0);
    if (onCancel) onCancel();
  };

  return (
    <Formik
      initialValues={snapshot}
      initialErrors={initialErrors}
      validationSchema={currentStep.props.validationSchema}
      validateOnMount={true}
      onSubmit={handleSubmit}
      enableReinitialize
      {...rest}
    >
      {({
        values,
        isValidating,
        isSubmitting,
        isValid,
        status,
        handleSubmit,
        validateForm,
        handleReset,
        setValues,
      }) => (
        <Form
          onSubmit={handleSubmit}
          autoComplete='off'
          style={{ width: '100%' }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              if (isValidating || isSubmitting || !isValid) return;
              handleSubmit();
            }
          }}
        >
          {/* TODO: MOVE TO OUTSIDE COMPONENT ?? useContext? pass steps as props? */}
          {!isMobile ? (
            <>
              {withStepper && (
                <Box sx={{ width: '100%', py: 5 }}>
                  <StepperNav
                    activeStep={stepIndex}
                    labels={stepperNavProps}
                    setStep={(index) => setStepIndex(index)}
                  />
                </Box>
              )}

              <Box>{currentStep}</Box>

              <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 4 }}>
                {stepIndex > 0 && (
                  <Stack direction='row' spacing={2}>
                    <Button onClick={() => previous(values, validateForm)} disabled={isSubmitting}>
                      Back
                    </Button>
                    <Button
                      variant='greyText'
                      onClick={() => handleCancel(handleReset, setValues)}
                      disabled={isSubmitting}
                    >
                      Cancel
                    </Button>
                  </Stack>
                )}
                <LoadingButton
                  type='submit'
                  loading={isSubmitting || isValidating || loading || status === 'loading'}
                  disabled={!isValid || disableNext}
                  loadingPosition='end'
                  endIcon={<NavigateNextRounded />}
                  sx={{ ml: 'auto' }}
                  // startIcon={<PasswordRounded />}
                  // currentStep.props?.loadingButtonText || ''
                >
                  {stepIndex === steps.length - 1 ? submitButtonText : 'Next'}
                </LoadingButton>
              </Box>
            </>
          ) : (
            <Box>
              {currentStep}
              <MobileStepper
                variant='progress'
                steps={steps.length || 0}
                position='bottom'
                activeStep={stepIndex}
                sx={{ maxWidth: 480, flexGrow: 1, mt: 4, mx: 'auto' }}
                nextButton={
                  <Button
                    size='small'
                    onClick={() => next(values)}
                    disabled={
                      isValidating ||
                      isSubmitting ||
                      !isValid ||
                      status === 'loading' ||
                      loading ||
                      disableNext
                    }
                  >
                    {stepIndex === steps.length - 1 ? submitButtonText : 'Next'}
                    {<KeyboardArrowRight />}
                  </Button>
                }
                backButton={
                  <Button
                    size='small'
                    onClick={() => previous(values, validateForm)}
                    disabled={stepIndex === 0 || isValidating || isSubmitting}
                  >
                    {<KeyboardArrowLeft />}
                    Back
                  </Button>
                }
              />
            </Box>
          )}
        </Form>
      )}
    </Formik>
  );
};

export default FormikWizard;
