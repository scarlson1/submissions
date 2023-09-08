import { isValid } from 'date-fns';
import { getTimezoneOffset, format, utcToZonedTime } from 'date-fns-tz';

const addMS = (date: Date | string, milliseconds: number) => {
  const result = new Date(date);
  result.setMilliseconds(result.getMilliseconds() + milliseconds);
  return result;
};

function logDates(d: Date) {
  console.log(
    'NY: ',
    format(utcToZonedTime(d, 'America/New_York'), 'yyyy-MM-dd HH:mm:ss zzz', {
      timeZone: 'America/New_York',
    })
  );
  console.log(
    'CHI: ',
    format(utcToZonedTime(d, 'America/Chicago'), 'yyyy-MM-dd HH:mm:ss zzz', {
      timeZone: 'America/Chicago',
    })
  );
  console.log(
    'LA: ',
    format(utcToZonedTime(d, 'America/Los_Angeles'), 'yyyy-MM-dd HH:mm:ss zzz', {
      timeZone: 'America/Los_Angeles',
    })
  );
}

export function dateWithTimeZone(val: string, zone: string = 'America/Los_Angeles') {
  console.log('DATE:', val);
  if (!isValid(new Date(val))) return null;
  const valDate = new Date(val);

  const offsetMS = getTimezoneOffset(zone);
  const date = addMS(valDate, -offsetMS);
  logDates(date);

  return date;
  // return val ? startOfDay(new Date(val)) : null; // && isValid(val)
}
