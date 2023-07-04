import { useState, useEffect } from 'react';

import { Box, Link, LinkProps, Typography, TypographyProps } from '@mui/material';

import { useOpenStorageFile } from 'hooks';

export interface FileLinkProps {
  filepath: string;
  url: string;
  fileType?: string;
  typographyProps?: TypographyProps;
  linkProps?: LinkProps;
}

export const FileLink = ({
  filepath,
  url,
  fileType,
  typographyProps,
  linkProps,
}: FileLinkProps) => {
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

  if (!filepath || !url) return null;

  return (
    <>
      <Link
        underline='none'
        onClick={() => handleOpenFile(url)}
        sx={{ maxWidth: '100%', '&:hover': { cursor: 'pointer' } }}
        {...linkProps}
      >
        <Box sx={{ display: 'flex', minWidth: 0, maxWidth: { xs: 260, sm: 600 } }}>
          <Typography
            {...typographyProps}
            sx={{
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
            }}
          >
            {/* eslint-disable-next-line */}
            {filepath.replace(/^.*[\\\/]/, '').split('.')[0]}
          </Typography>
          <Typography component='span' {...typographyProps} sx={{ flexShrink: 0 }}>
            {fileType ?? fileExt}
          </Typography>
        </Box>
      </Link>
      {Boolean(error) && <Typography>{error?.message}</Typography>}
    </>
  );
};

export default FileLink;
