import {
  Box,
  CardContentProps,
  CardProps,
  Card as MuiCard,
  CardContent as MuiCardContent,
} from '@mui/material';

export const flexCardStyle = {
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
} as const;

export const flexCardContentStyle = {
  flex: '1 0 auto',
  // height: '100%', overflows card when CardMedia included
  // need to included box as child with height 100% and flex, dir column, space-between
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

export const FlexCardContentWrapper = (props: any) => {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>{props.children}</Box>
  );
};
