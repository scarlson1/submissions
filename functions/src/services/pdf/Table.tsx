// @ts-nocheck
import * as React from 'react';
import ReactPDF, { Font, Text, View, StyleSheet, Page } from '@react-pdf/renderer';

// https://stackoverflow.com/a/63299486/10887890

Font.register({
  family: 'Roboto',
  src: 'https://fonts.googleapis.com/css2?family=Roboto&display=swap',
});

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
    backgroundColor: '#eee',
  },
  headerText: {
    fontSize: 8,
    lineHeight: 1.2,
    textTransform: 'uppercase',
    fontWeight: 500,
    color: '#1A2027', // '#1a245c',
    // margin: 4,
    alignSelf: 'center',
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
    hyphens: 'auto',
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
      <View style={[styles.row, styles.header]}>
        {columns.map((c) => {
          const cellStyle = { width };

          // if (c.flex) cellStyle['flex'] = `${c.flex} 0 ${flexBasis}`; // auto
          if (c.flex) {
            cellStyle['flexBasis'] = `${flexBasis}`;
            cellStyle['flexGrow'] = c.flex;
            cellStyle['flexShrink'] = 0;
          }
          if (c.minWidth) cellStyle['minWidth'] = `${c.minWidth}px`;
          // TODO: FIX ALIGN HEADER/CONTENT
          if (c.alignHeader) {
            cellStyle['textAlign'] = c.alignHeader;
          }

          return (
            <Text style={[styles.cell, styles.headerText, cellStyle]} key={c.field}>
              {c.headerName}
            </Text>
          );
        })}
      </View>
      {data.map((r, i) => {
        let rowKeyVal = Object.entries(r);
        return (
          <View style={[styles.row]} key={`table-row-${i}`}>
            {rowKeyVal.map(([key, val]) => {
              let cellDef = columns.find((col) => col.field === key);
              const cellStyle = { width }; // flexBasis

              // if (cellDef.flex)
              //   cellStyle['flex'] = `${cellDef.flex} 0 ${flexBasis}`;
              if (cellDef.flex) {
                cellStyle['flexBasis'] = `${flexBasis}`;
                cellStyle['flexGrow'] = cellDef?.flex ?? 1;
                cellStyle['flexShrink'] = 0;
              }
              if (cellDef.minWidth) cellStyle['minWidth'] = `${cellDef.minWidth ?? 100}px`;
              if (cellDef.alignContent) cellStyle['textAlign'] = cellDef.alignContent;

              return <Text style={[styles.cell, cellStyle, styles.breakLongWords]}>{val}</Text>;
            })}
          </View>
        );
      })}
    </View>
  );
};

const locationColumns: ColumnDef[] = [
  {
    field: 'address',
    headerName: 'Address',
    minWidth: 140,
  },
  {
    field: 'locationId',
    headerName: 'Location ID',
    minWidth: 120,
  },
  {
    field: 'annualPremium',
    headerName: 'Annual Premium',
  },
  {
    field: 'termPremium',
    headerName: 'Term Premium',
  },
  {
    field: 'deductible',
    headerName: 'Deductible',
  },
  {
    field: 'limitA',
    headerName: 'Building Cov.',
  },
  {
    field: 'limitB',
    headerName: 'Appt. Struct. Cov.',
  },
  {
    field: 'limitC',
    headerName: 'Contents Cov.',
  },
  {
    field: 'limitD',
    headerName: 'BI Cov.',
    alignHeader: 'right',
    alignContent: 'right',
  },
];

export interface LocationsData {
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

export const LocationsTable = ({ data }: { data: LocationsData[] }) => {
  return <Table columns={locationColumns} data={data} />;
};
