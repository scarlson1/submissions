import { isArray, isEqual, isObject, transform } from 'lodash-es';

export interface Obj {
  [key: string | number | symbol]: any;
}
/**
 * Find difference between two objects
 * @param  {object} origObj - Source object to compare newObj against
 * @param  {object} newObj  - New object with potential changes
 * @return {object} differences
 */
export function getDifference(origObj: any, newObj: any) {
  function changes(newObj: any, origObj: any) {
    let arrayIndexCounter = 0;

    // alternative to .reduce - transforms object to a new accumulator object
    return transform(newObj, function (acc: Obj, value, key) {
      // if current value not equal to current value in original object, add property to accumulator/result
      if (!isEqual(value, origObj[key])) {
        // if array, use the index as the key on the accumulator/result
        let resultKey = isArray(origObj) ? arrayIndexCounter++ : key;

        // set the difference
        acc[resultKey] =
          isObject(value) && isObject(origObj[key]) ? changes(value, origObj[key]) : value;
      }
    });
  }

  return changes(newObj, origObj);
}
