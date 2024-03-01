import fs from 'fs';
import { getFiles } from './getFiles';

export const deleteFiles = async (path: string): Promise<boolean> => {
  const files: string[] = await getFiles(path);
  if (!files) {
    return true;
  }
  const unlinkPromises = files.map((file) =>
    fs.promises.unlink(`${path}/${file}`),
  );
  await Promise.all(unlinkPromises);
  return true;
};
