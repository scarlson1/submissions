// @ts-nocheck
import { Text, View } from '@react-pdf/renderer';
import { ReactNode } from 'react';
import { truthyOrZero } from '../../../common/helpers.js';
import { tableStyles as styles } from '../styles.js';

// https://stackoverflow.com/a/63299486/10887890

// flex works for word wrap, flexGrow doesn't:
// ISSUE: https://github.com/diegomura/react-pdf/issues/523

export interface ColumnDef {
  field: string;
  headerName: string;
  // flex?: number; // TODO: replace with flexGrow
  flex?: string;
  flexGrow?: number;
  flexShrink?: number;
  flexBasis?: string;
  minWidth?: number;
  maxWidth?: number;
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
        {columns.map((c, i) => {
          const cellStyle = { width };

          // if (truthyOrZero(c.flex)) {
          //   cellStyle['flexBasis'] = 'auto'; // `${flexBasis}`;
          //   cellStyle['flexGrow'] = c.flex ?? 1;
          //   cellStyle['flexShrink'] = 1; // 0;
          // }
          if (c.flex) cellStyle['flex'] = c.flex;
          if (c.minWidth) cellStyle['minWidth'] = `${c.minWidth}px`;
          if (c.maxWidth) cellStyle['maxWidth'] = `${c.maxWidth}px`;
          if (c.alignHeader) cellStyle['textAlign'] = c.alignHeader;

          if (c?.flexBasis) cellStyle['flexBasis'] = c.flexBasis;
          if (truthyOrZero(c?.flexGrow)) cellStyle['flexGrow'] = c.flexGrow;
          if (truthyOrZero(c?.flexShrink)) cellStyle['flexShrink'] = c.flexShrink;
          if (c?.width) cellStyle['width'] = c.width;

          return (
            <Text style={[styles.cell, styles.headerText, cellStyle]} key={`${c.field}-${i}`}>
              {c.headerName}
            </Text>
          );
        })}
      </View>
      {data.map((r, i) => (
        <View
          style={[styles.row]}
          key={`table-row-${i}-${id}`}
          break={(i + 1) % 10 === 0 && i !== data.length - 1}
        >
          {columns.map((colDef, ic) => {
            const cellStyle = { width };

            const val = r[`${colDef.field}`] || '';

            // if (truthyOrZero(colDef?.flex)) {
            //   cellStyle['flexBasis'] = `${flexBasis}`;
            //   cellStyle['flexGrow'] = colDef?.flex ?? 1;
            //   cellStyle['flexShrink'] = 1; // 0;
            // }
            if (colDef?.flex) cellStyle['flex'] = colDef?.flex;
            if (colDef?.minWidth) cellStyle['minWidth'] = `${colDef.minWidth}px`;
            if (colDef?.maxWidth) cellStyle['maxWidth'] = `${colDef.maxWidth}px`;
            if (colDef?.alignContent) cellStyle['textAlign'] = colDef.alignContent;

            if (colDef?.flexBasis) cellStyle['flexBasis'] = colDef.flexBasis;
            if (truthyOrZero(colDef?.flexGrow)) cellStyle['flexGrow'] = colDef.flexGrow;
            if (truthyOrZero(colDef?.flexShrink)) cellStyle['flexShrink'] = colDef.flexShrink;
            if (colDef?.width) cellStyle['width'] = colDef.width;

            if (colDef?.renderCell) return colDef.renderCell({ value: val, cellStyle });

            // TODO: calculate break point
            return (
              <Text
                style={[styles.cell, cellStyle]}
                // break={(i + 1) % 10 === 0 && i !== data.length - 1}
                key={`${id}-${colDef.field}-${i}-${ic}`}
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
