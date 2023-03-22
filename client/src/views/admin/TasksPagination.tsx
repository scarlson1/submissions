import React, { useCallback } from 'react';
import { Box, Button, Typography } from '@mui/material';
import { addDoc, collection, doc, DocumentReference, Timestamp, where } from 'firebase/firestore';
import { useFirestore, useFirestoreDocDataOnce, useUser } from 'reactfire';
import { getGridDateOperators } from '@mui/x-data-grid';
import { faker } from '@faker-js/faker';

import { ServerDataGrid, numericOperators } from 'components';
import { formatGridFirestoreTimestamp, formatGridFirestoreTimestampAsDate } from 'modules/utils';
import { COLLECTIONS, FIPSDetails } from 'common';
import { VirtualizedAutocomplete } from 'components/forms/VirtualizedAutocomplete';
import { Formik } from 'formik';

export const columns = [
  {
    field: 'id',
    headerName: 'Doc ID',
    minWidth: 220,
    flex: 0.6,
    editable: false,
  },
  {
    field: 'title',
    headerName: 'Title',
    minWidth: 160,
    flex: 0.6,
    editable: false,
  },
  {
    field: 'description',
    headerName: 'Description',
    minWidth: 160,
    flex: 0.6,
    editable: false,
  },
  {
    field: 'dueDate',
    headerName: 'dueDate',
    type: 'date',
    minWidth: 160,
    flex: 0.6,
    editable: false,
    valueGetter: (params: any) => params.row.dueDate || null,
    valueFormatter: formatGridFirestoreTimestampAsDate,
  },
  {
    field: 'randomNumber',
    headerName: 'Random Number',
    type: 'number',
    filterOperators: numericOperators,
    // filterOperators: getGridNumericOperators().filter(
    //   (operator) => operator.value === '>' || operator.value === '<'
    // ),
    minWidth: 140,
    flex: 0.6,
    editable: false,
    valueGetter: (params: any) => params.row.randomNumber || null,
  },
  {
    field: 'userId',
    headerName: 'User ID',
    minWidth: 80,
    flex: 0.6,
    editable: false,
  },
  {
    field: 'metadata.created',
    headerName: 'Created',
    type: 'date',
    minWidth: 160,
    flex: 0.6,
    editable: false,
    valueGetter: (params: any) => params.row.metadata.created || null,
    valueFormatter: formatGridFirestoreTimestamp,
  },
  {
    field: 'metadata.updated',
    headerName: 'Updated',
    type: 'date',
    filterOperators: getGridDateOperators().filter(
      (operator) => operator.value === '>' || operator.value === '<'
    ),
    minWidth: 160,
    flex: 0.6,
    editable: false,
    valueGetter: (params: any) => params.row.metadata.updated || null,
    valueFormatter: formatGridFirestoreTimestamp,
  },
];

export const TasksPagination: React.FC = () => {
  const { status, data: user } = useUser();

  if (status === 'loading') return <div>Loading...</div>;
  if (!user?.uid) return <div>missing user id</div>;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', pb: 2 }}>
        <Typography variant='h5' gutterBottom>
          Tasks
        </Typography>
        <GenerateTasksButton />
      </Box>
      <ServerDataGrid
        collName='TASKS'
        columns={columns}
        constraints={[where('userId', '==', user?.uid)]}
      />

      <VirtualTest />
    </Box>
  );
};

export function useGenerateTasks() {
  const { data: user } = useUser();
  const firestore = useFirestore();
  const generateTasks = useCallback(
    async (num: number) => {
      for (let i = 0; i < num; i++) {
        let newTask = {
          title: faker.lorem.words(4),
          description: faker.lorem.words(12),
          dueDate: faker.date.between('01/01/2022', '01/01/2024'),
          randomNumber: faker.random.numeric(3),
          userId: user?.uid || null,
          metadata: {
            created: Timestamp.fromDate(faker.date.between('01/01/2020', '01/25/2022')),
            updated: Timestamp.fromDate(faker.date.between('01/01/2020', '02/11/2030')),
          },
        };
        const ref = collection(firestore, 'tasks');
        await addDoc(ref, newTask);
      }
    },
    [user, firestore]
  );

  return generateTasks;
}

function GenerateTasksButton() {
  const generateTasks = useGenerateTasks();

  return (
    <Button
      onClick={() => generateTasks(10)}
      variant='contained'
      size='small'
      sx={{ maxHeight: 34 }}
    >
      Generate Tasks
    </Button>
  );
}

function VirtualTest() {
  // const parentRef = React.useRef<any>(); // HTMLDivElement
  const firestore = useFirestore();
  const countiesDocRef = doc(firestore, COLLECTIONS.PUBLIC, 'fips') as DocumentReference<{
    counties: FIPSDetails[];
  }>;
  const {
    data: { counties },
  } = useFirestoreDocDataOnce(countiesDocRef);

  return (
    <Box sx={{ py: 8, maxWidth: 400 }}>
      <Formik initialValues={{ test: [] }} onSubmit={(values) => console.log(values)}>
        {(props) => (
          <>
            <VirtualizedAutocomplete
              options={counties}
              name='test'
              getOptionLabel={(option) =>
                `${option.stateFP}${option.countyFP} - ${option.countyName}`
              }
              autocompleteProps={{ groupBy: (option) => option.state }}
              textFieldProps={{
                label: 'Counties',
                placeholder: 'search: fips, state, county name',
              }}
            />
            <div onClick={props.submitForm}>submit</div>
          </>
        )}
      </Formik>
    </Box>
  );

  // const rowVirtualizer = useVirtualizer({
  //   count: counties.length, // options.length,
  //   getScrollElement: () => parentRef.current,
  //   estimateSize: () => 35,
  //   overscan: 5,
  // });

  // return (
  //   <Box sx={{ p: 5, my: 5, border: '1px solid lightgrey', borderRadius: 1, maxWidth: 440 }}>
  // <div
  //   ref={parentRef}
  //   className='List'
  //   style={{
  //     height: `200px`,
  //     width: `400px`,
  //     overflow: 'auto',
  //   }}
  // >
  //   <div
  //     style={{
  //       height: `${rowVirtualizer.getTotalSize()}px`,
  //       width: '100%',
  //       position: 'relative',
  //     }}
  //   >
  //     {rowVirtualizer.getVirtualItems().map((virtualRow) => {
  //       const countyDetails = counties[virtualRow.index];
  //       return (
  //         <div
  //           key={virtualRow.index}
  //           className={virtualRow.index % 2 ? 'ListItemOdd' : 'ListItemEven'}
  //           style={{
  //             position: 'absolute',
  //             top: 0,
  //             left: 0,
  //             width: '100%',
  //             height: `${virtualRow.size}px`,
  //             transform: `translateY(${virtualRow.start}px)`,
  //           }}
  //         >
  //           {`${countyDetails.countyFP} - ${countyDetails.countyName}`}
  //           {/* Row {virtualRow.index} */}
  //         </div>
  //       );
  //     })}
  //   </div>
  // </div>
  //   </Box>
  // );
}
