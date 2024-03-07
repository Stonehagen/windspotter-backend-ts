import { FileInfo } from 'basic-ftp';
import { IForecastModel } from '../interfaces/models';

export const getNextForecastTimeHour = (forecastTimes: string[]): string => {
  // convert Strings into Numbers
  const forecastTimesNumbers = forecastTimes.map((hour) => parseInt(hour, 10));
  // get the hour of the current time
  const hourNow = new Date().getUTCHours();
  // get the latest forcastTime to hour current time
  const nextForecastTimeHour = Math.max(
    ...forecastTimesNumbers.filter((hour) => hour <= hourNow),
  );
  // return the number as string with leading zeros
  return String(nextForecastTimeHour).padStart(2, '0');
};

const getFileTimestamps = (
  files: FileInfo[],
): number[] => {
  const dateNow = new Date();
  return files.map((file) => {
    // split the date Sting and create a timestamp from it
    const modDateArr = file.rawModifiedAt.split(' ');
    const timestamp = new Date(
      `${modDateArr[0]} ${modDateArr[1]}, ${dateNow.getFullYear()} ${
        modDateArr[2]
      }+00:00`,
    );
    // Jan 01 cornercase
    if (timestamp > dateNow) {
      timestamp.setFullYear(timestamp.getFullYear() - 1);
    }
    return timestamp.getTime();
  });
};

export const getServerTimestamp = (
  fileList: FileInfo[],
  forecastConfig: IForecastModel,
): Date => {
  // reduce array to only get the required values
  const sortedFiles = fileList.filter((file) =>
    forecastConfig.dataValues.includes(file.name),
  );
  const fileTimestamps = getFileTimestamps(sortedFiles);
  // return latest Timestamp from folder
  return new Date(Math.max(...fileTimestamps));
};