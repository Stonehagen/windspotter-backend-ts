import { IForecastModel } from '../interfaces/models';
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

export const sortFilesByValue = (
  files: string[],
  value: string,
  forecastConfig: IForecastModel,
): string[] => {
  const regex = forecastConfig.regexNameValue;
  return files.filter((file) => {
    const match = file.match(regex);
    if (forecastConfig.name === 'gfsAWS') {
      if (match) {
        return match[0].toLowerCase() === value.toLowerCase().split(':')[1];
      }
      return false;
    }
    if (match) {
      return match[0].toLowerCase() === value.toLowerCase();
    }
    return false;
  });
};
