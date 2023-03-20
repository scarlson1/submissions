import React, { useCallback, useState, useRef, useMemo, useEffect } from 'react';
import {
  collection,
  query,
  orderBy,
  startAfter,
  limit,
  getFirestore,
  DocumentSnapshot,
  where,
  CollectionReference,
  QueryConstraint,
  addDoc,
  Timestamp,
  QueryOrderByConstraint,
  QueryFieldFilterConstraint,
} from 'firebase/firestore';
import { useFirestore, useFirestoreCollection, useUser } from 'reactfire';
import {
  DataGrid,
  getGridDateOperators,
  getGridNumericOperators,
  GridFilterModel,
  GridSortModel,
} from '@mui/x-data-grid';
import { faker } from '@faker-js/faker';
// import { collection as rxCollection, collectionData } from 'rxfire/firestore';
// import { map } from 'rxjs/operators';

import { useDocCount } from 'hooks';
import { COLLECTIONS } from 'common';
import { Box, Button } from '@mui/material';
import {
  formatGridFirestoreTimestamp,
  formatGridFirestoreTimestampAsDate,
  isRangeComparison,
  muiOperatorToFirestoreOperator,
} from 'modules/utils/helpers';

// TODO: checkout projects:
//    - Tanstack Table: https://tanstack.com/table/v8/docs/examples/react/kitchen-sink
//    - Tanstack virtual: https://tanstack.com/virtual/v3
//    - Material React Table: https://www.material-react-table.com/

export const useGenerateTasks = () => {
  const { data: user } = useUser();
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
        const ref = collection(getFirestore(), 'tasks');
        await addDoc(ref, newTask);
      }
    },
    [user]
  );

  return generateTasks;
};

const GenerateTasksButton = () => {
  const generateTasks = useGenerateTasks();

  return <Button onClick={() => generateTasks(10)}>Generate Tasks</Button>;
};

export function useFetchDocsWithCursor<T = any>(
  collName: keyof typeof COLLECTIONS,
  constraints: QueryConstraint[],
  params: { cursor?: DocumentSnapshot; itemsPerPage: number }
) {
  const db = useFirestore();

  const qConstraints: QueryConstraint[] = [...constraints, limit(params.itemsPerPage)];
  if (params.cursor) {
    qConstraints.push(startAfter(params.cursor));
  }

  const collectionRef = collection(db, COLLECTIONS[collName]) as CollectionReference<T>;
  const q = query(collectionRef, ...qConstraints);

  return useFirestoreCollection(q, { idField: 'id' });
}

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
    filterOperators: getGridNumericOperators().filter(
      (operator) => operator.value === '>' || operator.value === '<'
    ),
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

// GENERALIZE:
//    - query params ([['userId', '==', userId]])
//    - collection ('TASKS')
//    - column schema
//    - callback to set queryOptions ?? onSort ?

// orderBy / filter limitations (>, <, >=, <=) - must orderBy same field
// https://firebase.google.com/docs/firestore/query-data/order-limit-data#limitations

export const PaginationGrid: React.FC<{
  userId: string;
}> = ({ userId }) => {
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(25);
  const fetchTaskCount = useDocCount('TASKS', [where('userId', '==', userId)]); // ['userId', '==', userId]
  const [rowCount, setRowCount] = useState<number>(0);
  const [sortOptions, setSortOptions] = useState<QueryOrderByConstraint[]>([
    orderBy('metadata.created', 'desc'),
  ]);
  const [filters, setFilters] = useState<(QueryFieldFilterConstraint | QueryOrderByConstraint)[]>(
    []
  );

  useEffect(() => {
    fetchTaskCount().then((result) => {
      setRowCount(result.data().count);
    });
  }, [fetchTaskCount, userId]);

  // keep cursors in memory
  const cursors = useRef<Map<number, DocumentSnapshot>>(new Map());

  const { data, status } = useFetchDocsWithCursor(
    'TASKS',
    [where('userId', '==', userId), ...filters, ...sortOptions],
    {
      cursor: cursors.current.get(page),
      itemsPerPage: pageSize,
    }
  );
  console.log('DATA: ', data);

  const rowData = useMemo(() => {
    return data?.docs?.map((doc) => ({ ...doc.data(), id: doc.id })) ?? [];
  }, [data]);

  const onPageChanged = useCallback(
    (nextPage: number) => {
      setPage((page) => {
        // first, save the last document as page's cursor (query uses "startAfter(snap)")
        cursors.current.set(page + 1, data.docs[data.docs.length - 1]);

        return nextPage;
      });
    },
    [data]
  );

  // TODO: store filter in same array ??
  const handleSortModelChange = useCallback((sortModel: GridSortModel) => {
    let newOptions: QueryOrderByConstraint[] = [];
    sortModel.forEach((f) => {
      if (f.sort) newOptions.push(orderBy(f.field, f.sort));
    });

    setSortOptions([...newOptions]);
  }, []);

  const handleFilterChange = useCallback((filterModel: GridFilterModel) => {
    console.log('FILTER MODEL: ', filterModel);
    const newFilters: (QueryFieldFilterConstraint | QueryOrderByConstraint)[] = [];
    // TODO: mui grid operator to firebase operator convertion (datetime "after" =>  ">", "is" => "==")
    // TODO: create custom operators that map to firestore - https://mui.com/x/react-data-grid/filtering/#create-a-custom-operator
    // OR - remove operators - https://mui.com/x/react-data-grid/filtering/#remove-an-operator
    // TODO: check for limitations - https://firebase.google.com/docs/firestore/query-data/queries#query_limitations

    filterModel.items.forEach((f) => {
      // TODO: bug - isNotEmpty passes a value of undefined
      if (f.value !== undefined && f.operatorValue) {
        // isWhereFilterOp(f.operatorValue)
        let op = muiOperatorToFirestoreOperator(f.operatorValue);
        if (op) newFilters.push(where(f.columnField, op, f.value));
        // TODO: handle isNotEmpty (where('field', '!=', false))
        // FIRESTORE LIMITATION - MUST SORT BY COLUMN IF USING >, < >=, <= OPERATORS
        if (isRangeComparison(f.operatorValue)) newFilters.push(orderBy(f.columnField));
      }
    });

    console.log('NEW FILTERS: ', newFilters);
    setFilters(newFilters);
  }, []);

  return (
    <div>
      <Box sx={{ pb: 2 }}>
        <GenerateTasksButton />
      </Box>

      <div style={{ height: 600, width: '100%' }}>
        <DataGrid
          rows={rowData}
          columns={columns}
          pagination
          paginationMode='server'
          rowCount={rowCount}
          loading={status === `loading`}
          pageSize={pageSize}
          onPageSizeChange={(newSize) => setPageSize(newSize)}
          rowsPerPageOptions={[5, 10, 25, 100]}
          onPageChange={onPageChanged}
          page={page}
          sortingMode='server'
          onSortModelChange={handleSortModelChange}
          filterMode='server'
          onFilterModelChange={handleFilterChange}
        />
      </div>
    </div>
  );
};

export function WrappedPaginationGrid() {
  // const firestoreInstance = getFirestore(useFirebaseApp());
  return (
    // <FirestoreProvider sdk={firestoreInstance}>
    <PaginationGrid userId='123' />
    // </FirestoreProvider>
  );
}

export function TestDataGridPagination() {
  return (
    // <FirebaseAppProvider firebaseConfig={firebaseConfig}>
    <WrappedPaginationGrid />
    // </FirebaseAppProvider>
  );
}

// const itemsPerPage = 10;

// export const PaginationGrid: React.FC<{
//   userId: string;
// }> = ({ userId }) => {
//   const [page, setPage] = useState(0);
//   const [pageSize, setPageSize] = useState(25);
//   const fetchTaskCount = useDocCount('tasks', [['userId', '==', userId]]);
//   const [rowCount, setRowCount] = useState<number>(0);

//   useEffect(() => {
//     fetchTaskCount().then((result) => {
//       setRowCount(result.data().count);
//     });
//   }, [fetchTaskCount, userId]);

//   // keep cursors in memory
//   const cursors = useRef<Map<number, DocumentSnapshot>>(new Map());

//   // use query fetching
//   // const { data, status } = useFetchTasks(userId, {
//   //   cursor: cursors.current.get(page),
//   //   itemsPerPage,
//   // });
//   const { data, status } = useFetchDocsWithCursor(
//     'TASKS',
//     [where('userId', '==', userId), orderBy('metadata.created', 'desc')],
//     {
//       cursor: cursors.current.get(page),
//       itemsPerPage: pageSize,
//     }
//   );

//   // collect all the tasks JSON data
//   const rowData = useMemo(() => {
//     return data?.docs?.map((doc) => ({ ...doc.data(), id: doc.id })) ?? [];
//     // return (data?.docs?.map((doc) => doc.data()) ?? []);
//   }, [data]);
//   // datagrid onPageChange props: (page: number, details: GridCallbackDetails<any>)
//   // callback called when changing page
//   const onPageChanged = useCallback(
//     (nextPage: number) => {
//       setPage((page) => {
//         // first, we save the last document as page's cursor
//         cursors.current.set(page + 1, data.docs[data.docs.length - 1]);

//         // then we update the state with the next page's number
//         return nextPage;
//       });
//     },
//     [data]
//   );

//   return (
//     <div>
//       <GenerateTasksButton />
//       <div style={{ height: 400, width: '100%' }}>
//         <DataGrid
//           rows={rowData}
//           columns={columns}
//           // initialState={initialState}
//           pagination
//           pageSize={pageSize}
//           onPageSizeChange={(newSize) => setPageSize(newSize)}
//           rowsPerPageOptions={[5, 10, 25, 100]}
//           rowCount={rowCount}
//           paginationMode='server'
//           onPageChange={onPageChanged}
//           page={page}
//           loading={status === `loading`}
//         />
//       </div>
//     </div>
//   );
// };

// export function Pagination(
//   props: React.PropsWithChildren<{
//     userId: string;
//     currentPage: number;
//     pageChanged: (page: number) => unknown;
//   }>
// ) {
//   // const fetchTaskCount = useFetchTasksCount();
//   const fetchTaskCount = useDocCount('tasks', [['userId', '==', props.userId]]);
//   const [tasksCount, setTasksCount] = useState<number>();

//   useEffect(() => {
//     // when the component mounts, we store the tasks count in the state
//     // fetchTaskCount(props.userId).then((result) => {
//     //   setTasksCount(result.data().count);
//     // });
//     fetchTaskCount().then((result) => {
//       setTasksCount(result.data().count);
//     });
//   }, [fetchTaskCount, props.userId]);

//   if (tasksCount === undefined) {
//     return <div>Loading...</div>;
//   }

//   const totalPages = Math.floor(tasksCount / itemsPerPage);
//   const canGoBack = props.currentPage >= 1;
//   const canGoNext = props.currentPage < totalPages;

//   return (
//     <div>
//       <Button disabled={!canGoBack} onClick={() => props.pageChanged(props.currentPage - 1)}>
//         Previous
//       </Button>

//       <Button disabled={!canGoNext} onClick={() => props.pageChanged(props.currentPage + 1)}>
//         Next
//       </Button>
//     </div>
//   );
// }

// export function useFetchTasks(
//   userId: string,
//   params: {
//     cursor?: DocumentSnapshot;
//     itemsPerPage: number;
//   }
// ) {
//   const db = useFirestore();
//   const tasksCollection = 'tasks';

//   const order = orderBy('dueDate', 'asc');
//   const path = `userId`;
//   const operator = '==';

//   // create default constraints
//   const constraints: QueryConstraint[] = [
//     where(path, operator, userId),
//     order,
//     limit(params.itemsPerPage),
//   ];

//   // if cursor is not undefined (e.g. not initial query)
//   // we pass it as a constraint
//   if (params.cursor) {
//     constraints.push(startAfter(params.cursor));
//   }

//   const collectionRef = collection(db, tasksCollection) as CollectionReference<WithId<Task>>;

//   const usersQuery = query(collectionRef, ...constraints);

//   return useFirestoreCollection(usersQuery, {
//     idField: 'id',
//   });
// }
