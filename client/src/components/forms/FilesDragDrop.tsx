import { useState, useCallback, useMemo, useRef } from 'react';
import { alpha, Box, Typography } from '@mui/material';
import Grid from '@mui/material/Unstable_Grid2';
import { AddPhotoAlternateOutlined } from '@mui/icons-material';
// import { toast } from 'react-toastify';
import toast from 'react-hot-toast';

import { ImgPreview } from 'components';
import { formatBytes } from 'modules/utils/helpers';

// TODO: move to stand alone component ?? posible with formik?
// actions & file state in parent component / hooks ??

const DEFAULT_MAX_FILE_SIZE_IN_BYTES = 1048576;

export interface FilesDragDropProps {
  files: File[];
  onNewFiles: (filesArr: File[]) => void;
  onRemove: (removeFile: File) => void;
  acceptedTypes: string;
  disabled?: boolean;
  multiple?: boolean;
  maxFileSizeInBytes?: number;
  maxFileCount?: number;
  loading?: boolean;
}

export const FilesDragDrop = ({
  files,
  onNewFiles,
  onRemove,
  acceptedTypes,
  disabled = false,
  multiple = false,
  maxFileSizeInBytes = DEFAULT_MAX_FILE_SIZE_IN_BYTES,
  maxFileCount = 10,
  loading = false,
}: FilesDragDropProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const acceptedTypesArr = useMemo(
    () => acceptedTypes.replaceAll('.', '').split(','),
    [acceptedTypes]
  );

  const handleNewVal = useCallback(
    (newArr: File[]) => {
      let filtered: File[] = [];
      if (newArr.length + files.length > maxFileCount) {
        newArr = newArr.slice(0, maxFileCount - files.length);
        toast.error(`Maxium of ${maxFileCount} ${maxFileCount > 1 ? 'files' : 'file'}`, {
          duration: 5000,
        });
      }
      for (let newFile of newArr) {
        console.log('new file: ', newFile);
        if (newFile.size > maxFileSizeInBytes) {
          toast.error(
            `File exceeds max file size of ${formatBytes(maxFileSizeInBytes)} (${newFile.name})`
          );
        } else if (!acceptedTypesArr.includes(newFile.name.split('.').pop()?.toLowerCase() || '')) {
          console.log(acceptedTypesArr, newFile.name.split('.').pop()?.toLowerCase());
          toast.error(`File does not match accepted file types ${acceptedTypes}`);
        } else if (!multiple) {
          onNewFiles([newFile]);
          return;
        } else {
          filtered.push(newFile);
        }
      }
      onNewFiles(filtered);
    },
    [
      maxFileSizeInBytes,
      acceptedTypes,
      acceptedTypesArr,
      maxFileCount,
      multiple,
      files.length,
      onNewFiles,
    ]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();

      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        console.log('dropped files: ', e.dataTransfer.files);

        handleNewVal(Array.from(e.dataTransfer.files));
      }
      setDragActive(false);
    },
    [handleNewVal]
  );

  const handleDragEnter = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  }, []);

  // handle if user opts to open finder to select files
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!e.target.files) return;
      handleNewVal(Array.from(e.target.files));
    },
    [handleNewVal]
  );

  const handleDelete = useCallback(
    (removeItem: any) => {
      onRemove(removeItem);
    },
    [onRemove]
  );

  const handleUploadBtnClick = () => {
    inputRef.current?.click();
  };

  return (
    <>
      <Box
        onDrop={(e) => handleDrop(e)}
        onDragEnter={(e) => handleDragEnter(e)}
        onDragLeave={(e) => handleDragLeave(e)}
        sx={{
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          border: (theme) =>
            `2px dashed ${dragActive ? theme.palette.primary.main : theme.palette.divider}`,
          borderRadius: '8px',
          backgroundColor: (theme) =>
            dragActive ? alpha(theme.palette.grey[100], 0.05) : 'inherit',
          pt: { xs: 4, sm: 6, md: 8 },
          pb: { xs: 5, sm: 8, md: 10 },
          px: 5,
          my: 5,
          '&:hover': { cursor: 'pointer' },
        }}
      >
        <AddPhotoAlternateOutlined
          fontSize='large'
          sx={{ mb: 3, color: (theme) => theme.palette.grey[500] }}
        />
        <Box sx={{ pt: 3 }}>
          <Box
            typography='subtitle1'
            component='span'
            color='primary.main'
            sx={{
              fontWeight: 'fontWeightMedium',
              mr: 0.5,
              '&:hover': { textDecoration: 'underline' },
            }}
            onClick={handleUploadBtnClick}
          >
            Browse Files&nbsp;
          </Box>
          <Typography variant='subtitle1' component='span' sx={{ color: 'text.secondary' }}>
            {`or drag and drop ${multiple ? 'files' : 'a file'}`}
          </Typography>
        </Box>
        <Typography
          component='div'
          variant='caption'
          sx={{ color: 'text.secondary', mt: 1 }}
        >{`${acceptedTypes.replaceAll(',', ', ')} up to ${formatBytes(
          maxFileSizeInBytes
        )}`}</Typography>
        <Box
          component='input'
          type='file'
          accept={acceptedTypes}
          hidden
          onChange={handleChange}
          multiple={multiple}
          ref={inputRef}
          disabled={loading || disabled}
          sx={{
            display: 'block',
            width: '100%',
            border: 'none',
            textTransform: 'none',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            opacity: 0,
            color: 'rgba(0,0,0,0)',
            '&:hover': { cursor: 'pointer' },
            '&:focus': { outline: 'none' },
          }}
        />
      </Box>

      <Box>
        <Typography variant='overline' sx={{ color: 'text.secondary' }}>
          {files.length > 0 ? `Selected ${multiple ? 'Files' : 'File'}` : `No files selected`}
        </Typography>
        <Grid container spacing={3}>
          {files.length > 0 &&
            files.map((file: File) => (
              <Grid xs={6} md={4} key={file.name}>
                <ImgPreview
                  selectedFile={file}
                  onDelete={handleDelete}
                  deleteButtonProps={{ disabled }}
                />
              </Grid>
            ))}
        </Grid>
      </Box>
    </>
  );
};

export default FilesDragDrop;
