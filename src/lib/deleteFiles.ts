import fs from 'fs';
import { getFiles } from './getFiles';

export const deleteFiles = async (path: string): Promise<void> => {
  const files: string[] = await getFiles(path);
  if (!files) {
    return;
  }
  const unlinkPromises = files.map((file) =>
    fs.promises.unlink(`${path}/${file}`),
  );
  await Promise.all(unlinkPromises);
};
