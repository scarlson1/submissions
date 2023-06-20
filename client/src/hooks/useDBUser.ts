import type { User } from 'firebase/auth';
import { doc } from 'firebase/firestore';
import {
  ObservableStatus,
  ReactFireOptions,
  useAuth,
  useFirestore,
  useObservable,
} from 'reactfire';
import { user } from 'rxfire/auth';
import { from, of } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { doc as rxDoc } from 'rxfire/firestore';

import { usersCollection, type User as DBUser } from 'common';

// REF: https://github.com/FirebaseExtended/reactfire/blob/main/src/auth.tsx

interface DBUserResult {
  user: User | null;
  dbUser: DBUser | null;
}

export const useDBUser = <T>(options?: ReactFireOptions<T>): ObservableStatus<DBUserResult> => {
  const auth = useAuth();
  const firestore = useFirestore();

  const observableId = `auth:user:${auth.name}:combine-firestore`;

  const observable$ = user(auth).pipe(
    switchMap((user) => {
      if (user) {
        const userRef = doc(usersCollection(firestore), user.uid);

        return from(rxDoc(userRef)).pipe(
          map((dbUser) => {
            const userData = dbUser.data();

            const result: DBUserResult = {
              user,
              dbUser: userData || null,
            };
            return result;
          })
        );
      } else {
        let result: DBUserResult = {
          user: null,
          dbUser: null,
        };
        return of(result);
      }
    })
  );

  return useObservable(observableId, observable$, options);
};
