import { Page, Text, View } from '@react-pdf/renderer';

import { styles } from '../styles';
import { EndorsementReadCarefully, OrderedListItem } from '../components';

export const SinkholePage = () => {
  return (
    <Page size='A4' orientation='portrait' wrap={true} style={styles.page}>
      <View style={[styles.center]}>
        <View style={{ paddingBottom: 16 }}>
          <EndorsementReadCarefully />
        </View>
        <Text style={[styles.heading2]}>Sinkhole & Catastrophic Ground Collapse Endorsement</Text>
      </View>
      <View style={[styles.section]}>
        <Text style={[styles.paragraph, styles.textPrimary]}>
          This Policy excludes Loss resulting from the perils of Sinkhole and Catastrophic Ground
          Cover Collapse, unless the Sinkhole or Catastrophic Ground Cover Collapse is caused by, or
          a direct result of, a Covered Peril under this Policy.
        </Text>
        <Text style={[styles.paragraph, styles.textPrimary]}>
          “Catastrophic Ground Cover Collapse” means geological activity that results in all the
          following:
        </Text>
        <OrderedListItem number='1.' noParens content='The abrupt collapse of the ground cover;' />
        <OrderedListItem
          number='2.'
          noParens
          content='A depression in the ground cover clearly visible to the naked eye;'
        />
        <OrderedListItem
          number='3.'
          noParens
          content='Structural damage to the covered building, including the foundation; and'
        />
        <OrderedListItem
          number='4.'
          noParens
          content='The insured structure being condemned and ordered to be vacated by the governmental agency authorized by law to issue such an order for that structure.'
        />
      </View>
      <View style={[styles.section]}>
        <Text style={[styles.paragraph, styles.textPrimary]}>
          “Sinkhole” means a landform created by subsidence of soil, sediment, or rock as underlying
          strata are dissolved by groundwater. A Sinkhole forms by collapse into subterranean voids
          created by dissolution of limestone or dolostone or by subsidence as these strata are
          dissolved.
        </Text>
        <Text style={[styles.paragraph, styles.textPrimary]}>
          “Sinkhole Activity” means settlement or systematic weakening of the earth supporting the
          covered building only if the settlement or systematic weakening results from
          contemporaneous movement or raveling of soils, sediments, or rock materials into
          subterranean voids created by the effect of water on a limestone or similar rock
          formation.
        </Text>
        <Text style={[styles.paragraph, styles.textPrimary]}>
          “Sinkhole Loss” means structural damage to the covered building, including the foundation,
          caused by Sinkhole Activity. Contents coverage and additional living expenses apply only
          if there is structural damage to the covered building caused by Sinkhole Activity.
        </Text>
      </View>
      <View style={[styles.section]}>
        <Text style={[styles.paragraph, styles.textPrimary]}>
          All other “terms” shall remain unchanged.
        </Text>
      </View>
      <Text
        style={[styles.pageNumbers, styles.textSecondary]}
        render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`}
        fixed
      />
    </Page>
  );
};
