import { Typography } from '@mui/material';

export function Header({ title }: { title: string }) {
  return (
    <Typography variant='h5' gutterBottom align='center'>
      {/* Add Location */}
      {title}
    </Typography>
  );
}
