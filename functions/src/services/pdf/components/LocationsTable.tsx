import { Text, View } from '@react-pdf/renderer';

import { tableStyles as styles } from '../styles.js';
import { ColumnDef, Table } from './Table.js';

const locationColumns: ColumnDef[] = [
  {
    field: 'locationId',
    headerName: 'Location ID',
    minWidth: 120,
    alignHeader: 'left',
    alignContent: 'left',
  },
  {
    field: 'address',
    headerName: 'Address',
    minWidth: 140,
    alignHeader: 'left',
    alignContent: 'left',
    renderCell: ({ value, cellStyles }) => {
      return (
        <View style={[cellStyles, styles.cell]}>
          <Text>{value[0]}</Text>
          <Text>{value[1]}</Text>
        </View>
      );
    },
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
    alignHeader: 'center',
    alignContent: 'right',
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
];

export interface PolicyDecPDFLocations {
  address: [string, string]; // string;
  locationId: string;
  limitA: string;
  limitB: string;
  limitC: string;
  limitD: string;
  deductible: string;
  annualPremium: string;
  termPremium: string;
}

export const LocationsTable = ({
  data,
  id = 'locations-table',
}: {
  data: PolicyDecPDFLocations[];
  id?: string;
}) => {
  return <Table columns={locationColumns} data={data} id={id} />;
};
