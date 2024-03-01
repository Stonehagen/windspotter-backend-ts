import fs from 'fs';

export const getFiles = async (path: string): Promise<string[]> => {
  const files: string[] = fs.readdirSync(path);
  // remove hidden files from fileList
  return files.filter((file) => !file.startsWith('.'));
};

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

export const sortFilesByValue = (files, value, forecastConfigName) => {
  const regex = config[forecastConfigName].regexNameValue;
  return files.filter(
    (file) => file.match(regex)[0].toLowerCase() === value.toLowerCase(),
  );
};