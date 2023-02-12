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
} from 'firebase/firestore';
import {
  FirebaseAppProvider,
  FirestoreProvider,
  useFirebaseApp,
  useFirestore,
  useFirestoreCollection,
} from 'reactfire';
import { DataGrid } from '@mui/x-data-grid';
import { faker } from '@faker-js/faker';

import { useDocCount } from 'hooks';
import { firebaseConfig } from 'firebaseConfig';
import { COLLECTIONS } from 'common';
import { Button } from '@mui/material';
import {
  formatGridFirestoreTimestamp,
  formatGridFirestoreTimestampAsDate,
} from 'modules/utils/helpers';

const useGenerateTasks = () => {
  const generateTasks = useCallback(async (num: number) => {
    for (let i = 0; i < num; i++) {
      let newTask = {
        title: faker.lorem.words(4),
        description: faker.lorem.words(12),
        dueDate: faker.date.between('01/01/2022', '01/01/2024'),
        userId: '123',
        metadata: {
          created: Timestamp.fromDate(faker.date.between('01/01/2022', '01/25/2023')),
          updated: Timestamp.fromDate(faker.date.between('01/01/2022', '02/11/2023')),
        },
      };
      const ref = collection(getFirestore(), 'tasks');
      await addDoc(ref, newTask);
    }
  }, []);

  return generateTasks;
};

const GenerateTasksButton = () => {
  const generateTasks = useGenerateTasks();

  return <Button onClick={() => generateTasks(10)}>Generate Tasks</Button>;
};

// interface Task {
//   title: string;
//   description: string;
//   userId: string;
//   dueDate: Timestamp;
// }
// type WithId<T> = {
//   [K in keyof T]: T[K];
// } & { id: string };

export function useFetchDocsWithCursor(
  collName: keyof typeof COLLECTIONS,
  constraints: QueryConstraint[],
  params: { cursor?: DocumentSnapshot; itemsPerPage: number }
) {
  const db = useFirestore();

  const qConstraints: QueryConstraint[] = [...constraints, limit(params.itemsPerPage)];
  if (params.cursor) {
    qConstraints.push(startAfter(params.cursor));
  }

  const collectionRef = collection(db, COLLECTIONS[collName]) as CollectionReference<any>;

  const q = query(collectionRef, ...qConstraints);

  return useFirestoreCollection(q, { idField: 'id' });
}

const columns = [
  {
    field: 'id',
    headerName: 'Doc ID',
    minWidth: 160,
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
    minWidth: 160,
    flex: 0.6,
    editable: false,
    valueGetter: (params: any) => params.row.metadata.created || null,
    valueFormatter: formatGridFirestoreTimestampAsDate,
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
    minWidth: 160,
    flex: 0.6,
    editable: false,
    valueGetter: (params: any) => params.row.metadata.created || null,
    valueFormatter: formatGridFirestoreTimestamp,
  },
  {
    field: 'metadata.updated',
    headerName: 'Updated',
    minWidth: 160,
    flex: 0.6,
    editable: false,
    valueGetter: (params: any) => params.row.metadata.updated || null,
    valueFormatter: formatGridFirestoreTimestamp,
  },
];

export const PaginationGrid: React.FC<{
  userId: string;
}> = ({ userId }) => {
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(25);
  const fetchTaskCount = useDocCount('tasks', [['userId', '==', userId]]);
  const [rowCount, setRowCount] = useState<number>(0);

  useEffect(() => {
    fetchTaskCount().then((result) => {
      setRowCount(result.data().count);
    });
  }, [fetchTaskCount, userId]);

  // keep cursors in memory
  const cursors = useRef<Map<number, DocumentSnapshot>>(new Map());

  const { data, status } = useFetchDocsWithCursor(
    'TASKS',
    [where('userId', '==', userId), orderBy('metadata.created', 'desc')],
    {
      cursor: cursors.current.get(page),
      itemsPerPage: pageSize,
    }
  );

  // collect all the tasks JSON data
  const rowData = useMemo(() => {
    return data?.docs?.map((doc) => ({ ...doc.data(), id: doc.id })) ?? [];
    // return (data?.docs?.map((doc) => doc.data()) ?? []);
  }, [data]);

  // callback called when changing page
  const onPageChanged = useCallback(
    (nextPage: number) => {
      setPage((page) => {
        // first, we save the last document as page's cursor
        cursors.current.set(page + 1, data.docs[data.docs.length - 1]);

        // then we update the state with the next page's number
        return nextPage;
      });
    },
    [data]
  );

  return (
    <div>
      <GenerateTasksButton />
      <div style={{ height: 400, width: '100%' }}>
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
        />
      </div>
    </div>
  );
};

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

export function WrappedPaginationGrid() {
  const firestoreInstance = getFirestore(useFirebaseApp());
  return (
    <FirestoreProvider sdk={firestoreInstance}>
      <PaginationGrid userId='123' />
    </FirestoreProvider>
  );
}

export function TestDataGridPagination() {
  return (
    <FirebaseAppProvider firebaseConfig={firebaseConfig}>
      <WrappedPaginationGrid />
    </FirebaseAppProvider>
  );
}

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
