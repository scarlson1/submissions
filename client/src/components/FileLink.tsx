import React, { useState, useEffect } from 'react';
import { Box, Link, Typography } from '@mui/material';

import { useOpenStorageFile } from 'hooks';

export interface FileLinkProps {
  filepath: string;
  url: string;
  fileType?: string;
}

export const FileLink: React.FC<FileLinkProps> = ({ filepath, url, fileType }) => {
  let { openFileInNewTab, error } = useOpenStorageFile();
  const [fileExt, setFileExt] = useState('');

  useEffect(() => {
    const fileArr = filepath.split('.');
    if (fileArr.length < 2) return;
    let ext = fileArr[fileArr.length - 1];
    if (ext.length === 3) {
      setFileExt(`.${ext}`);
    }
  }, [filepath]);

  const handleOpenFile = async (fileLocation: string) => {
    openFileInNewTab(fileLocation);
  };

  return (
    <>
      <Link
        underline='none'
        onClick={() => handleOpenFile(url)}
        sx={{ maxWidth: '100%', '&:hover': { cursor: 'pointer' } }}
      >
        <Box sx={{ display: 'flex', minWidth: 0, maxWidth: { xs: 260, sm: 600 } }}>
          <Typography
            sx={{
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
            }}
          >
            {/* eslint-disable-next-line */}
            {filepath.replace(/^.*[\\\/]/, '').split('.')[0]}
          </Typography>
          <Typography component='span' sx={{ flexShrink: 0 }}>
            {fileType ?? fileExt}
          </Typography>
        </Box>
      </Link>
      {Boolean(error) && <Typography>{error?.message}</Typography>}
    </>
  );
};

export default FileLink;
