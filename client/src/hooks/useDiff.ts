import { useState, useEffect, useCallback, useMemo } from 'react';

import { getDifference, Obj } from 'modules/utils';

// TODO: parse & highlight diff fields included in checkFields ??

/**
 * Find difference between two objects
 * @param  {object} origObj - Source object to compare newObj against
 * @param  {object} newObj  - New object with potential changes
 * @param  {string[]} checkFields  - Optional array if only care about certain fields. Only applies to isDiff boolean (still compares entire object)
 * @return {[object, boolean]} differences,
 */

export const useDiff = (origObj: any, newObj: any, checkFields?: string[]) => {
  const [diff, setDiff] = useState<Obj>();
  const isDiff = useMemo(() => {
    if (!diff) return false;
    if (!checkFields) return !isObjEmpty(diff);

    const passAllChecks = checkFields.every((key) => !diff[key]);
    console.log('PASS ALL CHECKS: ', passAllChecks);
    return passAllChecks;
  }, [checkFields, diff]);

  useEffect(() => {
    const result = getDifference(origObj, newObj);
    console.log('DIFF: ', result);

    setDiff(result);
  }, [origObj, newObj]);

  return [diff, isDiff];
};

export const useGetDiff = (checkFields?: string[]) => {
  const [diff, setDiff] = useState<Obj>();
  const isDiff = useMemo(() => {
    if (!diff) return false;
    if (!checkFields) return !isObjEmpty(diff);

    const passAllChecks = checkFields.every((key) => !diff[key]);
    console.log('PASS ALL CHECKS: ', passAllChecks);
    return passAllChecks;
  }, [checkFields, diff]);

  const getDiff = useCallback((origObj: any, newObj: any) => {
    const result = getDifference(origObj, newObj);
    console.log('DIFF: ', result);

    setDiff(result);
    return result;
  }, []);

  return [getDiff, diff, isDiff] as const;
};

function isObjEmpty(obj: any) {
  return Object.keys(obj).length === 0;
}
