import type { User } from 'firebase/auth';
import { ReactFireOptions, useAuth, useFirestore, useObservable } from 'reactfire';
import { user } from 'rxfire/auth';
import { from, of } from 'rxjs';
import { map, switchMap, tap } from 'rxjs/operators'; // switchMap
import { doc as rxDoc } from 'rxfire/firestore';

import { usersCollection, type User as DBUser } from 'common';
import { doc } from 'firebase/firestore';

// REF: https://github.com/FirebaseExtended/reactfire/blob/main/src/auth.tsx

interface DBUserResult {
  user: User | null;
  dbUser: DBUser | null;
}

export const useDBUser = <T>(options?: ReactFireOptions<T>) => {
  const auth = useAuth();
  const firestore = useFirestore();

  const observableId = `auth:user:${auth.name}:combine-firestore`;
  const observable$ = user(auth).pipe(
    tap(console.log),
    switchMap((user) => {
      if (user) {
        console.log('AUTH USER: ', user);
        const userRef = doc(usersCollection(firestore), user.uid);

        return from(rxDoc(userRef)).pipe(
          tap(console.log),
          map((dbUser) => {
            const userData = dbUser.data();
            console.log('DB USER: ', userData);

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

// /**
//  * Subscribe to Firebase auth state changes, including token refresh
//  *
//  * @param options
//  */
// export function useUser<T = unknown>(options?: ReactFireOptions<T>): ObservableStatus<User | null> {
//   const auth = useAuth();

//   const observableId = `auth:user:${auth.name}`;
//   const observable$ = user(auth);

//   return useObservable(observableId, observable$, options);
// }

// https://firebase.blog/posts/2018/09/introducing-rxfire-easy-async-firebase
// import 'firebase/auth';
// import 'firebase/storage';
// import { authState } from 'rxfire/auth';
// import { getDownloadURL } from 'rxfire/storage';
// import { switchMap, filter } from 'rxjs/operators';

// authState(app.auth())
//   .pipe(
//     filter(u => u !== null),
//     switchMap(u => {
//       const ref = app.storage().ref(`profile/${u.uid}`);
//       return getDownloadURL(ref):
//     });
//   ).subscribe(photoURL => {
//     console.log('the logged in user's photo', photoURL);
//   });

// export function useSigninCheck(
//   options?:
//     | SignInCheckOptionsBasic
//     | SignInCheckOptionsClaimsObject
//     | SignInCheckOptionsClaimsValidator
// ): ObservableStatus<SigninCheckResult> {
//   // If both `requiredClaims` and `validateCustomClaims` are provided, we won't know which one to use
//   if (
//     options?.hasOwnProperty('requiredClaims') &&
//     options?.hasOwnProperty('validateCustomClaims')
//   ) {
//     throw new Error(
//       'Cannot have both "requiredClaims" and "validateCustomClaims". Use one or the other.'
//     );
//   }

//   const auth = useAuth();

//   // ObservableId should change for different options configurations to ensure no cache collisions
//   let observableId = `auth:signInCheck:${auth.name}::forceRefresh:${!!options?.forceRefresh}`;
//   if (options?.forceRefresh) {
//     observableId = `${observableId}:forceRefresh:${options.forceRefresh}`;
//   }
//   if (options?.hasOwnProperty('requiredClaims')) {
//     observableId = `${observableId}:requiredClaims:${JSON.stringify(
//       (options as SignInCheckOptionsClaimsObject).requiredClaims
//     )}`;
//   } else if (options?.hasOwnProperty('validateCustomClaims')) {
//     // TODO(jamesdaniels): Check if stringifying this function breaks in IE11
//     observableId = `${observableId}:validateCustomClaims:${JSON.stringify(
//       (options as SignInCheckOptionsClaimsValidator).validateCustomClaims
//     )}`;
//   }

//   const observable = user(auth).pipe(
//     switchMap((user) => {
//       if (!user) {
//         const result: SigninCheckResult = {
//           signedIn: false,
//           hasRequiredClaims: false,
//           errors: {},
//           user: null,
//         };
//         return of(result);
//       } else if (
//         options &&
//         (options.hasOwnProperty('requiredClaims') || options.hasOwnProperty('validateCustomClaims'))
//       ) {
//         return from(user.getIdTokenResult(options?.forceRefresh ?? false)).pipe(
//           map((idTokenResult) => {
//             let validator: ClaimsValidator;

//             if (options.hasOwnProperty('requiredClaims')) {
//               validator = getClaimsObjectValidator(
//                 (options as SignInCheckOptionsClaimsObject).requiredClaims
//               );
//             } else {
//               validator = (options as SignInCheckOptionsClaimsValidator).validateCustomClaims;
//             }

//             const { hasRequiredClaims, errors } = validator(idTokenResult.claims);

//             const result: SigninCheckResult = {
//               signedIn: true,
//               hasRequiredClaims,
//               errors,
//               user: user,
//             };
//             return result;
//           })
//         );
//       } else {
//         // If no claims are provided to be checked, `hasRequiredClaims` is true
//         const result: SigninCheckResult = {
//           signedIn: true,
//           hasRequiredClaims: true,
//           errors: {},
//           user: user,
//         };
//         return of(result);
//       }
//     })
//   );

//   return useObservable(observableId, observable);
// }
