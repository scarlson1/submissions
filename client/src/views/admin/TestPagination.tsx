import React, { useCallback, useState, useRef, useMemo, useEffect } from 'react';
// import { Box, Button, Typography } from '@mui/material';
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
import { WithId } from 'common';
// import { submissionsCollection } from 'common';

// TODO: read types: https://www.digitalocean.com/community/tutorials/how-to-use-generics-in-typescript

///// HOOK

interface Task {
  title: string;
  description: string;
  userId: string;
  dueDate: Timestamp;
}

export function useFetchTasks(
  userId: string,
  params: {
    cursor?: DocumentSnapshot;
    itemsPerPage: number;
  }
) {
  // const db = getFirestore();
  const db = useFirestore();

  // collection path
  const tasksCollection = 'tasks';

  // we order tasks by the "dueDate" property
  const order = orderBy('dueDate', 'desc');

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

///////

const itemsPerPage = 2;

export const TasksTable: React.FC<{
  userId: string;
}> = ({ userId }) => {
  const [page, setPage] = useState(0);

  // keep cursors in memory
  const cursors = useRef<Map<number, DocumentSnapshot>>(new Map());

  // use query fetching
  const { data, status } = useFetchTasks(userId, {
    cursor: cursors.current.get(page),
    itemsPerPage,
  });

  // collect all the tasks JSON data
  const tasks = useMemo(() => {
    return data?.docs?.map((doc) => doc.data()) ?? [];
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

  if (status === `loading`) {
    return <span>Loading Tasks...</span>;
  }

  return (
    <div className={'flex flex-col space-y-2'}>
      <table className={'Table'}>
        <thead>
          <tr>
            <th>Name</th>
            <th>Due Date</th>
            <th>Done</th>
          </tr>
        </thead>

        <tbody>
          {tasks.map((task) => {
            return (
              <tr key={task.title}>
                <td>{task.title}</td>
                <td>{task.description}</td>
                <td>{`${task.dueDate.toDate()}`}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <Pagination currentPage={page} userId={userId} pageChanged={onPageChanged} />
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

export function TestPagination() {
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

// export const TestPagination: React.FC = () => {
//   // const data = useLoaderData() as WithId<Submission>[];
//   const db = getFirestore();
//   const [data, setData] = useState<WithId<Submission>[]>([]);
//   const nextQuery = React.useRef<Query<DocumentData>>(null);

//   const getNext = useCallback(() => {}, []);

//   React.useEffect(() => {
//     const first = query(
//       submissionsCollection,
//       orderBy('metadata.created', 'desc'),
//       limit(PAGE_SIZE)
//     );
//     getDocs(first).then((docSnaps) => {
//       const lastVisible = docSnaps.docs[docSnaps.docs.length - 1];
//       console.log('last', lastVisible);

//       // Construct a new query starting at this document,
//       // get the next 25 cities.
//       const next = query(
//         collection(db, 'submissions'),
//         orderBy('metadata.created'),
//         startAfter(lastVisible),
//         limit(25)
//       );
//       // nextQuery.current = next;

//       const initialData = docSnaps.docs.map((s) => ({ ...s.data(), id: s.id }));
//       setData(initialData);
//     });
//   }, []);

//   const handleBack = useCallback(() => {}, []);
//   const handleNext = useCallback(() => {}, []);

//   return (
//     <Box>
//       {data.map((s) => (
//         <Box key={s.id}>
//           <Typography>{s.id}</Typography>
//         </Box>
//       ))}
//       <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
//         <Button onClick={handleBack}>Back</Button>
//         <Button onClick={handleNext}>Next</Button>
//       </Box>
//     </Box>
//   );
// };

// const tasksCollection = 'tasks';
// const path = `userId`;
// const operator = '==';

// export function useFetchTasksCount() {
//   const firestore = useFirestore();

//   return useCallback(
//     (userId: string) => {
//       const constraints = [where(path, operator, userId)];

//       const collectionRef = collection(firestore, tasksCollection) as CollectionReference<
//         WithId<Task>
//       >;

//       return getCountFromServer(query(collectionRef, ...constraints));
//     },
//     [firestore]
//   );
// }
