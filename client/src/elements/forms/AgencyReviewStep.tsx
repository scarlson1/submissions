import {
  Box,
  Card,
  CardContent,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemTextProps,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Unstable_Grid2 as Grid,
} from '@mui/material';
import { useFormikContext } from 'formik';

import { AgencyAppValues } from 'views/AgencyNew';
import { formatPhoneNumber } from 'modules/utils/helpers';
import { EmailRounded, PersonRounded, PhoneRounded } from '@mui/icons-material';

export interface ContactItem {
  primaryText: React.ReactNode;
  secondaryText?: React.ReactNode;
  icon: React.ReactNode;
  listItemTextProps?: ListItemTextProps;
}
export interface ContactCardProps {
  items: ContactItem[];
}
export const ContactList = ({ items }: ContactCardProps) => {
  return (
    <List dense>
      {items.map(({ primaryText, secondaryText, icon, listItemTextProps }, index) => (
        <ListItem key={`${primaryText}-${index}-${Math.random()}`} sx={{ overflowX: 'hidden' }}>
          <ListItemIcon sx={{ minWidth: '36px' }}>{icon}</ListItemIcon>
          <ListItemText
            primary={primaryText}
            secondary={secondaryText || ''}
            {...listItemTextProps}
          />
        </ListItem>
      ))}
    </List>
  );
};

export const DisplayFilename = ({ file }: { file: File }) => {
  return (
    <Box sx={{ display: 'flex', minWidth: 0, maxWidth: { xs: 260, sm: 600 } }}>
      <Typography sx={{ textOverflow: 'ellipsis', whiteSpace: 'nowrap', overflow: 'hidden' }}>
        {/* eslint-disable-next-line */}
        {file.name.replace(/^.*[\\\/]/, '').split('.')[0]}
      </Typography>
      <Typography component='span' sx={{ flexShrink: 0 }}>
        {`.${file.type.replace(/(.*)\//g, '')}`}
      </Typography>
    </Box>
  );
};

export interface AgencyReviewStepProps {}

export const AgencyReviewStep = (props: AgencyReviewStepProps) => {
  const { values } = useFormikContext<AgencyAppValues>();

  return (
    <Box>
      <Card sx={{ my: 4, mx: 2 }}>
        <CardContent>
          <Grid container spacing={4}>
            <Grid xs={12} sm={6}>
              <Typography variant='overline' sx={{ color: 'text.secondary' }}>
                Company
              </Typography>
              <Typography variant='h6' gutterBottom>
                {values.orgName}
              </Typography>
              <Typography>{`${values?.address?.addressLine1}${
                values.address?.addressLine2 ? ', ' + values.address?.addressLine2 : ''
              }`}</Typography>
              <Typography>{`${values.address?.city}, ${values.address?.state} ${values.address?.postal}`}</Typography>
            </Grid>
            <Grid xs={12} sm={6}>
              <Typography variant='overline' sx={{ color: 'text.secondary' }}>
                Primary Contact
              </Typography>
              <ContactList
                items={[
                  {
                    primaryText: `${values?.contact?.firstName} ${values?.contact?.lastName}`,
                    icon: <PersonRounded fontSize='small' color='primary' />,
                    listItemTextProps: {
                      sx: { whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden ' },
                    },
                  },
                  {
                    primaryText: `${values?.contact?.email}`,
                    icon: <EmailRounded fontSize='small' color='primary' />,
                    listItemTextProps: {
                      sx: { whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden ' },
                    },
                  },
                  {
                    primaryText: formatPhoneNumber(`${values?.contact?.phone}`) || '',
                    icon: <PhoneRounded fontSize='small' color='primary' />,
                    listItemTextProps: {
                      sx: { whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden ' },
                    },
                  },
                ]}
              />
            </Grid>
            {/* <Grid xs={12} display='flex' justifyContent='stretch' sx={{ flexWrap: 'wrap' }}>
              <Box sx={{ width: '100%', flex: '1 0 auto' }}>
                <Divider />
                <Typography variant='overline' sx={{ color: 'text.secondary' }}>
                  Banking Details
                </Typography>
              </Box>
              <Box sx={{ flex: '1 0 auto' }}>
                <Typography variant='caption' sx={{ color: 'text.secondary' }}>
                  Routing Number
                </Typography>
                <Typography>{maskStringShowLast(values?.routingNumber, 4)}</Typography>
              </Box>
              <Box sx={{ flex: '1 0 auto' }}>
                <Typography variant='caption' sx={{ color: 'text.secondary' }}>
                  Account Number
                </Typography>
                <Typography>{maskStringShowLast(values?.accountNumber, 4)}</Typography>
              </Box>
            </Grid> */}
            <Grid xs={12}>
              <Divider />
              <Stack
                spacing={4}
                direction={{ xs: 'column', sm: 'row' }}
                display='flex'
                justifyContent='flex-start'
                alignItems='flex-start'
              >
                <Box sx={{ flex: '0 0 auto', pt: 3, pb: 2, mr: 6 }}>
                  <Typography
                    variant='caption'
                    sx={{ color: 'text.secondary', pr: 1, lineHeight: 2 }}
                  >
                    FEIN:
                  </Typography>
                  <Typography>{values?.FEIN}</Typography>
                </Box>

                <Box
                  sx={{
                    // flex: '1 0 auto',
                    // display: 'flex',
                    // flexDirection: 'column',
                    minWidth: 0,
                    pt: 3,
                    pb: 2,
                    // whiteSpace: 'nowrap',
                    // overflow: 'hidden',
                    // textOverflow: 'ellipsis',
                  }}
                >
                  <Typography
                    variant='caption'
                    sx={{ color: 'text.secondary', display: 'block', lineHeight: 2 }}
                  >
                    E&nbsp;&&nbsp;O:{' '}
                  </Typography>
                  {values.EandO && typeof values.EandO[0] !== 'string' ? (
                    <DisplayFilename file={values?.EandO[0] || ''} />
                  ) : (
                    ''
                  )}
                </Box>
              </Stack>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
      <Card sx={{ my: 4, mx: 2 }}>
        <CardContent sx={{ width: '100%', overflow: 'hidden' }}>
          <Typography variant='overline' sx={{ color: 'text.secondary', pr: 1 }}>
            Agents
          </Typography>
          <TableContainer component={Paper} sx={{ mt: 3, mb: 2, maxHeight: 228 }}>
            <Table stickyHeader sx={{ width: '100%' }} aria-label='agents table'>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell align='left'>Email</TableCell>
                  <TableCell align='left'>Phone</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {values.agents?.map((agent) => (
                  <TableRow key={agent.email}>
                    <TableCell component='th' scope='row'>
                      {`${agent.firstName} ${agent.lastName}`}
                    </TableCell>
                    <TableCell align='left'>{agent.email}</TableCell>
                    <TableCell align='left'>{formatPhoneNumber(agent.phone)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Box>
  );
};

export default AgencyReviewStep;

// <Stack
//   direction={{ xs: 'column', md: 'row' }}
//   spacing={4}
//   display='flex'
//   justifyContent='space-evenly'
//   alignItems='flex-start'
// >
//   <Box sx={{ flex: '1 0 auto' }}>
//     <Typography variant='overline' sx={{ color: 'text.secondary' }}>
//       Primary Contact
//     </Typography>
//     <ContactList
//       items={[
//         {
//           primaryText: `${values.firstName} ${values.lastName}`,
//           icon: <PersonRounded fontSize='small' color='primary' />,
//         },
//         {
//           primaryText: `${values.email}`,
//           icon: <EmailRounded fontSize='small' color='primary' />,
//         },
//         {
//           primaryText: formatPhoneNumber(`${values.phone}`) || '',
//           icon: <PhoneRounded fontSize='small' color='primary' />,
//         },
//       ]}
//     />
//   </Box>
//   <Box sx={{ flex: '1 0 auto' }}>
//     <Typography variant='overline' sx={{ color: 'text.secondary' }}>
//       Principal Producer
//     </Typography>
//     <ContactList
//       items={[
//         {
//           primaryText: `${values.producerFirstName} ${values.producerLastName}`,
//           icon: <PersonRounded fontSize='small' color='primary' />,
//         },
//         {
//           primaryText: `${values.producerEmail}`,
//           icon: <EmailRounded fontSize='small' color='primary' />,
//         },
//         {
//           primaryText: formatPhoneNumber(`${values.producerPhone}`) || '',
//           icon: <PhoneRounded fontSize='small' color='primary' />,
//         },
//         {
//           primaryText: `${values.producerNPN} (NPN)`,
//           icon: <PersonSearchRounded fontSize='small' color='primary' />,
//         },
//       ]}
//     />
//   </Box>
// </Stack>;
