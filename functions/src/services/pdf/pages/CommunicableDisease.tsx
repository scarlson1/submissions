import { Page, Text, View } from '@react-pdf/renderer';

import { styles } from '../styles';
import { InsetWrapper, OrderedListItem } from '../components';

export const CommunicableDiseasePage = () => {
  return (
    <Page size='A4' orientation='portrait' wrap={true} style={styles.page}>
      <View style={[styles.center]}>
        <Text style={[styles.heading2]}>Policyholder Notice</Text>
        <Text style={[styles.heading2]}>Communicable Disease Exclusion</Text>
      </View>
      <View style={[styles.section]}>
        <OrderedListItem
          number='1.'
          noParens
          content='Notwithstanding any provision to the contrary within the Policy, the Policy excludes any loss, damage, liability, claim, cost or expense of whatsoever nature, directly or indirectly caused by, contributed to by, resulting from, arising out of, or in connection with a Communicable Disease or the fear or threat (whether actual or perceived) of a Communicable Disease regardless of any other cause or event contributing concurrently or in any other sequence thereto.'
        />
        <OrderedListItem
          number='2.'
          noParens
          content='Subject to the other terms, conditions and exclusions contained in the Policy, the Policy will cover physical damage to property insured under the original policies and any Time Element Loss directly resulting therefrom where such physical damage is directly caused by or arising from any of the following perils if covered by the Policy: fire, lightning, explosion, aircraft or vehicle impact, falling objects, windstorm, rainstorm, hail, tornado, cyclone, typhoon, hurricane, earthquake, seaquake, seismic and/or volcanic disturbance/eruption, tsunami, flood, freeze, ice storm, weight of snow or ice, avalanche, meteor/asteroid impact, landslip, landslide, mudslide, bush fire, forest fire, riot, riot attending a strike, civil commotion, vandalism and malicious mischief.'
        />
        {/* </View>
      <View style={[styles.section]}> */}
        <Text style={[styles.paragraph, styles.textPrimary, styles.robotoBold, { marginTop: 8 }]}>
          Definitions
        </Text>
        <OrderedListItem
          number='1.'
          noParens
          content='Communicable Disease means any disease which can be transmitted by means of any substance or agent from any organism to another organism where:'
        />
        <InsetWrapper>
          <>
            <OrderedListItem
              number='1.1.'
              noParens
              content='the substance or agent includes, but is not limited to, a virus, bacterium, parasite or other organism or any variation thereof, whether deemed living or not, and'
            />
            <OrderedListItem
              number='1.2.'
              noParens
              content='the method of transmission, whether direct or indirect, includes but is not limited to, airborne transmission, bodily fluid transmission, transmission from or to any surface or object, solid, liquid or gas or between organisms, and'
            />
            <OrderedListItem
              number='1.3.'
              noParens
              content='the disease, substance or agent can cause or threaten damage to human health or human welfare or can cause or threaten damage to, deterioration of, loss of value of, marketability of or loss of use of property.'
            />
          </>
        </InsetWrapper>
        <OrderedListItem
          number='2.'
          noParens
          content='Time Element Loss means business interruption, contingent business interruption or any other consequential losses.'
        />
      </View>
      <View style={[styles.section]}>
        <Text style={[styles.paragraph, styles.textPrimary]}>
          All other terms shall remain unchanged.
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
