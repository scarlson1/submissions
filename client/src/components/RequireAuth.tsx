import { UserCredential, getAuth, signInAnonymously } from 'firebase/auth';
import { useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';

// import { auth } from 'firebaseConfig';
import { CLAIMS } from 'common';
import { useClaims } from 'hooks';
import { AUTH_ROUTES, createPath } from 'router';

// TODO: read for reference: https://adarshaacharya.com.np/blog/role-based-auth-with-react-router-v6

type CustomClaimKeys = keyof typeof CLAIMS;

export interface RequireAuthProps {
  children: JSX.Element;
  allowAnonymous?: boolean;
  requiredClaims?: null | CustomClaimKeys[];
  redirectPath?: string;
  shouldSignInAnonymously?: boolean;
}

export const RequireAuth = ({
  children,
  allowAnonymous = false,
  requiredClaims = null,
  redirectPath = createPath({ path: AUTH_ROUTES.LOGIN }),
  shouldSignInAnonymously = false,
}: RequireAuthProps) => {
  const auth = getAuth();
  // let { claims } = useAuth(); // loadingInitial, //error,
  const { claims } = useClaims();
  let location = useLocation();
  const navigate = useNavigate();

  let user = getAuth().currentUser;

  // If requiredClaims included, check required claims
  // TODO: use claimsCheck from reactfire
  useEffect(() => {
    if (requiredClaims && requiredClaims.length > 0) {
      // && !loadingInitial
      // let notAuthorized = requiredClaims.every((key) => !claims[CLAIMS[key]]);
      let notAuthorized =
        claims !== null ? requiredClaims.every((key) => !claims![CLAIMS[key]]) : true;

      if (!!notAuthorized) {
        if (user && user.uid) {
          toast.error(
            `You're account does not have the required permissions to access this route.`,
            {
              duration: 8000,
            }
          );
        }
        console.log('REDIRECTING - MISSING REQUIRED CLAIMS');
        if (location.key !== 'default') return navigate(-1);
        return navigate(createPath({ path: AUTH_ROUTES.LOGIN }), {
          replace: true,
          state: { from: location },
        });
      }
    }
  }, [requiredClaims, claims, user, location, navigate]);

  // if not authenticated and prop shouldSignInAnonymously = true, sign in anonymously
  useEffect(() => {
    if (!(user && user.uid) && !!shouldSignInAnonymously) {
      signInAnonymously(auth)
        .then((userCred: UserCredential) => {
          console.log('SIGNED IN ANONYMOUSLY: ', userCred);
        })
        .catch((err: unknown) => {
          console.log('ERROR => ', err);
        });
    }
  }, [auth, user, shouldSignInAnonymously]);

  // if (loadingInitial) {
  //   return <CircularProgress />;
  // }

  // If auth error, redirect to home page by default
  // if (error) {
  //   console.log('AUTH ERROR REDIRECTING TO SIGNIN');
  //   return <Navigate to={'/'} state={{ from: location }} replace />;
  // }

  // if not signed in, redirect to sign in page
  if (
    (!(user && user.uid) || (!allowAnonymous && !!user.isAnonymous)) &&
    !shouldSignInAnonymously
  ) {
    console.log("not authenticated => routing to '/login'"); // , user, loadingInitial
    // TODO: toast causes bug on start up
    // toast.error('Authentication required to access route');
    return <Navigate to={redirectPath} state={{ from: location }} replace={true} />;
  }

  return children;
};

export default RequireAuth;
