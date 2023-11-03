import { Breakpoint } from '@mui/material';
import { createContext } from 'react';

// import { WizardValues } from './types';
// TODO: move to types.ts ??
export type Handler = (() => Promise<void>) | (() => void) | null;

export type WizardValues = {
  /**
   * Go to the next step
   */
  nextStep: () => Promise<void>;
  /**
   * Go to the previous step
   */
  previousStep: () => void;
  /**
   * Go to the given step index
   *
   * @param stepIndex The step index, starts at 0
   */
  goToStep: (stepIndex: number) => void;
  /**
   * Attach a callback that will be called when calling `nextStep()`
   *
   * @param handler Can be either sync or async
   */
  handleStep: (handler: Handler) => void;
  /**
   * Indicate the current state of the handler
   *
   * Will reflect the handler promise state: will be `true` if the handler promise is pending and
   * `false` when the handler is either fulfilled or rejected
   */
  isLoading: boolean;
  /** The current active step of the wizard */
  activeStep: number;
  /** The total number of steps of the wizard */
  stepCount: number;
  /** Indicate if the current step is the first step (aka no previous step) */
  isFirstStep: boolean;
  /** Indicate if the current step is the last step (aka no next step) */
  isLastStep: boolean;
  maxWidth?: Breakpoint | false;
};

export const WizardContext = createContext<WizardValues | null>(null);

if (import.meta.env.VITE_DEV === 'true') {
  WizardContext.displayName = 'WizardContext';
}
