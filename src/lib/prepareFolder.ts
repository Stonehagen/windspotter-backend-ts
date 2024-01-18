import fs from 'fs';
import { deleteFiles } from './deleteFiles';

export const prepareFolder = async (path: string): Promise<void> => {
  //check if path exists
  if (!fs.existsSync(path)) {
    fs.mkdirSync(path);
  } else {
    // delete old files
    await deleteFiles(path);
  }
};
