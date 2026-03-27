import { Page, Text, View } from '@react-pdf/renderer';

import { EndorsementReadCarefully, InsetWrapper, OrderedListItem } from '../components/index.js';
import { styles } from '../styles.js';

export const MinEarnedPremiumPage = () => {
  return (
    <Page size='A4' orientation='portrait' wrap={true} style={styles.page}>
      <View style={[styles.center]}>
        <View style={{ paddingBottom: 16 }}>
          <EndorsementReadCarefully />
        </View>
        <Text style={[styles.heading2]}>Flood Minimum Earned Premium Endorsement</Text>
      </View>
      <View style={[styles.section]}>
        <Text style={[styles.paragraph, styles.textPrimary]}>
          In the event of early termination or change of coverage during the term of this policy,
          the return unearned premium due or additional premium receivable by “you” shall be
          calculated prorata as to time, calculated by the number of days the coverage was in force
          as a percent of the total number of days the coverage was purchased, subject to criteria
          as follows:
        </Text>
      </View>
      <View style={{ paddingHorizontal: 10 }}>
        <OrderedListItem number='1' content='Early Termination or Change in Coverage By' />
        <InsetWrapper>
          <OrderedListItem number='a' content='“You”' styles={[styles.robotoBold]} />
        </InsetWrapper>
        <InsetWrapper insetLevel={2}>
          <OrderedListItem
            number='i'
            content='Minimum earned premium from early termination of the policy shall earn based on the maximum of the following:'
            styles={[styles.robotoBold]}
          ></OrderedListItem>
        </InsetWrapper>
        <InsetWrapper insetLevel={3}>
          <OrderedListItem
            number='(1)'
            noParens={true}
            content='Minimum earned premium for policy year: 25% of annualized premium; or'
          />
        </InsetWrapper>
        <InsetWrapper insetLevel={3}>
          <OrderedListItem
            number='(2)'
            noParens={true}
            content='Prorata as to time the policy/transaction was in force.'
          />
        </InsetWrapper>
        <InsetWrapper insetLevel={3}>
          <OrderedListItem
            number=''
            noParens={true}
            content='Non-payment of premium, early termination for misrepresentation, or fraud by “you” shall also be considered early termination by “you.”'
            styles={{ marginLeft: -12 }}
          />
        </InsetWrapper>
        <InsetWrapper>
          <OrderedListItem number='b' content='“Us”' styles={styles.robotoBold} />
        </InsetWrapper>
        <InsetWrapper insetLevel={2}>
          <OrderedListItem
            number=''
            noParens={true}
            content='Prorata time for the policy term.'
            styles={{ marginLeft: -12 }}
          />
        </InsetWrapper>
        <OrderedListItem
          number={2}
          content='All inspection and MGA/Policy fees are earned 100% on the effective date of the policy or transaction for which the fee was charged.'
        />
        <OrderedListItem
          number={3}
          content='All surplus lines tax/fees charged as a percent of premium will be returned prorata percent of the return unearned premium percentage of the total premium paid, subject to any regulatory guidelines.'
        />
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
