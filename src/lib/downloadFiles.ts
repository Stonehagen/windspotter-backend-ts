import fs from 'fs';
import ftp from 'basic-ftp';
import { IForecastModel, ILatestPrefix } from '../interfaces/models';
import { getLatestPrefix, getKeysFromPrefix, getBody } from './handleAWS';
import { getNextForecastTimeHour, getServerTimestamp } from './handleFTP';
import decompress from 'decompress';
const decompressBzip2 = require('decompress-bzip2');



const decompressFile = async (file: string, name: string) => {
  const regex = /.*(?=.bz2)/;
  const match = file.match(regex);
  if (match) {
    await decompress(`./grib_data_${name}/${match[0]}`, './', {
      plugins: [
        decompressBzip2({
          path: `./grib_data_${name}/${match[0]}`,
        }),
      ],
    });
    await fs.unlinkSync(`./grib_data_${name}/${file}`);
    fs.chmodSync(`./grib_data_${name}/${match[0]}`, 0o755);
  }
};

const downloadFilesAWS = async (
  dbTimestamp: Date,
  forecastConfig: IForecastModel,
): Promise<boolean> => {
  const latestPrefix: ILatestPrefix | undefined = await getLatestPrefix(
    forecastConfig,
  );
  if (!latestPrefix) return false;
  const { hourPrefix, hour, hourPrefixBefore } = latestPrefix;

  let forecastHour = hour;
  let fullPrefix = `${hourPrefix}/atmos/`;
  let files: string[] | undefined = await getKeysFromPrefix(
    forecastConfig,
    fullPrefix,
    hour,
  );
  if (files === undefined) {
    if (hour != '00') {
      const newhour = (+hour - 6).toString().padStart(2, '0');
      const newPrefix = hourPrefix.replace(`/${hour}`, `/${newhour}`);
      fullPrefix = `${newPrefix}/atmos/`;
      files = await getKeysFromPrefix(forecastConfig, fullPrefix, newhour);
      forecastHour = newhour;
    } else {
      const newhour = '18';
      const newPrefix = hourPrefixBefore.replace(`/${hour}`, `/${newhour}`);
      fullPrefix = `${newPrefix}/atmos/`;
      files = await getKeysFromPrefix(forecastConfig, fullPrefix, newhour);
      forecastHour = newhour;
    }
  }
  if (files === undefined) return false;
  const forecastDateMatch = hourPrefix.match(/(?<=gfs\.)[0-9]{8}/);
  if (forecastDateMatch === null) return false;
  const forecastDate = forecastDateMatch[0];
  // get timestamp from forecastDate and hour
  const dateSting = `${forecastDate.slice(0, 4)}-${forecastDate.slice(
    4,
    6,
  )}-${forecastDate.slice(6, 8)}T`;
  const forecastTimestamp = new Date(`${dateSting}${forecastHour}:00:00.000Z`);

  //check if timestemp is newer than databaseTimestamp
  if (
    forecastTimestamp < dbTimestamp ||
    (Number(dbTimestamp.getUTCHours()) === Number(forecastHour) &&
      dbTimestamp.getUTCDate() === forecastTimestamp.getUTCDate())
  ) {
    console.log('database is up to date');
    return false;
  }

  // download the files in bundles of 5 files parralel and log the progress to the console
  const filesList = [];
  for (let i = 0; i < files.length; i += 5) {
    filesList.push(files.slice(i, i + 5));
  }
  const dateMatch = hourPrefix.match(/(?<=gfs\.)[0-9]{8}/);
  const date = dateMatch ? dateMatch[0] : '';
  for (const files of filesList) {
    const downloadPromises = [];
    for (let i = 0; i < files.length; i += 5) {
      const filesBundle = files.slice(i, i + 5);
      const downloadPromise = Promise.all(
        filesBundle.map(async (file) => {
          const body = await getBody(forecastConfig.bucket, file);
          const filename = file.split('/').pop();
          return fs.promises.writeFile(
            `./grib_data_${forecastConfig.name}/${date}_${filename}.grb2`,
            body,
          );
        }),
      );
      downloadPromises.push(downloadPromise);
    }
    await Promise.all(downloadPromises);
  }

  return true;
};

const downloadFilesFTP = async (
  dbTimestamp: Date,
  forecastConfig: IForecastModel,
): Promise<boolean> => {
  const client = new ftp.Client();

  try {
    await client.access({
      host: forecastConfig.server,
    });
    // get a list of folders from the given ftp path
    const dirList = await client.list(forecastConfig.dict);
    // convert list of folders to list of folderNames (forecastTimes)
    const forecastTimes = dirList.map((folderInfo) => folderInfo.name);
    // get the latest forecast folder name
    let nextForecastTimeHour = getNextForecastTimeHour(forecastTimes);
    const fileList = await client.list(
      `${forecastConfig.dict}/${nextForecastTimeHour}`,
    );
    // get the last update time from the requested files
    const serverTimestamp = getServerTimestamp(fileList, forecastConfig);
    // check if the files are older than the data in our database

    if (
      serverTimestamp < dbTimestamp ||
      new Date().getTime() - serverTimestamp.getTime() < 5 * 60 * 1000
    ) {
      // get one forecast time before
      const forecastTimesBefore = forecastTimes.filter(
        (time) => time < nextForecastTimeHour,
      );
      // check for day shift
      let prevForecastTimeHour =
        forecastTimesBefore.length !== 0
          ? getNextForecastTimeHour(forecastTimesBefore)
          : forecastTimes[forecastTimes.length - 1];

      const nexForecasstFileList = await client.list(
        `${forecastConfig.dict}/${prevForecastTimeHour}`,
      );
      // get the last update time from the requested files
      const nextServerTimestamp = getServerTimestamp(
        nexForecasstFileList,
        forecastConfig,
      );
      // check if the files are older than the data in our database
      if (
        nextServerTimestamp < dbTimestamp ||
        (dbTimestamp.getUTCHours() === Number(prevForecastTimeHour) &&
          dbTimestamp.getUTCDate() === nextServerTimestamp.getUTCDate())
      ) {
        console.log('database is up to date');
        client.close();
        return false;
      }
      await client.cd(`${forecastConfig.dict}/${prevForecastTimeHour}`);
      nextForecastTimeHour = prevForecastTimeHour;
    } else {
      await client.cd(`${forecastConfig.dict}/${nextForecastTimeHour}`);
    }

    // create a list of the files und download them
    for (const value of forecastConfig.dataValues) {
      let clientList = await client.list(`./${value}`);
      // filter out the unwanted files
      let filenames = clientList
        .map((file) => file.name)
        .filter(
          (name) =>
            name.includes(forecastConfig.fcModel) &&
            name.includes(forecastConfig.fcHeight),
        );
      //check for actual data
      const latestModiefedAtDate = Math.max(
        ...filenames.map((file) => {
          const tenDigitsRegex = /(?<!\d)\d{10}(?!\d)/;
          const match = file.match(tenDigitsRegex);
          return match ? Number(match[0]) : 0;
        }),
      );
      //filter out old files
      filenames = filenames.filter((file) =>
        file.includes(latestModiefedAtDate.toString()),
      );

      // TODO: download files in parallel and decompress after download
      // download file per file
      for (const file of filenames) {
        await client.downloadTo(
          `./grib_data_${forecastConfig.name}/${file}`,
          `./${value}/${file}`,
        );
        await decompressFile(file, forecastConfig.name);
      }
    }

    client.close();
    return true;
  } catch (error) {
    console.error(error);
    return false;
  }
};

export const downloadFiles = async (
  dbTimestamp: Date,
  forecastConfig: IForecastModel,
): Promise<boolean> => {
  let hasDownloaded: boolean = false;
  // check if forecast server is AWS
  if (forecastConfig.server === 'AWS') {
    // download files from AWS
    hasDownloaded = await downloadFilesAWS(dbTimestamp, forecastConfig);
  } else {
    // download files from FTP
    hasDownloaded = await downloadFilesFTP(dbTimestamp, forecastConfig);
  }
  return hasDownloaded;
};
