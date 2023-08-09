import { info } from 'firebase-functions/logger';
import type { StorageEvent } from 'firebase-functions/v2/storage';
import path from 'path';

/** check if folder match, filename prefix, new, or filetype validations match
 * @param {StorageEvent} e firebase cloud storage function event
 * @param {string} uploadFolder check whether file matches uploadFolder path
 * @param {string} contentType optionally ensure file type
 * @param {string} startsWith optionally check if file contains prefix (ignore if true)
 * @returns {boolean} true if any of the checks fail
 */
export function shouldReturnEarly(
  e: StorageEvent,
  uploadFolder: string,
  contentType?: string,
  startsWith?: string
) {
  if (
    !(
      isFolder(e, uploadFolder) &&
      notStartWith(e, startsWith) &&
      isNewFile(e) &&
      isContentType(e, contentType) &&
      filePathExists(e)
    )
  ) {
    return true;
  }
  return false;
}

function isFolder(event: StorageEvent, folder: string) {
  if (event.data.name?.startsWith(`${folder}/`)) return true;

  info(`Ignoring upload "${event.data.name}" because is not in the "/${folder}/*" folder.`);
  return false;
}

function notStartWith(event: StorageEvent, word: string = 'processed') {
  const filePath = event.data.name;
  const fileName = path.basename(filePath || '');

  if (!fileName.startsWith(word)) return true;

  info(`Ignoring upload "${event.data.name}" because filename starts with ${word}.`);
  return false;
}

function isNewFile(event: StorageEvent) {
  const metageneration = event.data.metageneration as unknown;
  if (metageneration === '1') return true;

  info(`Ignoring file. Metageneration: ${metageneration}.`);
  return false;
}

// TODO: accept array of types
function isContentType(event: StorageEvent, checkType?: string | null | undefined) {
  const contentType = event.data.contentType;

  // if not provided or match, return true
  if (!checkType || contentType === checkType) return true;

  info(`Ignoring new file. contentType: ${contentType}.`);
  return false;
}

// function isCSV(event: StorageEvent) {
//   const contentType = event.data.contentType;

//   if (contentType === 'text/csv') return true
//   info(
//     `Ignoring new file. contentType: ${contentType}.`
//   );
//   return false
// }

function filePathExists(event: StorageEvent) {
  const filePath = event.data.name;
  if (filePath) return true;

  info(`Ignoring new file. Missing filePath`);
  return false;
}

const DEFAULT_MAX_AGE = 1000 * 60 * 1; // 1 min

/**
 * check if event is older than maxAge milliseconds
 * @param {StorageEvent} event - storage event
 * @param {number} maxAge - max age in milliseconds (defaults to 1 min)
 * @returns {boolean} returns true if event is older than maxAge
 */
export function eventOlderThan(event: StorageEvent, maxAge: number = DEFAULT_MAX_AGE) {
  const eventAge = Date.now() - Date.parse(event.time);

  if (eventAge > maxAge) {
    info(`Event ${event.id} age is greater than ${eventAge} ms.`, { ...event });
    return true;
  }
  return false;
}
