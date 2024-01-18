import fs from 'fs';

export const getFiles = async (path: string): Promise<string[]> => {
  const files: string[] = fs.readdirSync(path);
  // remove hidden files from fileList
  return files.filter((file) => !file.startsWith('.'));
};