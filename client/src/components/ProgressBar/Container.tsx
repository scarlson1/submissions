interface ContainerProps {
  animationDuration: number;
  isFinished: boolean;
  children: React.ReactNode;
}

export const Container = ({ animationDuration, isFinished, children }: ContainerProps) => (
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
