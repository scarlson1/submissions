import { Page, Text, View } from '@react-pdf/renderer';

import { PDFProps } from '../generatePolicyDecPDF.js';
import { styles } from '../styles.js';

interface StateDisclosurePageProps {
  data: PDFProps['data'];
}

export const StateDisclosurePage = ({ data }: StateDisclosurePageProps) => {
  return (
    <Page size='A4' orientation='portrait' wrap={true} style={styles.page}>
      <View style={[styles.section]}>
        <Text style={[styles.heading2, styles.textCenter]}>State Disclosure</Text>
        <Text style={[styles.overline, styles.textSecondary, styles.textCenter]}>
          {data.homeStateFullName || ''}
        </Text>
        <View style={{ paddingVertical: 12 }}>
          <Text style={getDisclosureStyles(data.homeState)}>{data.disclosure}</Text>
        </View>
      </View>
      <Text
        style={[styles.pageNumbers, styles.textSecondary]}
        render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`}
        fixed
      />
    </Page>
  );
};

function getDisclosureStyles(state: string) {
  if (!state) return [];
  // @ts-ignore
  let stateStyle = [styles[`disclosure${state}`]] || [];

  return [styles.disclosure, ...stateStyle];
}
