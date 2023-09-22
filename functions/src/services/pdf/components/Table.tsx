// @ts-nocheck
import { Text, View } from '@react-pdf/renderer';
import { ReactNode } from 'react';
import { tableStyles as styles } from '../styles.js';

// https://stackoverflow.com/a/63299486/10887890

export interface ColumnDef {
  field: string;
  headerName: string;
  flex?: number;
  minWidth?: number;
  alignHeader?: 'left' | 'right' | 'center';
  alignContent?: 'left' | 'right' | 'center';
  renderCell?: ({ value, cellStyles }: any) => ReactNode; // TODO: renderCell prop type
}

interface TableProps {
  columns: ColumnDef[];
  data: Record<string, any>[];
  id: string;
}

export const Table = ({ columns, data, id }: TableProps) => {
  const flexBasis = `${(100 / columns.length).toFixed(2)}%`;
  const width = `${(100 / columns.length).toFixed(2)}%`;

  return (
    <View style={[styles.table]}>
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

            if (colDef?.renderCell) return colDef.renderCell({ value: val, cellStyle });

            // TODO: calculate break point
            return (
              <Text
                style={[styles.cell, cellStyle, styles.breakLongWords]}
                break={i % 12 === 0}
                key={`${id}-${colDef.field}-${i}`}
              >
                {val}
              </Text>
            );
          })}
        </View>
      ))}
    </View>
  );
};
