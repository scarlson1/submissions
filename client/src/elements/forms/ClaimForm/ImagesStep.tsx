import { DeleteRounded } from '@mui/icons-material';
import {
  Box,
  CardActions,
  CardMedia,
  Unstable_Grid2 as Grid,
  IconButton,
  Typography,
  alpha,
} from '@mui/material';
import { UploadResult, getDownloadURL } from 'firebase/storage';
import { useCallback, useState } from 'react';

import { DraftPolicyClaim, StorageFolder } from 'common';
import { FlexCard } from 'components';
import { WizardNavButtons } from 'components/forms';
import UploadFilesDialog from 'elements/UploadFilesDialog';
import { useCreateStorageFiles } from 'hooks';
import { logDev } from 'modules/utils';
import { BaseStepProps } from './ClaimFormWizard';

// TODO: need to separate out ImageValues (files) from fields stored in ClaimForm (paths/downloadURLs)
// TODO: image previews of uploaded files ??

// options: "add another" button --> opens dialog -> uploads to storage and returns uploadResult --> get download urls and save to file
// doesn't require form / formik ??
// how should "ImageValues" state be managed ??

export interface ImageValues {
  images: string[];
}

export interface ImageStepProps
  extends Pick<BaseStepProps<ImageValues>, 'saveFormValues' | 'onError'> {
  claimData: Partial<DraftPolicyClaim>;
  claimId: string;
}

export const ImagesStep = ({ saveFormValues, onError, claimData, claimId }: ImageStepProps) => {
  // const { nextStep } = useWizard();
  const [urlLoading, setUrlLoading] = useState(false);

  const handleGetUrls = useCallback(
    async (uploadResult: UploadResult[]) => {
      console.log('upload successful', uploadResult);
      setUrlLoading(true);
      try {
        if (uploadResult.length > 0) {
          const promises = uploadResult.map((u) => getDownloadURL(u.ref));
          const downloadUrls = await Promise.all(promises);
          console.log('downloadUrls: ', downloadUrls);

          // await updateDoc(washingtonRef, {
          //   regions: arrayUnion('greater_virginia'),
          // });
          // TODO: filter unique ?? (uploading the same image twice will still have unique refs/download urls)
          await saveFormValues({ images: [...(claimData.images || []), ...downloadUrls] });
        }
      } catch (err: any) {
        logDev('Error getting storage download urls', err);
        onError && onError('Error getting image link');
      }
      setUrlLoading(false);
    },
    [onError, saveFormValues, claimData]
  );

  const handleDelete = useCallback(
    async (imgURL: string) => {
      try {
        const newImages = [...(claimData.images || [])].filter((i) => i !== imgURL);
        await saveFormValues({ images: newImages });
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
      <Typography align='center' variant='h6'>
        Images
      </Typography>
      <Grid container spacing={3}>
        <Grid xs={12}>
          <Typography>{`Uploaded: [${claimData.images?.length || '0'}]`}</Typography>
        </Grid>
        {/* TODO: allow overflow w/ horizontal scroll */}
        {/* TODO: image preview w/ delete (see "imgPreview" component) */}
        {claimData.images?.length
          ? claimData.images.map((imgURL, i) => (
              <Grid xs={6} sm={4} md={3} key={imgURL}>
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
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
        <UploadFilesDialog
          acceptedTypes='.png,.jpeg,.jpg'
          title='Claim Images'
          // children={<DialogContentText>Select a new profile image.</DialogContentText>}
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
          // {...deleteButtonProps}
          color='default'
          size='small'
          edge='end'
          sx={{ ml: 'auto' }}
          onClick={() => onDeleteClick(fileId)}
        >
          <DeleteRounded fontSize='small' color='inherit' />
        </IconButton>
      </CardActions>
    </FlexCard>
  );
};
