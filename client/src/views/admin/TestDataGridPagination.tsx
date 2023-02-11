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
  Timestamp,
} from 'firebase/firestore';
import {
  FirebaseAppProvider,
  FirestoreProvider,
  useFirebaseApp,
  useFirestore,
  useFirestoreCollection,
} from 'reactfire';
import { Button } from '@mui/material';

import { useDocCount } from 'hooks';
import { firebaseConfig } from 'firebaseConfig';
import { DataGrid } from '@mui/x-data-grid';

///// HOOK

interface Task {
  title: string;
  description: string;
  userId: string;
  dueDate: Timestamp;
}
type WithId<T> = {
  [K in keyof T]: T[K];
} & { id: string };

export function useFetchTasks(
  userId: string,
  params: {
    cursor?: DocumentSnapshot;
    itemsPerPage: number;
  }
) {
  const db = useFirestore();
  const tasksCollection = 'tasks';

  const order = orderBy('dueDate', 'asc');
  const path = `userId`;
  const operator = '==';

  // create default constraints
  const constraints: QueryConstraint[] = [
    where(path, operator, userId),
    order,
    limit(params.itemsPerPage),
  ];

  // if cursor is not undefined (e.g. not initial query)
  // we pass it as a constraint
  if (params.cursor) {
    constraints.push(startAfter(params.cursor));
  }

  const collectionRef = collection(db, tasksCollection) as CollectionReference<WithId<Task>>;

  const usersQuery = query(collectionRef, ...constraints);

  return useFirestoreCollection(usersQuery, {
    idField: 'id',
  });
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
  },
  {
    field: 'userId',
    headerName: 'User ID',
    minWidth: 160,
    flex: 0.6,
    editable: false,
  },
];

const itemsPerPage = 2;

export const TasksTable: React.FC<{
  userId: string;
}> = ({ userId }) => {
  const [page, setPage] = useState(0);
  const fetchTaskCount = useDocCount('tasks', [['userId', '==', userId]]);
  const [rowCount, setRowCount] = useState<number>(0);

  useEffect(() => {
    fetchTaskCount().then((result) => {
      setRowCount(result.data().count);
    });
  }, [fetchTaskCount, userId]);

  // keep cursors in memory
  const cursors = useRef<Map<number, DocumentSnapshot>>(new Map());

  // use query fetching
  const { data, status } = useFetchTasks(userId, {
    cursor: cursors.current.get(page),
    itemsPerPage,
  });
  console.log('data: ', data);

  // collect all the tasks JSON data
  const rowData = useMemo(() => {
    return data?.docs?.map((doc) => ({ ...doc.data(), id: doc.id })) ?? [];
    // return (
    //   data?.docs?.map((doc) => {
    //     console.log('doc data: ', doc.data());
    //     return { ...doc.data(), id: doc.id };
    //   }) ?? []
    // );
  }, [data]);
  // datagrid onPageChange props: (page: number, details: GridCallbackDetails<any>)
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
    <div style={{ height: 400, width: '100%' }}>
      <DataGrid
        rows={rowData}
        columns={columns}
        // initialState={initialState}
        pagination
        pageSize={itemsPerPage}
        rowsPerPageOptions={[itemsPerPage]}
        rowCount={rowCount}
        paginationMode='server'
        onPageChange={onPageChanged}
        page={page}
        loading={status === `loading`}
      />
    </div>
  );
};

export function WrappedTasksTable() {
  const firestoreInstance = getFirestore(useFirebaseApp());
  return (
    <FirestoreProvider sdk={firestoreInstance}>
      <TasksTable userId='123' />
    </FirestoreProvider>
  );
}

export function TestDataGridPagination() {
  return (
    <FirebaseAppProvider firebaseConfig={firebaseConfig}>
      <WrappedTasksTable />
    </FirebaseAppProvider>
  );
}

export function Pagination(
  props: React.PropsWithChildren<{
    userId: string;
    currentPage: number;
    pageChanged: (page: number) => unknown;
  }>
) {
  // const fetchTaskCount = useFetchTasksCount();
  const fetchTaskCount = useDocCount('tasks', [['userId', '==', props.userId]]);
  const [tasksCount, setTasksCount] = useState<number>();

  useEffect(() => {
    // when the component mounts, we store the tasks count in the state
    // fetchTaskCount(props.userId).then((result) => {
    //   setTasksCount(result.data().count);
    // });
    fetchTaskCount().then((result) => {
      setTasksCount(result.data().count);
    });
  }, [fetchTaskCount, props.userId]);

  useEffect(() => {
    console.log('count: ', tasksCount);
  }, [tasksCount]);

  if (tasksCount === undefined) {
    return <div>Loading...</div>;
  }

  const totalPages = Math.floor(tasksCount / itemsPerPage);
  const canGoBack = props.currentPage >= 1;
  const canGoNext = props.currentPage < totalPages;

  return (
    <div>
      <Button disabled={!canGoBack} onClick={() => props.pageChanged(props.currentPage - 1)}>
        Previous
      </Button>

      <Button disabled={!canGoNext} onClick={() => props.pageChanged(props.currentPage + 1)}>
        Next
      </Button>
    </div>
  );
}
