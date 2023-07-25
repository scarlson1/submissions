import { ReactNode } from 'react';
import ReactPDF, { Text, View, StyleSheet } from '@react-pdf/renderer';

import { styles } from './createPolicy';

const tableStyles = StyleSheet.create({
  table: {},
  divider: {
    width: '100%',
    height: 1,
    backgroundColor: '#E7EBF0',
    margin: '24px 0 24px 0',
  },
  textPrimary: {
    color: '#1A2027',
  },
  textSecondary: {
    color: '#3E5060',
  },
  row: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomColor: '#E7EBF0',
    borderBottomWidth: 1,
    paddingTop: 8,
    paddingBottom: 8,
    paddingLeft: 12,
    paddingRight: 12,
    width: 'auto',
  },
  header: {
    // fontWeight: 400,
    fontSize: '10px',
    lineHeight: 1.2,
    textTransform: 'uppercase',
    textAlign: 'left',
    backgroundColor: 'blue',
  },
  rowItem: {
    // width: '60%',
    fontSize: '10px',
    lineHeight: 1.4,
    textAlign: 'left',
    // borderRightColor: borderColor,
    // borderRightWidth: 1,
    // paddingLeft: 8,
  },
  titleWrapper: {
    backgroundColor: '#F3F6F9',
    padding: '8px',
    width: '100%',
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: '12px',
    color: '#1A2027',
    textTransform: 'uppercase',
    textAlign: 'center',
  },
});

interface TableProps extends ReactPDF.ViewProps {
  // containerProps?: Partial<ReactPDF.ViewProps>;
  children: ReactNode;
}

export const Table = ({ children, ...props }: TableProps) => {
  return (
    <View {...(props || {})} style={{ ...tableStyles.table, ...(props?.style || {}) }}>
      {children}
    </View>
  );
};

interface TableHeaderProps {
  title: string;
  align?: 'left' | 'right' | 'center';
  weight?: number;
}

export const TableHeader = ({ title, align = 'left', weight = 1 }: TableHeaderProps) => {
  const itemStyle: ReactPDF.TextProps['style'] = { textAlign: align, flex: `${weight} 0 auto` };

  return <View style={{ ...tableStyles.header, ...itemStyle }}>{title}</View>;
};

// TODO: decide whether to use widthPct or weight (--> flexGrow)
interface TableRowProps {
  // key: string;
  heightPx?: number;
  widthPct?: number;
  children: ReactNode;
}
// ref: https://github.com/enescang/react-pdf-table/blob/main/src/components/TableRow/index.js
export const TableRow = ({ children, heightPx, widthPct }: TableRowProps) => {
  let rowStyle: ReactPDF.ViewProps['style'] = {};

  if (widthPct) rowStyle.width = `${widthPct}%`;

  if (heightPx) rowStyle.height = `${heightPx}px`;

  return <View style={{ ...tableStyles.row, ...rowStyle }}>{children}</View>;
};

interface TableItem extends ReactPDF.TextProps {
  text: string | number | null | undefined;
  align?: 'left' | 'right' | 'center';
  weight?: number;
}

export const TableItem = ({ text, style, align = 'left', weight = 1, ...props }: TableItem) => {
  const itemStyle: ReactPDF.TextProps['style'] = { textAlign: align }; // flex: `${weight} 0 auto`

  // return (
  //   <Text
  //     {...props}
  //     style={{ ...tableStyles.rowItem, ...styles.textSecondary, ...(style || {}), ...itemStyle }}
  //   >
  //     {text || ''}
  //   </Text>
  // );
  return (
    <View style={{ flex: `${weight} 0 auto` }}>
      <Text
        {...props}
        style={{ ...tableStyles.rowItem, ...styles.textSecondary, ...(style || {}), ...itemStyle }}
      >
        {text || ''}
      </Text>
    </View>
  );
};

interface TableTitleProps {
  title: string;
}
export const TableTitle = ({ title }: TableTitleProps) => {
  return (
    <View style={tableStyles.titleWrapper}>
      <Text style={tableStyles.title}>{title}</Text>
    </View>
  );
};

interface LocationsTableProps {
  locations: { test1: string; test2: string; test3: string }[];
}

export const LocationsTable = ({ locations }: LocationsTableProps) => {
  return (
    <Table>
      <TableRow>
        <TableHeader title='Test Title' />
        <TableHeader title='Test Title 2' />
        <TableHeader title='Test Title 3' align='right' />
      </TableRow>
      {locations.map((l) => (
        <TableRow>
          <TableItem text={l.test1} />
          <TableItem text={l.test2} />
          <TableItem text={l.test3} align='right' />
        </TableRow>
      ))}
    </Table>
  );
};

type LocationsSectionProps = LocationsTableProps;

export const LocationsSection = ({ locations }: LocationsSectionProps) => {
  return (
    <View>
      <TableTitle title='Locations' />
      <LocationsTable locations={locations} />
    </View>
  );
};
