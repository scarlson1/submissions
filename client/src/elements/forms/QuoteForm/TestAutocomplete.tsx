import { Box, Typography } from '@mui/material';
import { useUsers } from 'hooks/useUsers';

// TODO: use algolia implementation
// allowing read access to permissions doc defeats purpose of storing it separately ??

// mui load on open: https://mui.com/material-ui/react-autocomplete/#load-on-open

// user option query
// collection group query across access collection (where userId included in agentId (or orgId if orgAdmin))
// query passed as prop ??

// get user docs from result

// use rxjs if using firestore implementation

// const useUserOptions = (constraints: QueryFieldFilterConstraint[]) => {
//   const { data: user } = useUser();
//   invariant(user);
//   const { data: userAccessData } = useCollectionGroupData('permissions', constraints);

//   const userIds = useMemo(() => {
//     return userAccessData.filter((d) => d.userId).map((d) => d.userId);
//   }, [userAccessData]);

//   const [users, setUsers] = useState<WithId<User>[]>([]);

//   const fetchUsers = useCallback(async () => {
//     console.log('fetching users...', userIds);
//     const usersCol = usersCollection(getFirestore());
//     let usersData = [];
//     for (let userId of userIds) {
//       let userSnap = await getDoc(doc(usersCol, userId));
//       if (userSnap.exists()) usersData.push({ ...userSnap.data(), id: userSnap.id });
//     }
//     setUsers([...usersData]);
//   }, [userIds]);

//   useEffect(() => {
//     userIds.length && fetchUsers();
//   }, [userIds, fetchUsers]);

//   console.log('user access: ', userAccessData);

//   return useMemo(() => users, [users]);
// };

export const TestAutocomplete = () => {
  // const { claims, orgId, user } = useClaims();
  // invariant(user);

  // const constraints = useMemo(() => {
  //   if (claims.iDemandAdmin) return [];
  //   if (claims.orgAdmin) return [where('orgIds', 'array-contains', orgId)];
  //   if (claims.agent && user?.uid) return [where('agentIds', 'array-contains', user.uid)];
  //   return [where('userId', '==', user.uid)];
  // }, [claims, user]);

  // const userOptions = useUserOptions(constraints);

  const { data: userOptions } = useUsers();
  console.log('test: ', userOptions);

  return (
    <Box>
      {userOptions.map((u) => (
        <Typography key={u.id}>{`${u.displayName} - ${u.email}`}</Typography>
      ))}
    </Box>
  );
};
