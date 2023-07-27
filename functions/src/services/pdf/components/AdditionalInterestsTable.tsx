import { ColumnDef, Table } from './Table';

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

export const AdditionalInterestsTable = ({
  data,
  id = 'additional-interests-table',
}: {
  data: AdditionalInterestsItem[];
  id?: string;
}) => {
  return <Table columns={additionalInterestColumns} data={data} id={id} />;
};
