import { Typography, TypographyProps } from '@mui/material';

interface HeaderProps extends TypographyProps {
  title: string;
}

export function Header({ title, ...props }: HeaderProps) {
  return (
    <Typography variant='h5' gutterBottom align='center' {...props}>
      {/* Add Location */}
      {title}
    </Typography>
  );
}
