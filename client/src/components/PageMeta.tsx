import { Helmet } from 'react-helmet-async';

export function PageMeta({ title }: { title: string }) {
  return (
    <Helmet>
      <title>{title}</title>
      <meta name='title' content={title} data-react-helmet='true'></meta>
      {/* <link rel='canonical' href='https://idemand-submissions.web.app/' /> */}
    </Helmet>
  );
}
