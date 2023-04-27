import React from 'react';

interface ContainerProps {
  animationDuration: number;
  isFinished: boolean;
  children: React.ReactNode;
}

export const Container: React.FC<ContainerProps> = ({
  animationDuration,
  isFinished,
  children,
}) => (
  <div
    style={{
      opacity: isFinished ? 0 : 1,
      pointerEvents: 'none',
      transition: `opacity ${animationDuration}ms linear`,
    }}
  >
    {children}
  </div>
);
