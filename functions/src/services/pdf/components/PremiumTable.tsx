import { ColumnDef, Table } from './Table.js';

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
    alignHeader: 'right',
    alignContent: 'right',
  },
];

export interface PremiumTableItem {
  itemTitle: string;
  subjectAmount: string;
  rate: string;
  value: string;
}

export const PremiumTable = ({
  data,
  id = 'premium-table',
}: {
  data: PremiumTableItem[];
  id?: string;
}) => {
  return <Table columns={premiumTableColumns} data={data} id={id} />;
};
