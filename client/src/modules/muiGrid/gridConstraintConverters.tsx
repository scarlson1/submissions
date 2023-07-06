import { GridFilterModel, GridSortModel } from '@mui/x-data-grid';
import {
  QueryFieldFilterConstraint,
  QueryOrderByConstraint,
  Timestamp,
  WhereFilterOp,
  orderBy,
  where,
} from 'firebase/firestore';
import { isInequalityOp, isWhereFilterOp } from 'modules/utils';

export function getFirestoreSortOps(sortModel: GridSortModel | undefined = []) {
  let sortOps: QueryOrderByConstraint[] = [];

  for (let sortItem of sortModel) sortOps.push(orderBy(sortItem.field, sortItem.sort || undefined));

  return sortOps;
}

export function getFirestoreFilters(filterModel: GridFilterModel | undefined) {
  const newFilters: (QueryFieldFilterConstraint | QueryOrderByConstraint)[] = [];

  if (!filterModel) return newFilters;

  // TODO: check for limitations - https://firebase.google.com/docs/firestore/query-data/queries#query_limitations

  filterModel.items.forEach((f) => {
    let isNotEmptyFilter = f.value !== undefined || f.operator === '!=';
    let valDefined = f.value !== undefined;
    let isEmptyArr = Array.isArray(f.value) && !f.value?.length;
    const isFilterOp = isWhereFilterOp(f.operator);

    if ((valDefined || isNotEmptyFilter) && !isEmptyArr && isFilterOp) {
      let op = f.operator as WhereFilterOp;
      let val = f.value ?? false;
      // console.log('val is timestamp: ', val instanceof Timestamp);
      // console.log('val is date: ', val instanceof Date);
      if (val instanceof Date) val = Timestamp.fromDate(new Date(val));

      if (isInequalityOp(op)) newFilters.push(orderBy(f.field, 'desc'));
      if (op) newFilters.push(where(f.field, op, val));
    }
  });

  return newFilters;
}
