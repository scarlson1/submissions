import {
  Card as MuiCard,
  CardContent as MuiCardContent,
  CardProps,
  CardContentProps,
} from '@mui/material';

export const flexCardStyle = {
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
} as const;

export const flexCardContentStyle = {
  flex: '1 0 auto',
  height: '100%',
} as const;

export const FlexCard = (props: CardProps) => {
  return (
    <MuiCard {...props} sx={{ ...flexCardStyle, ...props.sx }}>
      {props.children}
    </MuiCard>
  );
};

export const FlexCardContent = (props: CardContentProps) => {
  return (
    <MuiCardContent {...props} sx={{ ...flexCardContentStyle, ...props.sx }}>
      {props.children}
    </MuiCardContent>
  );
};
