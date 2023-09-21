import { Page, Text, View } from '@react-pdf/renderer';

import { OrderedListItem } from '../components/index.js';
import { styles } from '../styles.js';

export const CyberPage = () => {
  return (
    <Page size='A4' orientation='portrait' wrap={true} style={styles.page}>
      <View style={[styles.section]}>
        <Text style={[styles.heading2, styles.textCenter]}>Policyholder Notice</Text>
        <Text style={[styles.heading2, styles.textCenter]}>Cyber Loss Limited Exclusion</Text>
      </View>
      <View style={[styles.section]}>
        <Text style={[styles.paragraph, styles.textPrimary, styles.padB]}>
          Notwithstanding any provision to the contrary within this reinsurance agreement or any
          endorsement thereto, this reinsurance agreement excludes all loss, damage, liability, cost
          or expense of whatsoever nature directly or indirectly caused by, contributed to by,
          resulting from, arising out of or in connection with:
        </Text>
        <OrderedListItem
          number='1.1'
          noParens
          content='any loss of, alteration of, or damage to or a reduction in the functionality, availability or operation of a Computer System, unless subject to the provisions of paragraph 2;'
        />
        <OrderedListItem
          number='1.2'
          noParens
          content='any loss of use, reduction in functionality, repair, replacement, restoration or reproduction of any Data, including any amount pertaining to the value of such Data.'
        />
        <OrderedListItem
          number='2'
          noParens
          content='Subject to the other terms, conditions and exclusions contained in this reinsurance agreement, this reinsurance agreement will cover physical damage to property insured under the original policies'
        />
        <OrderedListItem
          number='3'
          noParens
          content='and any Time Element Loss directly resulting therefrom where such physical damage is directly occasioned by any of the following perils: theft, fire, lightning, explosion, aircraft or vehicle impact, falling objects, windstorm, hail, tornado, cyclone, hurricane, earthquake, volcano, tsunami, flood, freeze or weight of snow'
        />
        <Text style={[styles.paragraph, styles.padV, styles.robotoBold]}>Definitions</Text>
        <OrderedListItem
          number='4'
          noParens
          content='Computer System means any computer, hardware, software, communications system, electronic device (including, but not limited to, smart phone, laptop, tablet, wearable device), server, cloud or microcontroller including any similar system or any configuration of the aforementioned and including any associated input, output, data storage device, networking equipment or back up facility.'
        />
        <OrderedListItem
          number='5'
          noParens
          content='Data means information, facts, concepts, code or any other information of any kind that is recorded or transmitted in a form to be used, accessed, processed, transmitted or stored by a Computer System.'
        />
        <OrderedListItem
          number='6'
          noParens
          content='Time Element Loss means business interruption, contingent business interruption or any other consequential losses.'
        />
        {/* <Text style={[styles.paragraph, styles.textPrimary]}>
          All other terms shall remain unchanged.
        </Text> */}
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
