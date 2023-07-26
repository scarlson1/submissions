// @ts-nocheck
import * as React from 'react';
import ReactPDF, { Text, View, StyleSheet, Page } from '@react-pdf/renderer';

// https://stackoverflow.com/a/63299486/10887890

const styles = StyleSheet.create({
  page: { flexDirection: 'column', padding: 25 },
  table: {
    fontSize: 10,
    // width: 550,
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-start',
    alignContent: 'stretch',
    flexWrap: 'nowrap',
    alignItems: 'stretch',
  },
  row: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignContent: 'stretch',
    flexWrap: 'nowrap',
    alignItems: 'stretch',
    flexGrow: 1,
    flexShrink: 0,
    // flexBasis: 35,
    // borderColor: '#cc0000',
    borderColor: '#E7EBF0',
    borderStyle: 'solid',
    borderBottomWidth: 1,
  },
  cell: {
    // borderColor: '#cc0000',
    // borderStyle: 'solid',
    // borderWidth: 1,
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 'auto', // '25%',
    // flex: '0 0 auto',
    whiteSpace: 'wrap',
    alignSelf: 'stretch',
    // alignSelf: 'center',
    paddingVertical: 6,
    paddingHorizontal: 8,
    marginHorizontal: 4,
    display: 'flex',
    flexDirection: 'column', // 'row',
    justifyContent: 'flex-start',
  },
  header: {
    backgroundColor: '#F3F6F9', //'#eee',
    borderTopRightRadius: 10,
    borderTopLeftRadius: 10,
  },
  headerText: {
    fontFamily: 'Source Sans Pro',
    fontSize: 9,
    lineHeight: 1.2,
    textTransform: 'uppercase',
    // fontWeight: 500,
    color: '#3E5060', // '#1A2027', // '#1a245c',
    // margin: 4,
    alignSelf: 'center',
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  tableText: {
    margin: 10,
    fontSize: 10,
    color: '#1A2027', // neutralDark,
  },
  breakLongWords: {
    whiteSpace: 'normal',
    overflowWrap: 'break-word',
    wordWrap: 'break-word',
    wordBreak: 'break-all',
    hyphens: 'none', //  'auto',
  },
});

export interface ColumnDef {
  field: string;
  headerName: string;
  flex?: number;
  minWidth?: number;
  alignHeader?: 'left' | 'right' | 'center';
  alignContent?: 'left' | 'right' | 'center';
}

interface TableProps {
  columns: ColumnDef[];
  data: Record<string, any>[];
}

export const Table = ({ columns, data }: TableProps) => {
  const flexBasis = `${(100 / columns.length).toFixed(2)}%`;
  const width = `${(100 / columns.length).toFixed(2)}%`;

  return (
    <View style={styles.table}>
      <View style={[styles.row, styles.header]} fixed>
        {columns.map((c) => {
          const cellStyle = { width };

          if (c.flex) {
            cellStyle['flexBasis'] = `${flexBasis}`;
            cellStyle['flexGrow'] = c.flex;
            cellStyle['flexShrink'] = 0;
          }
          if (c.minWidth) cellStyle['minWidth'] = `${c.minWidth}px`;
          if (c.alignHeader) cellStyle['textAlign'] = c.alignHeader;

          return (
            <Text style={[styles.cell, styles.headerText, cellStyle]} key={c.field}>
              {c.headerName}
            </Text>
          );
        })}
      </View>
      {data.map((r, i) => (
        <View style={[styles.row]} key={`table-row-${i}`}>
          {columns.map((colDef) => {
            const cellStyle = { width };

            const val = r[`${colDef.field}`] || '';

            if (colDef?.flex) {
              cellStyle['flexBasis'] = `${flexBasis}`;
              cellStyle['flexGrow'] = colDef?.flex ?? 1;
              cellStyle['flexShrink'] = 0;
            }
            if (colDef?.minWidth) cellStyle['minWidth'] = `${colDef.minWidth ?? 100}px`;
            if (colDef?.alignContent) cellStyle['textAlign'] = colDef.alignContent;

            // TODO: calculate break point
            return (
              <Text style={[styles.cell, cellStyle, styles.breakLongWords]} break={i % 12 === 0}>
                {val}
              </Text>
            );
          })}
        </View>
      ))}
    </View>
  );
};

const locationColumns: ColumnDef[] = [
  {
    field: 'address',
    headerName: 'Address',
    minWidth: 140,
    alignHeader: 'left',
    alignContent: 'left',
  },
  {
    field: 'locationId',
    headerName: 'Location ID',
    minWidth: 120,
    alignHeader: 'left',
    alignContent: 'left',
  },
  {
    field: 'annualPremium',
    headerName: 'Annual Premium',
    alignHeader: 'center',
    alignContent: 'right',
  },
  {
    field: 'termPremium',
    headerName: 'Term Premium',
    alignHeader: 'center',
    alignContent: 'right',
  },
  {
    field: 'deductible',
    headerName: 'Deductible',
    alignHeader: 'center',
    alignContent: 'right',
  },
  {
    field: 'limitA',
    headerName: 'Building Cov.',
    alignHeader: 'center',
    alignContent: 'right',
  },
  {
    field: 'limitB',
    headerName: 'Appt. Struct. Cov.',
    alignHeader: 'center',
    alignContent: 'right',
  },
  {
    field: 'limitC',
    headerName: 'Contents Cov.',
    alignHeader: 'center',
    alignContent: 'right',
  },
  {
    field: 'limitD',
    headerName: 'BI Cov.',
    alignHeader: 'right',
    alignContent: 'right',
    alignHeader: 'center',
    alignContent: 'right',
  },
];

export interface PolicyDecPDFLocations {
  address: string;
  locationId: string;
  limitA: string;
  limitB: string;
  limitC: string;
  limitD: string;
  deductible: string;
  annualPremium: string;
  termPremium: string;
}

export const LocationsTable = ({ data }: { data: PolicyDecPDFLocations[] }) => {
  return <Table columns={locationColumns} data={data} />;
};

const additionalInterestColumns: ColumnDef[] = [
  {
    field: 'locationAddress',
    headerName: 'Address',
    minWidth: 140,
  },
  {
    field: 'locationId',
    headerName: 'Location ID',
    minWidth: 120,
  },
  {
    field: 'interestType',
    headerName: 'Type',
  },
  {
    field: 'name',
    headerName: 'Name',
  },
  {
    field: 'interestAddress',
    headerName: 'Interest Address',
  },
  {
    field: 'loanNumber',
    headerName: 'Loan Number',
  },
];

export interface AdditionalInterestsItem {
  locationAddress: string;
  locationId: string;
  interestType: string;
  name: string;
  interestAddress: string;
  loanNumber: string;
}

export const AdditionalInterestsTable = ({ data }: { data: AdditionalInterestsItem[] }) => {
  return <Table columns={additionalInterestColumns} data={data} />;
};

const premiumTableColumns: ColumnDef[] = [
  {
    field: 'itemTitle',
    headerName: 'Item',
    minWidth: 120,
    flex: 4,
  },
  {
    field: 'subjectAmount',
    headerName: 'Subject Amount',
    minWidth: 120,
    flex: 1,
    alignHeader: 'center',
    alignContent: 'right',
  },
  {
    field: 'rate',
    headerName: 'Rate',
    minWidth: 120,
    flex: 1,
    alignHeader: 'center',
    alignContent: 'right',
  },
  {
    field: 'value',
    headerName: 'Amount',
    minWidth: 160,
    flex: 3,
    alignHeader: 'center',
    alignContent: 'right',
  },
];

export interface PremiumTableItem {
  itemTitle: string;
  subjectAmount: string;
  rate: string;
  value: string;
}

export const PremiumTable = ({ data }: { data: PremiumTableItem[] }) => {
  return <Table columns={premiumTableColumns} data={data} />;
};
