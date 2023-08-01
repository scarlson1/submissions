import { useRef } from 'react';
import type { ParsedToken, User } from 'firebase/auth';
import { doc } from 'firebase/firestore';
import { ObservableStatus, useAuth, useFirestore, useObservable } from 'reactfire';
import { authState } from 'rxfire/auth';
import { doc as rxDoc } from 'rxfire/firestore';
import { switchMap } from 'rxjs/operators';
import { from, of } from 'rxjs';
import { isEmpty } from 'lodash';

import { userClaimsCollection } from 'common';
import type { CustomClaimsInterface } from 'context';

// const DEFAULT_CLAIMS = {
//   iDemandAdmin: false,
//   orgAdmin: false,
//   agent: false,
// };

function getResult(
  user: User,
  orgId: string | null,
  claims: ParsedToken | null | undefined
): UserWithClaimsResult {
  let customClaims = !claims
    ? null
    : {
        iDemandAdmin: !!claims?.iDemandAdmin,
        orgAdmin: !!claims?.orgAdmin,
        agent: !!claims?.agent,
      };

  return {
    claims: customClaims,
    user: user,
    orgId: orgId,
    isSignedIn: !!user,
  };
}

export interface UserWithClaimsResult {
  claims: CustomClaimsInterface | null;
  user: User | null;
  orgId: string | null;
  isSignedIn: boolean;
}

// options?: {
//   forceRefresh?: boolean;
// }
// let observableId = `auth:userClaims:${auth.name}::forceRefresh:${!!options?.forceRefresh}`;
// if (options?.forceRefresh) {
//   observableId = `${observableId}:forceRefresh:${options.forceRefresh}`;
// }

export const useUserClaims = (): ObservableStatus<UserWithClaimsResult> => {
  const auth = useAuth();
  const firestore = useFirestore();
  const lastCommittedRef = useRef(null);

  let observableId = `auth:userClaims:${auth.name}`;

  const observable$ = authState(auth).pipe(
    switchMap((user) => {
      if (user) {
        let orgId = user.tenantId ?? null;
        if (!orgId && user.email?.endsWith('@idemandinsurance.com')) orgId = 'idemand';

        if (orgId) {
          // subscribe to claims document
          const claimsDocRef = doc(userClaimsCollection(firestore, orgId), user.uid);

          // return from(rxDoc(claimsDocRef)).pipe(
          //   map((claimsDoc) => {
          return from(rxDoc(claimsDocRef)).pipe(
            switchMap((claimsDoc) => {
              const claimsData = claimsDoc.data();

              if (!claimsData || isEmpty(claimsData)) {
                let result: UserWithClaimsResult = {
                  claims: null, // DEFAULT_CLAIMS,
                  user: user,
                  orgId: orgId,
                  isSignedIn: true,
                };
                return of(result);
              }

              // only refresh when doc updated
              // if (claimsData?._lastCommitted) {
              let requiresRefresh =
                claimsData?._lastCommitted &&
                lastCommittedRef.current &&
                !claimsData._lastCommitted.isEqual(lastCommittedRef.current);

              if (claimsData?._lastCommitted) lastCommittedRef.current = claimsData._lastCommitted;

              return from(user.getIdTokenResult(requiresRefresh)).pipe(
                switchMap((idTokenResult) => {
                  const { claims } = idTokenResult;

                  return of(getResult(user, orgId, claims));
                })
              );
            })
          );
        } else {
          let result: UserWithClaimsResult = {
            claims: null, // DEFAULT_CLAIMS,
            user: user,
            orgId: null,
            isSignedIn: true,
          };
          return of(result);
        }
      } else {
        let result: UserWithClaimsResult = {
          claims: null, // DEFAULT_CLAIMS,
          user: null,
          orgId: null,
          isSignedIn: false,
        };
        return of(result);
      }
    })
  );

  return useObservable(observableId, observable$, { suspense: true });
};

// USESIGNINCHECK:

// const observable = user(auth).pipe(
//   switchMap((user) => {
//     if (!user) {
//       const result: SigninCheckResult = {
//         signedIn: false,
//         hasRequiredClaims: false,
//         errors: {},
//         user: null,
//       };
//       return of(result);
//     } else if (
//       options &&
//       (options.hasOwnProperty('requiredClaims') || options.hasOwnProperty('validateCustomClaims'))
//     ) {
// return from(user.getIdTokenResult(options?.forceRefresh ?? false)).pipe(
//   map((idTokenResult) => {
//           let validator: ClaimsValidator;

//           if (options.hasOwnProperty('requiredClaims')) {
//             validator = getClaimsObjectValidator(
//               (options as SignInCheckOptionsClaimsObject).requiredClaims
//             );
//           } else {
//             validator = (options as SignInCheckOptionsClaimsValidator).validateCustomClaims;
//           }

//           const { hasRequiredClaims, errors } = validator(idTokenResult.claims);

//           const result: SigninCheckResult = {
//             signedIn: true,
//             hasRequiredClaims,
//             errors,
//             user: user,
//           };
//           return result;
//         })
//       );
//     } else {
//       // If no claims are provided to be checked, `hasRequiredClaims` is true
//       const result: SigninCheckResult = {
//         signedIn: true,
//         hasRequiredClaims: true,
//         errors: {},
//         user: user,
//       };
//       return of(result);
//     }
//   })
// );
