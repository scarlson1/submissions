import {
  ArrowBackRounded,
  AttachFileRounded,
  CheckCircleRounded,
  CircleRounded,
  CloseRounded,
  EmailRounded,
  PhoneRounded,
  SendRounded,
} from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  DialogContentText,
  Divider,
  Unstable_Grid2 as Grid,
  IconButton,
  ImageList,
  ImageListItem,
  Paper,
  Stack,
  Step,
  StepLabel,
  Stepper,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  addDoc,
  collection,
  orderBy,
  query,
  Timestamp,
  type CollectionReference,
  type DocumentData,
  type Query,
} from 'firebase/firestore';
import { getDownloadURL } from 'firebase/storage';
import { useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFirestore, useFirestoreCollectionData } from 'reactfire';

import {
  PolicyClaimStatus,
  StorageFolder,
  type PolicyClaim,
} from '@idemand/common';
import { LoadingSpinner, NotFound, PageMeta } from 'components';
import { UploadFilesDialogComponent } from 'elements/UploadFilesDialog';
import {
  useAsyncToast,
  useClaims,
  useDocData,
  useSafeParams,
  useUploadStorageFiles,
} from 'hooks';
import { formatFirestoreTimestamp, formatPhoneNumber } from 'modules/utils';
import { createPath, ROUTES } from 'router';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ClaimNote {
  id: string;
  text: string;
  images: string[];
  createdAt: Timestamp;
  createdBy: {
    userId: string;
    email: string | null;
  };
}

// ─── Status helpers ───────────────────────────────────────────────────────────

type StatusColor = 'default' | 'info' | 'warning' | 'success' | 'error';

const STATUS_LABELS: Record<string, string> = {
  draft: 'Draft',
  submitted: 'Submitted',
  under_review: 'Under Review',
  approved: 'Approved',
  denied: 'Denied',
  paid: 'Paid',
  closed: 'Closed',
};

const STATUS_COLORS: Record<string, StatusColor> = {
  draft: 'default',
  submitted: 'info',
  under_review: 'warning',
  approved: 'success',
  denied: 'error',
  paid: 'success',
  closed: 'default',
};

const TIMELINE_STEPS = [
  'Submitted',
  'Under Review',
  'Approved / Denied',
  'Paid',
  'Closed',
];

function getActiveStep(status: string): number {
  switch (status) {
    case 'draft':
      return -1;
    case 'submitted':
      return 0;
    case 'under_review':
      return 1;
    case 'approved':
    case 'denied':
      return 2;
    case 'paid':
      return 3;
    case 'closed':
      return 4;
    default:
      return -1;
  }
}

// ─── Main component ───────────────────────────────────────────────────────────

export function ClaimView() {
  const { policyId, claimId } = useSafeParams(['policyId', 'claimId']);
  const navigate = useNavigate();
  const { user, claims, orgId } = useClaims();
  const toast = useAsyncToast();
  const firestore = useFirestore();

  const [noteText, setNoteText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);

  const noteStoragePath = `${StorageFolder.enum.policies}/${policyId}/${StorageFolder.enum.claims}/${claimId}/notes`;
  const { uploadFiles, loading: uploadLoading } =
    useUploadStorageFiles(noteStoragePath);

  const { data: claim, status: claimStatus } = useDocData<PolicyClaim>(
    'policies',
    policyId,
    'claims',
    claimId,
  );

  const notesRef = useMemo<Query<ClaimNote, DocumentData>>(
    () =>
      query(
        collection(
          firestore,
          'policies',
          policyId,
          'claims',
          claimId,
          'notes',
        ) as CollectionReference<ClaimNote>,
        orderBy('createdAt', 'asc'),
      ),
    [firestore, policyId, claimId],
  );

  const { data: notes = [] } = useFirestoreCollectionData<ClaimNote>(notesRef, {
    idField: 'id',
  });

  const canAccess = useMemo(() => {
    if (!claim || !user) return false;
    if (claims?.iDemandAdmin) return true;
    if (claims?.orgAdmin) return claim.agency?.orgId === orgId;
    if (claims?.agent) return claim.agent?.userId === user.uid;
    return claim.submittedBy?.userId === user.uid;
  }, [claim, user, claims, orgId]);

  const canSubmitNote = useMemo(() => {
    if (!claim) return false;
    const closedStatuses: string[] = [
      PolicyClaimStatus.enum.closed,
      PolicyClaimStatus.enum.denied,
    ];
    return !closedStatuses.includes(claim.status);
  }, [claim]);

  const handleBack = () => navigate(createPath({ path: ROUTES.CLAIMS }));

  const handleNewFiles = useCallback((files: File[]) => {
    setPendingFiles((prev) => [...prev, ...files]);
  }, []);

  const handleRemoveFile = useCallback((file: File) => {
    setPendingFiles((prev) => prev.filter((f) => f !== file));
  }, []);

  // TODO: useMutation
  const handleSubmitNote = async () => {
    if (!noteText.trim() || !user) return;
    setSubmitting(true);
    toast.loading('Submitting...');
    try {
      let imageUrls: string[] = [];
      if (pendingFiles.length > 0) {
        const uploadResults = await uploadFiles(pendingFiles, {
          customMetadata: {
            claimId,
            policyId,
          },
        });
        imageUrls = await Promise.all(
          uploadResults.map((r) => getDownloadURL(r.ref)),
        );
      }
      await addDoc(
        collection(firestore, 'policies', policyId, 'claims', claimId, 'notes'),
        {
          text: noteText.trim(),
          images: imageUrls,
          createdAt: Timestamp.now(),
          createdBy: {
            userId: user.uid,
            email: user.email ?? null,
          },
        },
      );
      setNoteText('');
      setPendingFiles([]);
      toast.success('Information submitted.');
    } catch {
      toast.error('Failed to submit. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (claimStatus === 'loading') return <LoadingSpinner loading />;
  if (!claim) return <NotFound title='Claim not found' />;
  if (!canAccess) return <NotFound title='Access denied' />;

  const activeStep = getActiveStep(claim.status);
  const isDenied = claim.status === PolicyClaimStatus.enum.denied;
  const busy = submitting || uploadLoading;

  return (
    <>
      <PageMeta title={`iDemand - Claim ${claimId}`} />
      <Container maxWidth='lg' sx={{ py: { xs: 3, md: 5 } }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
          <Tooltip title='Back to claims'>
            <IconButton size='small' onClick={handleBack}>
              <ArrowBackRounded fontSize='small' />
            </IconButton>
          </Tooltip>
          <Typography
            variant='overline'
            color='text.secondary'
            sx={{ lineHeight: 1 }}
          >
            {`Policy: ${policyId}`}
          </Typography>
          <Box sx={{ flex: 1 }} />
          <Chip
            label={STATUS_LABELS[claim.status] ?? claim.status}
            color={STATUS_COLORS[claim.status] ?? 'default'}
            size='small'
          />
        </Box>

        <Typography variant='h5' gutterBottom>
          {`Claim ${claimId}`}
        </Typography>

        <Divider sx={{ mb: 4 }} />

        {/* Status stepper */}
        <Paper variant='outlined' sx={{ p: { xs: 2, sm: 3 }, mb: 4 }}>
          <Typography variant='subtitle2' color='text.secondary' gutterBottom>
            Status
          </Typography>
          <Stepper
            activeStep={isDenied ? 2 : activeStep}
            alternativeLabel
            sx={{ mt: 1 }}
          >
            {TIMELINE_STEPS.map((label, index) => {
              const isError = isDenied && index === 2;
              return (
                <Step key={label} completed={!isDenied && activeStep > index}>
                  <StepLabel
                    error={isError}
                    StepIconComponent={
                      activeStep > index && !isError
                        ? () => (
                            <CheckCircleRounded
                              color='success'
                              fontSize='small'
                            />
                          )
                        : index === activeStep
                          ? () => (
                              <CircleRounded
                                color={isError ? 'error' : 'primary'}
                                fontSize='small'
                              />
                            )
                          : undefined
                    }
                  >
                    <Typography variant='caption'>{label}</Typography>
                  </StepLabel>
                </Step>
              );
            })}
          </Stepper>
        </Paper>

        {/* Claim details */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid xs={12} sm={6} md={4}>
            <DetailItem
              label='Occurrence Date'
              value={formatFirestoreTimestamp(claim.occurrenceDate, 'date')}
            />
          </Grid>
          <Grid xs={12} sm={6} md={4}>
            <DetailItem
              label='Submitted'
              value={formatFirestoreTimestamp(claim.submittedAt, 'date')}
            />
          </Grid>
          <Grid xs={12} sm={6} md={4}>
            <DetailItem
              label='Location'
              value={
                claim.address
                  ? `${claim.address.addressLine1}, ${claim.address.city}, ${claim.address.state} ${claim.address.postal}`
                  : '—'
              }
            />
          </Grid>
          <Grid xs={12} sm={6} md={4}>
            <DetailItem
              label='Named Insured'
              value={claim.namedInsured?.displayName ?? '—'}
            />
          </Grid>
          {claim.contact && (
            <Grid xs={12} sm={6} md={4}>
              <Typography
                variant='caption'
                color='text.secondary'
                display='block'
              >
                Claim Contact
              </Typography>
              <Typography variant='body2' fontWeight={500}>
                {`${claim.contact.firstName} ${claim.contact.lastName}`}
              </Typography>
              <Stack
                direction='row'
                spacing={0.5}
                alignItems='center'
                sx={{ mt: 0.5 }}
              >
                <EmailRounded sx={{ fontSize: 14 }} color='action' />
                <Typography variant='caption'>{claim.contact.email}</Typography>
              </Stack>
              <Stack direction='row' spacing={0.5} alignItems='center'>
                <PhoneRounded sx={{ fontSize: 14 }} color='action' />
                <Typography variant='caption'>
                  {formatPhoneNumber(claim.contact.phone) ||
                    claim.contact.phone}
                </Typography>
              </Stack>
            </Grid>
          )}
          {claim.limits && (
            <Grid xs={12} sm={6} md={4}>
              <DetailItem
                label='Building Limit'
                value={
                  claim.limits.limitA != null
                    ? `$${Number(claim.limits.limitA).toLocaleString()}`
                    : '—'
                }
              />
            </Grid>
          )}
        </Grid>

        {/* Description */}
        {claim.description && (
          <Box sx={{ mb: 4 }}>
            <Typography variant='subtitle2' color='text.secondary' gutterBottom>
              Description
            </Typography>
            <Paper variant='outlined' sx={{ p: 2 }}>
              <Typography variant='body2'>{claim.description}</Typography>
            </Paper>
          </Box>
        )}

        {/* Claim images */}
        {claim.images?.length > 0 && (
          <Box sx={{ mb: 4 }}>
            <Typography variant='subtitle2' color='text.secondary' gutterBottom>
              {`Images (${claim.images.length})`}
            </Typography>
            <NoteImageList urls={claim.images} />
          </Box>
        )}

        {/* Activity / Notes */}
        <Box sx={{ mb: 4 }}>
          <Typography variant='subtitle2' color='text.secondary' gutterBottom>
            Activity
          </Typography>
          {notes.length === 0 && (
            <Typography variant='body2' color='text.disabled' sx={{ py: 1 }}>
              No additional information submitted yet.
            </Typography>
          )}
          <Stack spacing={2}>
            {notes.map((note) => (
              <Paper key={note.id} variant='outlined' sx={{ p: 2 }}>
                <Stack
                  direction='row'
                  justifyContent='space-between'
                  alignItems='flex-start'
                >
                  <Typography variant='caption' color='text.secondary'>
                    {note.createdBy?.email ??
                      note.createdBy?.userId ??
                      'Unknown'}
                  </Typography>
                  <Typography variant='caption' color='text.secondary'>
                    {formatFirestoreTimestamp(note.createdAt, 'relative')}
                  </Typography>
                </Stack>
                <Typography variant='body2' sx={{ mt: 0.5 }}>
                  {note.text}
                </Typography>
                {note.images?.length > 0 && (
                  <Box sx={{ mt: 1.5 }}>
                    <NoteImageList urls={note.images} />
                  </Box>
                )}
              </Paper>
            ))}
          </Stack>
        </Box>

        {/* Additional info form */}
        {canSubmitNote ? (
          <Box>
            <Typography variant='subtitle2' color='text.secondary' gutterBottom>
              Submit Additional Information
            </Typography>
            <Paper variant='outlined' sx={{ p: 2 }}>
              <TextField
                multiline
                minRows={3}
                fullWidth
                placeholder='Provide any additional details, updates, or documentation references…'
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                variant='outlined'
                size='small'
                disabled={busy}
              />

              {/* Staged image previews */}
              {pendingFiles.length > 0 && (
                <Box sx={{ mt: 1.5 }}>
                  <Typography variant='caption' color='text.secondary'>
                    {`${pendingFiles.length} image${pendingFiles.length !== 1 ? 's' : ''} attached`}
                  </Typography>
                  <Grid container spacing={1} sx={{ mt: 0.5 }}>
                    {pendingFiles.map((file, i) => (
                      <Grid xs={6} sm={4} md={3} key={i}>
                        <Box sx={{ position: 'relative' }}>
                          <img
                            src={URL.createObjectURL(file)}
                            alt={file.name}
                            style={{
                              width: '100%',
                              height: 100,
                              objectFit: 'cover',
                              borderRadius: 4,
                              display: 'block',
                            }}
                          />
                          <IconButton
                            size='small'
                            onClick={() => handleRemoveFile(file)}
                            sx={{
                              position: 'absolute',
                              top: 2,
                              right: 2,
                              bgcolor: 'background.paper',
                              '&:hover': { bgcolor: 'background.paper' },
                              p: 0.25,
                            }}
                          >
                            <CloseRounded sx={{ fontSize: 14 }} />
                          </IconButton>
                        </Box>
                      </Grid>
                    ))}
                  </Grid>
                </Box>
              )}

              <Stack
                direction='row'
                justifyContent='flex-end'
                sx={{ mt: 1.5 }}
                spacing={1}
              >
                <Tooltip title='Attach images'>
                  <IconButton
                    size='small'
                    onClick={() => setUploadDialogOpen(true)}
                    disabled={busy}
                  >
                    <AttachFileRounded fontSize='small' />
                  </IconButton>
                </Tooltip>
                <Button
                  variant='contained'
                  size='small'
                  endIcon={
                    busy ? (
                      <CircularProgress size={14} />
                    ) : (
                      <SendRounded fontSize='small' />
                    )
                  }
                  disabled={!noteText.trim() || busy}
                  onClick={handleSubmitNote}
                >
                  Submit
                </Button>
              </Stack>
            </Paper>

            {/* Image staging dialog — files are staged locally, uploaded on note submit */}
            <UploadFilesDialogComponent
              open={uploadDialogOpen}
              acceptedTypes='.png,.jpeg,.jpg'
              title='Attach Images'
              submitButtonText='Attach'
              files={pendingFiles}
              onNewFiles={handleNewFiles}
              onRemove={handleRemoveFile}
              onCancel={() => setUploadDialogOpen(false)}
              handleSubmit={async () => setUploadDialogOpen(false)}
            >
              <DialogContentText>
                Images will be uploaded when you submit the note.
              </DialogContentText>
            </UploadFilesDialogComponent>
          </Box>
        ) : (
          <Alert severity='info' variant='outlined'>
            This claim is{' '}
            {STATUS_LABELS[claim.status]?.toLowerCase() ?? claim.status}. No
            further information can be submitted.
          </Alert>
        )}
      </Container>
    </>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <Box>
      <Typography variant='caption' color='text.secondary' display='block'>
        {label}
      </Typography>
      <Typography variant='body2' fontWeight={500}>
        {value || '—'}
      </Typography>
    </Box>
  );
}

function NoteImageList({ urls }: { urls: string[] }) {
  return (
    <ImageList cols={4} gap={8}>
      {urls.map((url, i) => (
        <ImageListItem key={i}>
          <a href={url} target='_blank' rel='noopener noreferrer'>
            <img
              src={url}
              alt={`Image ${i + 1}`}
              loading='lazy'
              style={{
                width: '100%',
                height: 100,
                objectFit: 'cover',
                borderRadius: 4,
              }}
            />
          </a>
        </ImageListItem>
      ))}
    </ImageList>
  );
}
