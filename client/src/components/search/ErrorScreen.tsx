import React from 'react';

// import { ErrorIcon } from './icons';
export function ErrorIcon() {
  return (
    <svg
      width='40'
      height='40'
      viewBox='0 0 20 20'
      fill='none'
      fillRule='evenodd'
      stroke='currentColor'
      strokeLinecap='round'
      strokeLinejoin='round'
    >
      <path d='M19 4.8a16 16 0 00-2-1.2m-3.3-1.2A16 16 0 001.1 4.7M16.7 8a12 12 0 00-2.8-1.4M10 6a12 12 0 00-6.7 2M12.3 14.7a4 4 0 00-4.5 0M14.5 11.4A8 8 0 0010 10M3 16L18 2M10 18h0'></path>
    </svg>
  );
}

export type ErrorScreenTranslations = Partial<{
  titleText: string;
  helpText: string;
}>;

type ErrorScreenProps = {
  translations?: ErrorScreenTranslations;
};

export function ErrorScreen({ translations = {} }: ErrorScreenProps) {
  const {
    titleText = 'Unable to fetch results',
    helpText = 'You might want to check your network connection.',
  } = translations;
  return (
    <div className='DocSearch-ErrorScreen'>
      <div className='DocSearch-Screen-Icon'>
        <ErrorIcon />
      </div>
      <p className='DocSearch-Title'>{titleText}</p>
      <p className='DocSearch-Help'>{helpText}</p>
    </div>
  );
}
