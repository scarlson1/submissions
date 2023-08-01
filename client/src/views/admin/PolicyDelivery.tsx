import { useCallback, useEffect, useMemo, useState } from 'react';
import { Box, Button, Stack, Typography, useTheme } from '@mui/material';
import { LoadingButton } from '@mui/lab';
import { OpenInNewRounded, SaveRounded } from '@mui/icons-material';
import { getDownloadURL } from 'firebase/storage';
import { doc, updateDoc } from 'firebase/firestore';
import { useFirestore } from 'reactfire';
import { useNavigate, useParams } from 'react-router-dom';
import ReactJson from '@microlink/react-json-view';

import { FilesDragDrop } from 'components/forms';
import { useAsyncToast, useCreateStorageFiles, useDocData, useSendEmail } from 'hooks';
import { policiesCollection, Policy, withIdConverter } from 'common';
import { ePayInstance } from 'api';
import { usePromptForEmails } from 'hooks/usePromptForEmails';
import { ROUTES, createPath } from 'router';
import { onlyUnique } from 'modules/utils';

// TODO: how should document delivery be tracked?? see history / check if doc was delivered ?? NEED TO USE SENDGRID WEBHOOK & STORE IN COLLECTION
// TODO: create custom tags for email delivery ('policy_delivery') https://docs.sendgrid.com/for-developers/sending-email/getting-started-email-activity-api#query-reference
// OR create templates and get by template ID

export const useUpdatePolicy = (
  onSuccess?: (msg: string) => void,
  onError?: (err: any) => void
) => {
  const firestore = useFirestore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updatePolicy = useCallback(
    // async (policyId: string, values: Partial<Policy>) => {
    async (policyId: string, values: Policy['documents']) => {
      try {
        setLoading(true);
        const ref = doc(policiesCollection(firestore), policyId).withConverter(
          withIdConverter<Policy>()
        );

        // TODO: fix typescript error so useUpdatePolicy can be used for all fields (error from imageURLs)
        await updateDoc(ref, { documents: values });
        setLoading(false);
        if (onSuccess) onSuccess(`Policy updated`);
      } catch (err) {
        setLoading(false);
        setError('An error occurred');
        if (onError) onError(err);
      }
    },
    [onSuccess, onError, firestore]
  );

  return useMemo(() => ({ updatePolicy, loading, error }), [updatePolicy, loading, error]);
};

export const useEPayTransaction = (id: string | null | undefined) => {
  const [transaction, setTransaction] = useState<any>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getTransactionData = useCallback(async (id: string) => {
    try {
      console.log(`FETCHING TRANSACTION DATA: ${id}`);
      setLoading(true);
      setError(null);
      const { data } = await ePayInstance.get(`/api/v1/transactions/${id}`);

      console.log('RES: ', data);
      setTransaction(data);
      setLoading(false);
    } catch (err) {
      console.log('ERROR: ', err);
      setError('Error fetching ePay transaction');
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!id) return;
    if (transaction && transaction.id === id) return;

    getTransactionData(id);
  }, [id, getTransactionData, transaction]);

  return useMemo(() => ({ transaction, loading, error }), [transaction, loading, error]);
};

export const PolicyDelivery = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const toast = useAsyncToast();
  const promptForEmails = usePromptForEmails();
  // const deliverDocs = useDeliverPolicyDoc();
  const { send } = useSendEmail({
    onSuccess: () => {
      toast.success('policy documents sent!');
      navigate(createPath({ path: ROUTES.POLICIES }));
    },
    onError: (msg) => toast.error(msg),
  });
  const { policyId } = useParams();
  if (!policyId) throw new Error('Missing policy ID in url');
  const { data } = useDocData('POLICIES', policyId, [], { idField: 'policyId' });

  const { updatePolicy } = useUpdatePolicy(console.log, console.error);

  const {
    files: uploadFiles,
    loading: uploadLoading,
    handleNewFiles,
    handleRemoveFile,
    handleSubmit,
    handleCancel,
  } = useCreateStorageFiles(
    `policies/${policyId}`,
    {
      policyId, // data.id,
      userId: data.userId || null,
      insuredEmail: data.namedInsured?.email || null,
      insuredName: `${data.namedInsured?.firstName} $${data.namedInsured?.lastName}`.trim() || null,
      agentId: data.agent.userId || null,
      agentname: data.agent.name || null,
      agencyId: data.agency.orgId || null,
      agencyName: data.agency.name || null,
    },
    async (uploadResult) => {
      console.log('upload successful', uploadResult);

      if (uploadResult.length > 0) {
        let downloadUrl = await getDownloadURL(uploadResult[0].ref);
        console.log('downloadUrl: ', downloadUrl);

        await updatePolicy(policyId, [
          {
            displayName: `Policy Document - ${policyId}`,
            downloadUrl,
            storagePath: uploadResult[0].metadata.fullPath,
          },
        ]);
      }
    },
    (err) => console.log('upload failed: ', err)
  );

  const showPolicyDoc = useCallback(() => {
    if (!data) return;
    let url = data.documents.length > 0 ? data.documents[0].downloadUrl : null;
    if (!url) return toast.error('no policy doc assigned to policy yet.');

    window.open(url, '_blank');
  }, [data, toast]);

  const handleDeliverDocs = useCallback(async () => {
    try {
      const emails = await promptForEmails(
        {
          insuredEmail: data?.namedInsured?.email || null,
          agentEmail: data?.agent?.email || null,
        },
        {
          title: 'Select emails for policy delivery',
          description:
            'Please select the emails to which you would like to deliver the policy, if any. If using alternative email, enter the email then press tab, space, or enter.',
          confirmButtonText: 'Send',
        }
      );

      if (!emails || emails.length < 1) throw new Error('no emails selected');

      const uniqEmails = emails.filter(onlyUnique);

      toast.loading('sending policy documents...');
      // TODO: filter unique emails in hook and backend
      await send({
        templateName: 'policy_delivery',
        policyId,
        to: uniqEmails, // emails,
      });
    } catch (err) {
      console.log('ERR: ', err);
      toast.error('documents not delivered');
    }
  }, [promptForEmails, send, toast, data, policyId]);

  return (
    <Box>
      <Box sx={{ display: 'flex' }}>
        <Typography variant='h5' sx={{ flex: '1 0 auto' }}>
          Admin Policy Delivery
        </Typography>
        <Stack direction='row' spacing={2}>
          <Button onClick={handleCancel} disabled={uploadLoading}>
            Cancel
          </Button>
          <LoadingButton
            onClick={handleSubmit}
            loading={uploadLoading}
            variant='contained'
            loadingPosition='start'
            startIcon={<SaveRounded />}
            disabled={uploadFiles.length < 1}
          >
            Upload
          </LoadingButton>
        </Stack>
      </Box>

      <FilesDragDrop
        files={uploadFiles}
        onNewFiles={handleNewFiles}
        onRemove={handleRemoveFile}
        loading={uploadLoading}
        acceptedTypes='.pdf'
      />

      <Box sx={{ py: 5 }}>
        <Button onClick={showPolicyDoc} endIcon={<OpenInNewRounded />}>
          Show current policy doc
        </Button>
        <Button
          onClick={handleDeliverDocs}
          variant='contained'
          sx={{ ml: 2 }}
          disabled={!data || data.documents.length < 1}
        >
          Deliver Docs
        </Button>
      </Box>
      <Typography color='text.secondary' sx={{ pt: 5, pb: 2 }}>
        What to do:
      </Typography>
      <Typography variant='body2' color='text.secondary'>
        - maunally generate the policy document(s)
      </Typography>
      <Typography variant='body2' color='text.secondary'>
        - select them above, then click 'upload' in the top right corner to add them to cloud
        storage
      </Typography>
      <Typography variant='body2' color='text.secondary'>
        - click deliver documents to email the policy docs to agent/insured
      </Typography>

      <Typography color='text.secondary' sx={{ pt: 5, pb: 2 }}>
        TODO:
      </Typography>
      <Typography variant='body2' color='text.secondary'>
        - allow multiple document uploads? Allow array or are the possible documents a fixed set?
      </Typography>
      <Typography variant='body2' color='text.secondary'>
        - get transaction data from ePay
      </Typography>
      <Typography color='text.secondary' sx={{ pt: 4, pb: 2 }}>
        Page purpose:{' '}
      </Typography>
      <Typography variant='body2' color='text.secondary'>
        - Upload policy documents
      </Typography>
      <Typography variant='body2' color='text.secondary'>
        - Final UW human intervention before delivering policy
      </Typography>
      <Typography variant='body2' color='text.secondary'>
        - Ensure payment, etc. all checkout before notifying and delivery to insured/agent
      </Typography>
      <Typography variant='body2' color='text.secondary'>
        - Send document delivery via email (attachment) (and link to view policy?) - need to finish
        template
      </Typography>

      <Box sx={{ py: 15 }}>
        <Typography color='text.secondary' sx={{ pb: 2 }}>
          Policy Data
        </Typography>
        {data && (
          <ReactJson
            src={data}
            theme={theme.palette.mode === 'dark' ? 'tomorrow' : 'rjv-default'}
            style={{ backgroundColor: 'transparent', fontSize: '0.8rem' }}
            iconStyle='circle'
            enableClipboard
            collapseStringsAfterLength={30}
          />
        )}
      </Box>
    </Box>
  );
};
