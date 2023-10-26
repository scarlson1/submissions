import { DeleteRounded } from '@mui/icons-material';
import {
  Box,
  CardActions,
  CardMedia,
  Collapse,
  DialogContentText,
  Unstable_Grid2 as Grid,
  IconButton,
  Typography,
  alpha,
} from '@mui/material';
import { UploadResult, getDownloadURL } from 'firebase/storage';
import { useCallback, useState } from 'react';

import { DraftPolicyClaim, PolicyClaimFormValues, StorageFolder } from 'common';
import { FlexCard } from 'components';
import { WizardNavButtons } from 'components/forms';
import UploadFilesDialog from 'elements/UploadFilesDialog';
import { useAsyncToast, useCreateStorageFiles } from 'hooks';
import { logDev } from 'modules/utils';
import { BaseStepProps } from './ClaimFormWizard';

// TODO: image previews --> component - so it can be using in review step
export type ImageValues = Pick<PolicyClaimFormValues, 'images'>;

export interface ImageStepProps
  extends Pick<BaseStepProps<ImageValues>, 'saveFormValues' | 'onError'> {
  claimData: Partial<DraftPolicyClaim>;
  claimId: string;
}

export const ImagesStep = ({ saveFormValues, onError, claimData, claimId }: ImageStepProps) => {
  // const { nextStep } = useWizard();
  const toast = useAsyncToast({ position: 'bottom-right' });
  const [urlLoading, setUrlLoading] = useState(false);

  const handleGetUrls = useCallback(
    async (uploadResult: UploadResult[]) => {
      console.log('upload result: ', uploadResult);
      setUrlLoading(true);
      try {
        if (uploadResult.length > 0) {
          const currentImgURLs = [...(claimData.images || [])];
          let newResult = uploadResult;
          if (currentImgURLs.length + uploadResult.length > 10) {
            toast.warn(`limit of 10 photos`);
            newResult = uploadResult.slice(
              0,
              Math.abs(currentImgURLs.length - uploadResult.length)
            );
          }
          const promises = newResult.map((u) => getDownloadURL(u.ref));
          const downloadUrls = await Promise.all(promises);
          console.log('downloadUrls: ', downloadUrls);

          // TODO: storage as object with fullPath, ref, name, etc.
          // uploadResult[0].ref.toString()

          await saveFormValues({ images: [...currentImgURLs, ...downloadUrls] });
        }
      } catch (err: any) {
        logDev('Error getting storage download urls', err);
        onError && onError('Error getting image link');
      }
      setUrlLoading(false);
    },
    [toast, onError, saveFormValues, claimData]
  );

  const handleDelete = useCallback(
    async (imgURL: string) => {
      try {
        setUrlLoading(true);
        const newImages = [...(claimData.images || [])].filter((i) => i !== imgURL);
        await saveFormValues({ images: newImages });
        // TODO: remove img from storage (need to storage additional info about image to get ref --> might need to storage images as object)
      } catch (err: any) {
        logDev('Error removing image url: ', err);
        onError && onError(`Error removing image`);
      }
      setUrlLoading(false);
    },
    [saveFormValues, onError, claimData]
  );

  const {
    files: uploadFiles,
    loading: uploadLoading,
    handleNewFiles,
    handleRemoveFile,
    handleSubmit,
    handleCancel,
  } = useCreateStorageFiles(
    `${StorageFolder.enum.policies}/${claimData.policyId}/${StorageFolder.enum.claims}/${claimId}`,
    { claimId, policyId: claimData.policyId || null, locationId: claimData.locationId || null },
    handleGetUrls,
    (err, msg) => console.log('upload failed: ', msg, err)
  );

  // handleStep(async () => {
  //   try {
  //     await saveFormValues({ images: [] });
  //   } catch (err: any) {
  //     logDev('ERR: ', err);
  //     onError && onError('Error saving claim')
  //   }
  // });

  const dragAndDropDisabled = (claimData.images?.length || 0) > 10 || uploadLoading || urlLoading;

  return (
    <Box>
      <Typography align='center'>Please upload a few photos of the damage.</Typography>
      <Collapse in={claimData.images && claimData.images.length > 0}>
        <Grid
          container
          spacing={2}
          sx={{
            py: 5,
            overflowX: 'auto',
            flexWrap: 'nowrap',
            '&::-webkit-scrollbar': { display: 'none' },
          }}
        >
          {claimData.images?.length
            ? claimData.images.map((imgURL, i) => (
                <Grid xs={6} sm={4} md={3} key={imgURL} sx={{ flex: '0 0 auto' }}>
                  <TempImgPreview
                    fileId={imgURL}
                    src={imgURL}
                    alt={`Img - ${i + 1}`}
                    onDeleteClick={handleDelete}
                  />
                </Grid>
              ))
            : null}
        </Grid>
        <Typography align='center'>{`${
          claimData.images?.length || '0'
        } photo(s) selected`}</Typography>
      </Collapse>

      <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
        <UploadFilesDialog
          acceptedTypes='.png,.jpeg,.jpg'
          title='Claim Images'
          children={<DialogContentText>Select up to 10 photos.</DialogContentText>}
          openButtonText='Add images'
          filesDragDropProps={{
            multiple: true,
            maxFileSizeInBytes: 4194304,
            disabled: dragAndDropDisabled,
          }} // 4 MB
          loading={uploadLoading}
          files={uploadFiles}
          onNewFiles={handleNewFiles}
          onRemove={handleRemoveFile}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
        />
      </Box>
      <WizardNavButtons
        disabled={!claimData.images?.length}
        loading={uploadLoading || urlLoading}
      />
    </Box>
  );
};
// TODO: create view storage file image (generalize component with wrapper for passing storage ref)
const TempImgPreview = ({
  fileId,
  src,
  alt,
  onDeleteClick,
}: // deleteButtonProps
{
  fileId: string;
  src: string;
  alt: string;
  onDeleteClick: (id: string) => void;
  // deleteButtonProps: IconButtonProps
}) => {
  return (
    <FlexCard sx={{ maxWidth: 300, minHeight: 200, position: 'relative' }}>
      <CardMedia
        component='img'
        height='200'
        src={src}
        alt={alt}
        sx={{
          objectFit: 'cover',
          position: 'absolute',
          top: 0,
          right: 0,
          height: '100%',
          width: '100%',
        }}
      />
      <CardActions
        disableSpacing
        sx={{
          position: 'relative',
          padding: 1,
          backgroundColor: (theme) =>
            theme.palette.mode === 'dark'
              ? alpha(theme.palette.background.paper, 0.375)
              : 'rgba(255, 255, 255, 0.25)',
        }}
      >
        {/* <Typography variant='subtitle2' sx={{ fontSize: '0.75rem', ml: 2.5 }}>
          {formatBytes(selectedFile.size)}
        </Typography> */}
        <IconButton
          color='default'
          size='small'
          edge='end'
          sx={{ ml: 'auto' }}
          onClick={() => onDeleteClick(fileId)}
          // {...deleteButtonProps}
        >
          <DeleteRounded fontSize='small' color='inherit' />
        </IconButton>
      </CardActions>
    </FlexCard>
  );
};
