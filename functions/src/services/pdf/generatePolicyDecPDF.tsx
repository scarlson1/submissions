import ReactPDF, { Page, Text, View, Document, Image } from '@react-pdf/renderer';

import {
  LocationsTable,
  PolicyDecPDFLocations,
  AdditionalInterestsItem,
  AdditionalInterestsTable,
  PremiumTable,
  PremiumTableItem,
} from './components';
import { styles } from './styles';
import { MinEarnedPremiumPage } from './pages/MinEarnedPremium';
import { CyberPage, StateDisclosurePage } from './pages';

export const IDEMAND_LOGO_URL = 'https://scarlson1.github.io/iDemand_SPI_720x240.png';

// TODO: delete testing data once done
// const LOCATIONS_DATA = [
//   {
//     address: '123 Main St. Nashville, TN 37203',
//     locationId: 'LK2J34LK234JKLJ23',
//     limitA: '$ 200,000',
//     limitB: '$ 50,000',
//     limitC: '$ 25,000',
//     limitD: '$ 0',
//     deductible: '$2, 000',
//     annualPremium: '$ 345.90',
//     termPremium: '$ 305.87',
//   },
//   {
//     address: '123 Main St. Nashville, TN 37203',
//     locationId: 'LK2J34LK234JKLJ23salkdfjaskdjf',
//     limitA: '$ 200,000',
//     limitB: '$ 50,000',
//     limitC: '$ 25,000',
//     limitD: '$ 0',
//     deductible: '$2, 000',
//     annualPremium: '$ 345.90',
//     termPremium: '$ 305.87',
//   },
//   {
//     address: '123 Main St. Nashville, TN 37203',
//     locationId: 'LK2J34LK234JKLJ23 lskdjflskjf',
//     limitA: '$ 200,000',
//     limitB: '$ 50,000',
//     limitC: '$ 25,000',
//     limitD: '$ 0',
//     deductible: '$2, 000',
//     annualPremium: '$ 345.90',
//     termPremium: '$ 305.87',
//   },
//   {
//     address: '123 Main St. Nashville, TN 37203',
//     locationId: 'LK2J34LK234JKLJ23',
//     limitA: '$ 200,000',
//     limitB: '$ 50,000',
//     limitC: '$ 25,000',
//     limitD: '$ 0',
//     deductible: '$2, 000',
//     annualPremium: '$ 345.90',
//     termPremium: '$ 305.87',
//   },
//   {
//     address: '123 Main St. Nashville, TN 37203',
//     locationId: 'LK2J34LK234JKLJ23',
//     limitA: '$ 200,000',
//     limitB: '$ 50,000',
//     limitC: '$ 25,000',
//     limitD: '$ 0',
//     deductible: '$2, 000',
//     annualPremium: '$ 345.90',
//     termPremium: '$ 305.87',
//   },
//   {
//     address: '123 Main St. Nashville, TN 37203',
//     locationId: 'LK2J34LK234JKLJ23',
//     limitA: '$ 200,000',
//     limitB: '$ 50,000',
//     limitC: '$ 25,000',
//     limitD: '$ 0',
//     deductible: '$2, 000',
//     annualPremium: '$ 345.90',
//     termPremium: '$ 305.87',
//   },
//   {
//     address: '123 Main St. Nashville, TN 37203',
//     locationId: 'LK2J34LK234JKLJ23',
//     limitA: '$ 200,000',
//     limitB: '$ 50,000',
//     limitC: '$ 25,000',
//     limitD: '$ 0',
//     deductible: '$2, 000',
//     annualPremium: '$ 345.90',
//     termPremium: '$ 305.87',
//   },
//   {
//     address: '123 Main St. Nashville, TN 37203',
//     locationId: 'LK2J34LK234JKLJ23',
//     limitA: '$ 200,000',
//     limitB: '$ 50,000',
//     limitC: '$ 25,000',
//     limitD: '$ 0',
//     deductible: '$2, 000',
//     annualPremium: '$ 345.90',
//     termPremium: '$ 305.87',
//   },
//   {
//     address: '123 Main St. Nashville, TN 37203',
//     locationId: 'LK2J34LK234JKLJ23',
//     limitA: '$ 200,000',
//     limitB: '$ 50,000',
//     limitC: '$ 25,000',
//     limitD: '$ 0',
//     deductible: '$2, 000',
//     annualPremium: '$ 345.90',
//     termPremium: '$ 305.87',
//   },
//   {
//     address: '123 Main St. Nashville, TN 37203',
//     locationId: 'LK2J34LK234JKLJ23',
//     limitA: '$ 200,000',
//     limitB: '$ 50,000',
//     limitC: '$ 25,000',
//     limitD: '$ 0',
//     deductible: '$2, 000',
//     annualPremium: '$ 345.90',
//     termPremium: '$ 305.87',
//   },
//   {
//     address: '123 Main St. Nashville, TN 37203',
//     locationId: 'LK2J34LK234JKLJ23',
//     limitA: '$ 200,000',
//     limitB: '$ 50,000',
//     limitC: '$ 25,000',
//     limitD: '$ 0',
//     deductible: '$2, 000',
//     annualPremium: '$ 345.90',
//     termPremium: '$ 305.87',
//   },
//   {
//     address: '123 Main St. Nashville, TN 37203',
//     locationId: 'LK2J34LK234JKLJ23',
//     limitA: '$ 200,000',
//     limitB: '$ 50,000',
//     limitC: '$ 25,000',
//     limitD: '$ 0',
//     deductible: '$2, 000',
//     annualPremium: '$ 345.90',
//     termPremium: '$ 305.87',
//   },
//   {
//     address: '123 Main St. Nashville, TN 37203',
//     locationId: 'LK2J34LK234JKLJ23',
//     limitA: '$ 200,000',
//     limitB: '$ 50,000',
//     limitC: '$ 25,000',
//     limitD: '$ 0',
//     deductible: '$2, 000',
//     annualPremium: '$ 345.90',
//     termPremium: '$ 305.87',
//   },
//   {
//     address: '123 Main St. Nashville, TN 37203',
//     locationId: 'LK2J34LK234JKLJ23',
//     limitA: '$ 200,000',
//     limitB: '$ 50,000',
//     limitC: '$ 25,000',
//     limitD: '$ 0',
//     deductible: '$2, 000',
//     annualPremium: '$ 345.90',
//     termPremium: '$ 305.87',
//   },
//   {
//     address: '123 Main St. Nashville, TN 37203',
//     locationId: 'LK2J34LK234JKLJ23',
//     limitA: '$ 200,000',
//     limitB: '$ 50,000',
//     limitC: '$ 25,000',
//     limitD: '$ 0',
//     deductible: '$2, 000',
//     annualPremium: '$ 345.90',
//     termPremium: '$ 305.87',
//   },
//   {
//     address: '123 Main St. Nashville, TN 37203',
//     locationId: 'LK2J34LK234JKLJ23',
//     limitA: '$ 200,000',
//     limitB: '$ 50,000',
//     limitC: '$ 25,000',
//     limitD: '$ 0',
//     deductible: '$2, 000',
//     annualPremium: '$ 345.90',
//     termPremium: '$ 305.87',
//   },
//   {
//     address: '123 Main St. Nashville, TN 37203',
//     locationId: 'LK2J34LK234JKLJ23',
//     limitA: '$ 200,000',
//     limitB: '$ 50,000',
//     limitC: '$ 25,000',
//     limitD: '$ 0',
//     deductible: '$2, 000',
//     annualPremium: '$ 345.90',
//     termPremium: '$ 305.87',
//   },
//   {
//     address: '123 Main St. Nashville, TN 37203',
//     locationId: 'LK2J34LK234JKLJ23',
//     limitA: '$ 200,000',
//     limitB: '$ 50,000',
//     limitC: '$ 25,000',
//     limitD: '$ 0',
//     deductible: '$2, 000',
//     annualPremium: '$ 345.90',
//     termPremium: '$ 305.87',
//   },
//   {
//     address: '123 Main St. Nashville, TN 37203',
//     locationId: 'LK2J34LK234JKLJ23',
//     limitA: '$ 200,000',
//     limitB: '$ 50,000',
//     limitC: '$ 25,000',
//     limitD: '$ 0',
//     deductible: '$2, 000',
//     annualPremium: '$ 345.90',
//     termPremium: '$ 305.87',
//   },
//   {
//     address: '123 Main St. Nashville, TN 37203',
//     locationId: 'LK2J34LK234JKLJ23',
//     limitA: '$ 200,000',
//     limitB: '$ 50,000',
//     limitC: '$ 25,000',
//     limitD: '$ 0',
//     deductible: '$2, 000',
//     annualPremium: '$ 345.90',
//     termPremium: '$ 305.87',
//   },
//   {
//     address: '123 Main St. Nashville, TN 37203',
//     locationId: 'LK2J34LK234JKLJ23',
//     limitA: '$ 200,000',
//     limitB: '$ 50,000',
//     limitC: '$ 25,000',
//     limitD: '$ 0',
//     deductible: '$2, 000',
//     annualPremium: '$ 345.90',
//     termPremium: '$ 305.87',
//   },
//   {
//     address: '123 Main St. Nashville, TN 37203',
//     locationId: 'LK2J34LK234JKLJ23',
//     limitA: '$ 200,000',
//     limitB: '$ 50,000',
//     limitC: '$ 25,000',
//     limitD: '$ 0',
//     deductible: '$2, 000',
//     annualPremium: '$ 345.90',
//     termPremium: '$ 305.87',
//   },
//   {
//     address: '123 Main St. Nashville, TN 37203',
//     locationId: 'LK2J34LK234JKLJ23',
//     limitA: '$ 200,000',
//     limitB: '$ 50,000',
//     limitC: '$ 25,000',
//     limitD: '$ 0',
//     deductible: '$2, 000',
//     annualPremium: '$ 345.90',
//     termPremium: '$ 305.87',
//   },
//   {
//     address: '123 Main St. Nashville, TN 37203',
//     locationId: 'LK2J34LK234JKLJ23',
//     limitA: '$ 200,000',
//     limitB: '$ 50,000',
//     limitC: '$ 25,000',
//     limitD: '$ 0',
//     deductible: '$2, 000',
//     annualPremium: '$ 345.90',
//     termPremium: '$ 305.87',
//   },
//   {
//     address: '123 Main St. Nashville, TN 37203',
//     locationId: 'LK2J34LK234JKLJ23',
//     limitA: '$ 200,000',
//     limitB: '$ 50,000',
//     limitC: '$ 25,000',
//     limitD: '$ 0',
//     deductible: '$2, 000',
//     annualPremium: '$ 345.90',
//     termPremium: '$ 305.87',
//   },
//   {
//     address: '123 Main St. Nashville, TN 37203',
//     locationId: 'LK2J34LK234JKLJ23',
//     limitA: '$ 200,000',
//     limitB: '$ 50,000',
//     limitC: '$ 25,000',
//     limitD: '$ 0',
//     deductible: '$2, 000',
//     annualPremium: '$ 345.90',
//     termPremium: '$ 305.87',
//   },
//   {
//     address: '123 Main St. Nashville, TN 37203',
//     locationId: 'LK2J34LK234JKLJ23',
//     limitA: '$ 200,000',
//     limitB: '$ 50,000',
//     limitC: '$ 25,000',
//     limitD: '$ 0',
//     deductible: '$2, 000',
//     annualPremium: '$ 345.90',
//     termPremium: '$ 305.87',
//   },
//   {
//     address: '123 Main St. Nashville, TN 37203',
//     locationId: 'LK2J34LK234JKLJ23',
//     limitA: '$ 200,000',
//     limitB: '$ 50,000',
//     limitC: '$ 25,000',
//     limitD: '$ 0',
//     deductible: '$2, 000',
//     annualPremium: '$ 345.90',
//     termPremium: '$ 305.87',
//   },
// ];

// const ADDL_INSUREDS_DATA = [
//   {
//     locationAddress: '123 Main St. Nashville, TN 37203',
//     locationId: '5-fcdeaa4-bfd8-4140-afb9-2409ea1c23de',
//     interestType: 'additional insured',
//     name: 'Jane Doe',
//     interestAddress: '',
//     loanNumber: '',
//   },
//   {
//     locationAddress: '123 Main St. Nashville, TN 37203',
//     locationId: '5-fcdeaa4-bfd8-4140-afb9-2409ea1c23de',
//     interestType: 'additional insured',
//     name: 'Jane Doe',
//     interestAddress: '',
//     loanNumber: '',
//   },
//   {
//     locationAddress: '123 Main St. Nashville, TN 37203',
//     locationId: '5-fcdeaa4-bfd8-4140-afb9-2409ea1c23de',
//     interestType: 'Mortgagee',
//     name: 'Better Mortgage Co.',
//     interestAddress: '2903 State St. New York, NY 10010',
//     loanNumber: '123TESTLOAN',
//   },
// ];

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
  // locationCoverages: LocationCoveragesItem[];
  locationData: PolicyDecPDFLocations[];
  locationInterests: AdditionalInterestsItem[];
  premiumTable: PremiumTableItem[];
  docsAttached: { docTitle: string }[];
  homeState: string;
  homeStateFullName: string;
  disclosure?: string;
}

export interface PDFProps {
  data: DecPageTemplateData;
}

const DecPagePDF = ({ data }: PDFProps) => {
  const shouldBreakInterests = data.locationData.length > 6;
  const shouldBreakPremium = data.locationInterests?.length > 6;

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
          <Text style={{ ...styles.overline, paddingBottom: 0 }}>
            6017 Pine Ridge Rd., Suite 401, Naples, FL 34119
          </Text>
          <Text style={{ ...styles.overline, paddingBottom: 0 }}>FLOOD POLICY DECLARATIONS</Text>
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
        <Text
          style={[styles.pageNumbers, styles.textSecondary]}
          render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`}
          fixed
        />
      </Page>
      <Page
        size='A4'
        orientation='landscape'
        wrap={true}
        style={{ ...styles.page, backgroundColor: '#ffffff' }}
      >
        <View style={{ paddingBottom: 20 }}>
          <Text style={[styles.heading2, styles.textCenter]}>Insured Locations</Text>
          {/* <LocationsTable data={[...data.locationData, ...LOCATIONS_DATA]} /> */}
          <LocationsTable data={data.locationData} />
        </View>
        {data.locationInterests?.length > 0 ? (
          <View style={{ paddingTop: 10, paddingBottom: 20 }} break={shouldBreakInterests}>
            <Text style={[styles.heading2, styles.textCenter]}>Additional Interests</Text>
            {/* <AdditionalInterestsTable data={[...data.locationInterests, ...ADDL_INSUREDS_DATA]} /> */}
            <AdditionalInterestsTable data={data.locationInterests} />
          </View>
        ) : null}
        <View
          style={{ paddingTop: 10, paddingBottom: 20 }}
          break={shouldBreakInterests || shouldBreakPremium}
        >
          <Text style={[styles.heading2, styles.textCenter]}>Premium, Taxes & Fees</Text>
          <PremiumTable data={data.premiumTable} />
        </View>
        <Text
          style={[styles.pageNumbers, styles.textSecondary]}
          render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`}
          fixed
        />
      </Page>
      <Page size='A4' orientation='portrait' wrap={true} style={styles.page}>
        {data.docsAttached?.length > 0 && (
          <>
            <View style={[styles.headerContainer]}>
              <Text style={[styles.tableHeader, styles.textSecondary]}>Attached Documents</Text>
            </View>
            {data.docsAttached.map((d, i) => (
              <View
                style={{
                  width: '100%',
                  paddingHorizontal: 10,
                  paddingVertical: 8,
                  borderBottom: '1px solid #E7EBF0',
                }}
                key={`${d.docTitle}-${i}`}
              >
                <Text style={[styles.blockPrimaryText]}>{d.docTitle}</Text>
              </View>
            ))}
          </>
        )}
        <View style={styles.section}>
          <Text style={[styles.textPrimary, styles.paragraph]}>
            This Policy Declaration updates and replaces any previously issued Policy Declarations.
          </Text>
        </View>
        <View style={[styles.section]}>
          <View style={[styles.signatureBox]}>
            <Text style={[styles.textPrimary, styles.signature]}>Ronald Carlson</Text>
          </View>
          <View style={{ paddingHorizontal: 4 }}>
            <Text style={[styles.paragraph]}>Ronald Carlson</Text>
            <Text style={[styles.textSecondary, styles.body2]}>CEO</Text>
            <Text style={[styles.textSecondary, styles.body2]}>iDemand Insurance Agency, Inc.</Text>
            <Text style={[styles.textSecondary, styles.body2]}>Program Administrator</Text>
          </View>
        </View>
        <Text
          style={[styles.pageNumbers, styles.textSecondary]}
          render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`}
          fixed
        />
      </Page>
      {data.disclosure ? <StateDisclosurePage data={data} /> : null}
      <MinEarnedPremiumPage />
      <CyberPage />
    </Document>
  );
};

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
