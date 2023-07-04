import { useEffect, useState } from 'react';
import {
  CardMedia,
  IconButton,
  Typography,
  Box,
  CardActions,
  IconButtonProps,
} from '@mui/material';
import { DeleteRounded, InsertDriveFileRounded } from '@mui/icons-material';
import { alpha } from '@mui/material/styles';

import { FlexCard, FlexCardContent } from 'components';
import { formatBytes } from 'modules/utils/helpers';

export interface ImgPreviewProps {
  selectedFile: File;
  onDelete?: (file: File) => void;
  deleteButtonProps?: IconButtonProps;
}

// TODO: overlay info: https://codesandbox.io/s/material-ui-full-image-card-qb862?from-embed=&file=/src/FullImageCard/FullImageCard.js
export const ImgPreview = ({ selectedFile, onDelete, deleteButtonProps }: ImgPreviewProps) => {
  const [preview, setPreview] = useState<any>();
  const [isImage, setIsImage] = useState(false);

  useEffect(() => {
    if (!selectedFile) {
      setPreview(undefined);
      return;
    }

    const objectUrl = URL.createObjectURL(selectedFile);
    setPreview(objectUrl);

    // setIsImage(selectedFile.type.split('/')[0] === 'image');
    setIsImage(!!/\.(jpe?g|png|gif)$/i.test(selectedFile.name.toLowerCase()));

    return () => URL.revokeObjectURL(objectUrl);
  }, [selectedFile]);

  const handleDeleteClick = () => {
    if (onDelete) onDelete(selectedFile);
  };

  return (
    <FlexCard sx={{ maxWidth: 300, minHeight: 200, position: 'relative' }}>
      {isImage ? (
        <CardMedia
          component='img'
          height='200'
          src={preview}
          alt={selectedFile.name}
          sx={{
            objectFit: 'cover',
            position: 'absolute',
            top: 0,
            right: 0,
            height: '100%',
            width: '100%',
          }}
        />
      ) : (
        <CardMedia sx={{ position: 'absolute', top: 0, right: 0, height: '100%', width: '100%' }}>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              height: '100%',
              width: '100%',
            }}
          >
            <InsertDriveFileRounded />
          </Box>
        </CardMedia>
      )}
      <FlexCardContent sx={{ position: 'relative', backgroundColor: 'transparent' }}>
        <Typography
          variant='body2'
          sx={{ color: 'text.secondary', fontSize: '0.75rem', fontWeight: 'fontWeightBold' }}
        >
          {selectedFile.name}
        </Typography>
      </FlexCardContent>
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
        <Typography variant='subtitle2' sx={{ fontSize: '0.75rem', ml: 2.5 }}>
          {formatBytes(selectedFile.size)}
        </Typography>
        <IconButton
          color='default'
          size='small'
          edge='end'
          sx={{ ml: 'auto' }}
          onClick={handleDeleteClick}
          {...deleteButtonProps}
        >
          <DeleteRounded fontSize='small' color='inherit' />
        </IconButton>
      </CardActions>
    </FlexCard>
  );
};

export default ImgPreview;
