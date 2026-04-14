import type { ParsedToken, User } from 'firebase/auth';
import { doc } from 'firebase/firestore';
import { isEmpty } from 'lodash';
import { useRef } from 'react';
import {
  ObservableStatus,
  useAuth,
  useFirestore,
  useObservable,
} from 'reactfire';
import { authState } from 'rxfire/auth';
import { doc as rxDoc } from 'rxfire/firestore';
import { from, of } from 'rxjs';
import { switchMap } from 'rxjs/operators';

import { env, userClaimsCollection } from 'common';
import type { CustomClaimsInterface } from 'context';

// guided by useSignInCheck observable: https://github.com/FirebaseExtended/reactfire/blob/main/src/auth.tsx

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
      if (!user) return of(getResult(null, null, null));

      let orgId = user.tenantId ?? null;
      if (!orgId && user.email?.endsWith(env.VITE_MGA_DOMAIN))
        orgId = import.meta.env.VITE_MGA_ORG_ID;

      // if no org, return user without orgId or claims
      if (!orgId) return of(getResult(user, null, null));

      // subscribe to claims document
      const claimsDocRef = doc(
        userClaimsCollection(firestore, orgId),
        user.uid,
      );

      return from(rxDoc(claimsDocRef)).pipe(
        switchMap((claimsDoc) => {
          const claimsData = claimsDoc.data();

          if (!claimsData || isEmpty(claimsData))
            return of(getResult(user, orgId, {}));

          // only refresh when doc updated
          let requiresRefresh =
            claimsData?._lastCommitted &&
            lastCommittedRef.current &&
            !claimsData._lastCommitted.isEqual(lastCommittedRef.current);

          if (claimsData?._lastCommitted)
            lastCommittedRef.current = claimsData._lastCommitted;

          // get iD token (refresh new token from server if claims doc changed)
          return from(user.getIdTokenResult(requiresRefresh)).pipe(
            // map((idTokenResult) => getResult(user, orgId, idTokenResult.claims))
            switchMap((idTokenResult) =>
              of(getResult(user, orgId, idTokenResult.claims)),
            ),
          );
        }),
      );
    }),
  );

  return useObservable(observableId, observable$, { suspense: true });
};

function getResult(
  user: User | null,
  orgId: string | null,
  claims: ParsedToken | null | undefined,
): UserWithClaimsResult {
  let customClaims = !claims
    ? null
    : {
        iDemandAdmin: !!claims?.iDemandAdmin,
        iDemandUser: !!claims?.iDemandUser,
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
