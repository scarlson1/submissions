// import React from 'react';
import ReactPDF, { Page, Text, View, Document, StyleSheet, Image } from '@react-pdf/renderer';
import { LocationsSection } from './Table';

export const IDEMAND_LOGO_URL = 'https://scarlson1.github.io/iDemand_SPI_720x240.png';

const TEST_LOCATIONS = [
  {
    test1: 'test one',
    test2: '123123',
    test3: 'slkjf s ',
  },
  {
    test1: 'test 2',
    test2: '12323123',
    test3: 'slkjf slkfj slkfjasdf   ',
  },
  {
    test1: 'test 3',
    test2: '123234123',
    test3: 'slkjf slkfj slkfj asdf sdf  ',
  },
  {
    test1: 'test 4',
    test2: '1231asdf23',
    test3: 'slkjf slkfj slkfj as ',
  },
  {
    test1: 'test 5',
    test2: '12323123',
    test3: 'slkjf slkfj slkfj slkdfj lkjsdf ',
  },
  {
    test1: 'test 6',
    test2: '123',
    test3: 'slkjf slkfj slkfj ',
  },
];

interface LocationInterestsItem {
  locationAddress: string;
  interestType: string;
  name: string;
  interestAddress: string;
  loanNumber: string;
}

interface LocationCoveragesItem {
  address: string;
  limitA: string;
  limitB: string;
  limitC: string;
  limitD: string;
  TIV: string;
}

interface PremiumTableItem {
  itemTitle: string;
  subjectAmount: string;
  rate: string;
  value: string;
}

interface DecPageTemplateData extends Record<string, unknown> {
  policyId: string;
  insuredEmail: string;
  insuredPhone?: string;
  insuredName: string;
  mailingAddressName: string;
  mailingAddressLine1: string;
  mailingAddressLine2: string;
  mailingCity: string;
  mailingPostal: string;
  mailingState: string;
  policyEffectiveDate: string;
  policyExpirationDate: string;
  issuingCarrier: string;
  agencyName: string;
  agencyAddressLine1: string;
  agencyAddressLine2: string;
  agencyCity: string;
  agencyState: string;
  agencyPostal: string;
  agentName: string;
  agentEmail: string;
  agentphone: string;
  surplusLinesLicenseNum: string;
  surplusLinesLicensePhone: string;
  surplusLinesLicenseState: string;
  surplusLinesName: string;
  mortgagee?: string;
  mortgageeAddressLine1?: string;
  mortgageeAddressLine2?: string;
  mortgageeCity?: string;
  mortgageeState?: string;
  mortgageePostal?: string;
  mortgageeLoanNum?: string;
  locationCoverages: LocationCoveragesItem[];
  locationInterests: LocationInterestsItem[];
  premiumTable: PremiumTableItem[];
  docsAttached: { docTitle: string }[];
}

interface PDFProps {
  data: DecPageTemplateData;
}

// TODO: register fonts
// Font.register({ family: 'Roboto', src: source });

export const styles = StyleSheet.create({
  page: {
    // flexDirection: 'row',
    backgroundColor: '#E4E4E4',
    padding: 40,
    justifyContent: 'flex-start',
  },
  section: {
    margin: 10,
    padding: 10,
    // flexGrow: 1,
  },
  flexSection: {
    display: 'flex',
    flexDirection: 'row',
    width: '100%',
  },
  center: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-start',
    alignItems: 'center',
    width: '100%',
  },
  headerLogo: {
    height: '50px',
    width: '140px',
    marginBottom: 0,
    marginHorizontal: 100,
  },
  heading: {
    fontSize: 24,
    fontWeight: 600,
    color: '#131925',
    marginBottom: 8,
  },
  statement: {
    fontSize: 20,
    color: '#131925',
    lineHeight: 1.4,
    marginBottom: 4,
  },
  divider: {
    width: '100%',
    height: 1,
    backgroundColor: '#E7EBF0', // '#999999',
    margin: '24px 0 24px 0',
  },
  paragraph: {
    fontSize: 12,
    color: '#212935',
    lineHeight: 1.67,
  },
  textPrimary: {
    color: '#1A2027',
  },
  textSecondary: {
    color: '#3E5060',
  },
  columnParent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  columnStart: {
    flex: 1,
  },
  columnEnd: {
    flex: 1,
    alignItems: 'flex-end',
  },
  overline: {
    color: '#3E5060',
    fontFamily: 'Courier', // 'Helvetica' // 'Source Sans Pro',
    fontSize: '9px',
    textTransform: 'uppercase',
    lineHeight: 1.6,
    paddingBottom: 4,
  },
  blockPrimaryText: {
    fontSize: '11px',
    paddingBottom: 6,
  },
  blockSecondaryText: {
    fontSize: '8px',
    lineHeight: 1.5,
  },
});

const DecPagePDF = ({ data }: PDFProps) => {
  return (
    <Document
      creator='iDemand Insurace Agency, Inc.'
      title={`Policy declarations - ${data.policyId}`}
      subject='Policy declarations'
      author='iDemand'
    >
      <Page size='A4' orientation='portrait' wrap={true} style={styles.page}>
        <View style={{ ...styles.center }}>
          <Image
            style={styles.headerLogo}
            src={IDEMAND_LOGO_URL}
            // src='../../assets/iDemand_SPI_720x240.png'
          />
          <Text style={{ ...styles.overline }}>
            6017 Pine Ridge Rd., Suite 401, Naples, FL 34119
          </Text>
          <Text style={{ ...styles.overline }}>FLOOD POLICY DECLARATIONS</Text>
        </View>
        <View
          style={{
            ...styles.flexSection,

            paddingVertical: 30,
          }}
        >
          <View style={{ flex: '0 0 33.3%', paddingRight: 8 }}>
            <BlockTitle title='Policy ID' />
            <View>
              <Text
                style={{
                  ...styles.blockPrimaryText,
                  ...styles.textPrimary,
                }}
              >
                {data.policyId}
              </Text>
            </View>
          </View>
          <View style={{ flex: '0 0 33.3%', paddingRight: 8 }}>
            <BlockTitle title='Policy Start Date' />
            <View>
              <Text
                style={{
                  ...styles.blockPrimaryText,
                  ...styles.textPrimary,
                }}
              >
                {`${data.policyEffectiveDate} 12:01 AM`}
              </Text>
            </View>
          </View>
          <View style={{ flex: '0 0 33.3%', paddingRight: 8 }}>
            <BlockTitle title='Policy Expires' />
            <View style={{ width: '100%' }}>
              <Text
                style={{
                  ...styles.blockPrimaryText,
                  ...styles.textPrimary,
                }}
              >
                {`${data.policyExpirationDate} 12:01 AM`}
              </Text>
            </View>
          </View>
        </View>
        <View
          style={{
            ...styles.flexSection,

            paddingVertical: 30,
          }}
        >
          <View style={{ flex: '0 0 33.3%', paddingRight: 16 }}>
            <BlockTitle title='Named Insured' />
            <View>
              <Text
                style={{
                  ...styles.blockPrimaryText,
                  ...styles.textPrimary,
                }}
              >
                {data.insuredName}
              </Text>
              <Text style={{ ...styles.blockSecondaryText }}>{data.insuredEmail}</Text>
              {data.insuredPhone && (
                <Text style={{ ...styles.blockSecondaryText }}>{data.insuredPhone}</Text>
              )}
            </View>
          </View>
          <View style={{ flex: '0 0 33.3%', paddingRight: 16 }}>
            <BlockTitle title='Insured Mailing Address' />
            <View>
              <Text
                style={{
                  ...styles.blockPrimaryText,
                  ...styles.textPrimary,
                }}
              >
                {data.mailingAddressName}
              </Text>
              <Text style={{ ...styles.blockSecondaryText }}>{`${data.mailingAddressLine1} ${
                data.mailingAddressLine2 ? `, ${data.mailingAddressLine2}` : ''
              }`}</Text>
              <Text
                style={{ ...styles.blockSecondaryText }}
              >{`${data.mailingCity}, ${data.mailingState} ${data.mailingPostal}`}</Text>
            </View>
          </View>
          <View style={{ flex: '0 0 33.3%', paddingRight: 16 }}></View>
        </View>
        <View
          style={{
            ...styles.flexSection,
            paddingVertical: 30,
          }}
        >
          <View style={{ flex: '0 0 33.3%', paddingRight: 8 }}>
            <BlockTitle title='Insurer' />
            <View>
              <Text
                style={{
                  ...styles.blockPrimaryText,
                  ...styles.textPrimary,
                }}
              >
                {data.issuingCarrier}
              </Text>
              <Text style={{ ...styles.blockSecondaryText }}>633 East Main St.</Text>
              <Text style={{ ...styles.blockSecondaryText }}>Harrisonburg, VA 22801</Text>
            </View>
          </View>
          <View style={{ flex: '0 0 33.3%', paddingRight: 8 }}>
            <BlockTitle title='Program Administrator' />
            <View>
              <Text
                style={{
                  ...styles.blockPrimaryText,
                  ...styles.textPrimary,
                }}
              >
                iDemand Insurance Agency, Inc.
              </Text>
              <Text style={{ ...styles.blockSecondaryText }}>6017 Pine Ridge Rd., Suite 401</Text>
              <Text style={{ ...styles.blockSecondaryText }}>Naples, FL 34119</Text>
            </View>
          </View>
          <View style={{ flex: '0 0 33.3%', paddingRight: 8 }}>
            <BlockTitle title='Surplus Lines Producer License' />
            <View style={{ width: '100%' }}>
              {data.surplusLinesName && <KeyValItem title='Name:' value={data.surplusLinesName} />}
              {data.surplusLinesLicenseNum && (
                <KeyValItem title='License #:' value={data.surplusLinesLicenseNum} />
              )}
              {data.surplusLinesLicenseState && (
                <KeyValItem title='Issusing St.:' value={data.surplusLinesLicenseState} />
              )}
              {data.surplusLinesLicensePhone ? (
                <KeyValItem title='Phone:' value={data.surplusLinesLicensePhone} />
              ) : null}
            </View>
          </View>
        </View>
      </Page>
      <Page
        size='A4'
        orientation='landscape'
        wrap={true}
        style={{ ...styles.page, backgroundColor: '#ffffff' }}
      >
        <LocationsSection locations={TEST_LOCATIONS} />
      </Page>
    </Document>
  );
};

// export default async (data: DecPageTemplateData) => {
//   return await ReactPDF.renderToStream(<DecPagePDF {...{ data }} />);
// };

export const generatePolicyDecPDF = async (data: DecPageTemplateData) => {
  return await ReactPDF.renderToStream(<DecPagePDF {...{ data }} />);
};

function BlockTitle({ title }: any) {
  return <Text style={{ ...styles.overline }}>{title}</Text>;
}

interface KeyValItemProps {
  title: string;
  value: string;
}

function KeyValItem({ title, value }: KeyValItemProps) {
  return (
    <View
      style={{
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'flex-start',
        alignItems: 'flex-start',
        flexWrap: 'nowrap',
        // paddingBottom: 2,
      }}
    >
      <Text
        style={{
          ...styles.overline,
          // letterSpacing: 0.25,
          // wordSpacing: 3,
          lineHeight: 1.4,
          flex: '1 0 45%',
          paddingRight: 2,
        }}
      >
        {title}
      </Text>
      <Text
        style={{
          flex: '1 0 55%',
          // overflowWrap: 'break-word',
          ...styles.blockPrimaryText,
          ...styles.textPrimary,
          fontSize: 10,
        }}
      >
        {value}
      </Text>
    </View>
  );
}
