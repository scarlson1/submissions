import { error, info } from 'firebase-functions/logger';
import { unlinkSync } from 'fs';

// TODO: move to utils/storage.ts
export async function unlinkFile(filePath: string) {
  try {
    info(`Unlinking file: ${filePath}`, { filePath });
    if (filePath) unlinkSync(filePath);
  } catch (err: any) {
    error(`Error unlinking file ${filePath}`, { errMsg: err?.message, err, filePath });
  }
}

export async function clearTempFiles(filePaths: string[]) {
  for (const filePath of filePaths) {
    await unlinkFile(filePath);
  }
}
