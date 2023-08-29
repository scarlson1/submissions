import { Link, LinkProps, Typography, TypographyProps } from '@mui/material';
import { ref } from 'firebase/storage';
import { ReactNode, Suspense } from 'react';
import { ErrorBoundary, ErrorBoundaryPropsWithFallback } from 'react-error-boundary';
import { useStorage, useStorageDownloadURL } from 'reactfire';

interface DownloadStorageFileButtonComponentProps extends Omit<TypographyProps, 'onClick'> {
  filePath: string;
  linkProps?: Omit<LinkProps, 'href' | 'download'>;
  children?: string;
}

export function DownloadStorageFileButtonComponent({
  filePath,
  linkProps,
  children = 'download file',
  ...props
}: DownloadStorageFileButtonComponentProps) {
  const storage = useStorage();
  const templateRef = ref(storage, filePath);
  const { data: templateURL } = useStorageDownloadURL(templateRef);

  return (
    <Typography variant='button' {...props}>
      <Link href={templateURL} download {...linkProps}>
        {children}
      </Link>
    </Typography>
  );
}

interface DownloadStorageFileButtonProps extends DownloadStorageFileButtonComponentProps {
  fallback?: ErrorBoundaryPropsWithFallback['fallback'];
  suspenseComponent?: ReactNode;
}

export function DownloadStorageFileButton({
  fallback = null,
  suspenseComponent = null,
  ...componentProps
}: DownloadStorageFileButtonProps) {
  return (
    <ErrorBoundary fallback={fallback || <div />}>
      <Suspense fallback={suspenseComponent || <div />}>
        <DownloadStorageFileButtonComponent {...componentProps} />
      </Suspense>
    </ErrorBoundary>
  );
}
