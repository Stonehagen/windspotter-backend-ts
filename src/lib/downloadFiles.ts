import fs from 'fs';
import {
  S3Client,
  GetObjectCommand,
  ListObjectsCommand,
} from '@aws-sdk/client-s3';
import { IForecastModel, ILatestPrefix } from '../interfaces/models';

const getDatePrefix = (nDays: number): string => {
  // get the current date at the time of 00:00:00:00 and subtract an amount of days from it
  const date = new Date();
  date.setUTCHours(0, 0, 0, 0);
  date.setDate(date.getDate() - nDays);
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  // return the date as prefix for the aws server
  return `gfs.${year}${month}${day}`;
};

const getHourPrefixForDate = async (
  client: S3Client,
  forecastConfig: IForecastModel,
  prefix: string,
) => {
  const command = new ListObjectsCommand({
    Bucket: forecastConfig.bucket,
    Delimiter: '/',
    Prefix: `${prefix}/`,
    MaxKeys: 1000,
  });
  const hourprefixes = (await client.send(command)).CommonPrefixes;
  if (!hourprefixes) return null;
  const times = hourprefixes
    .map((prefix) => {
      if (!prefix.Prefix) {
        return null;
      }
      const match = prefix.Prefix.match(/(?<=gfs\.[0-9]{8}\/)[0-9]{2}(?=\/)/);
      if (!match) {
        return null;
      }
      return +match[0];
    })
    .filter((time) => time !== null) as number[];

  if (times.length === 0) return null;
  const latestHourPrefix = Math.max(...times)
    .toString()
    .padStart(2, '0');
  return {
    hourPrefix: `${prefix}/${latestHourPrefix}`,
    hour: latestHourPrefix,
  };
};

const getLatestPrefix = async (
  client: S3Client,
  forecastConfig: IForecastModel,
): Promise<ILatestPrefix | undefined> => {
  // try to get the latest forecastDay if not try one day before after 5 days return undefined
  for (let i = 0; i < 5; i++) {
    const prefix: string = getDatePrefix(i);
    const command = new ListObjectsCommand({
      Bucket: forecastConfig.bucket,
      Delimiter: '/',
      Prefix: prefix,
      MaxKeys: 1000,
    });
    const prefixes = (await client.send(command)).CommonPrefixes;
    //Check if hours are available for given day and if not loop and try the next day
    if (prefixes) {
      const hourPrefixForDate = await getHourPrefixForDate(
        client,
        forecastConfig,
        prefix,
      );
      if (hourPrefixForDate) {
        const datebeforePrefix = getDatePrefix(i - 1);
        const hourPrefixBefore = hourPrefixForDate.hourPrefix.replace(
          prefix,
          datebeforePrefix,
        );
        return {
          hourPrefix: hourPrefixForDate.hourPrefix,
          hour: hourPrefixForDate.hour,
          hourPrefixBefore,
        };
      }
    }
  }
  return undefined;
};

const getAWSForecastKeys = async (
  client: S3Client,
  forecastConfig: IForecastModel,
  prefix: string,
  hour: string,
): Promise<string[] | undefined> => {
  const filesnamePrefix = `gfs.t${hour}z.pgrb2.0p25.f`;
  const command = new ListObjectsCommand({
    Bucket: forecastConfig.bucket,
    Prefix: `${prefix}${filesnamePrefix}`,
    MaxKeys: 1000,
  });
  const files = await client.send(command);

  // check if files are available
  if (!files.Contents) return undefined;

  // filter out the index files and return the list of files
  const filesList = files.Contents.map((file) => file.Key).filter(
    (fileKey): fileKey is string =>
      fileKey !== undefined && !fileKey.includes('.idx'),
  );

  // check if all files are available
  if (filesList.length < 205) return undefined;
  return filesList;
};

const downloadFilesAWS = async (
  dbTimestamp: Date,
  forecastConfig: IForecastModel,
): Promise<boolean> => {
  const client = new S3Client({
    region: 'us-east-1',
    signer: {
      sign: async (request) => request,
    },
  });

  const latestPrefix: ILatestPrefix | undefined = await getLatestPrefix(
    client,
    forecastConfig,
  );

  if (!latestPrefix) return false;

  const { hourPrefix, hour, hourPrefixBefore } = latestPrefix;

  let forecastHour = hour;
  let endPrefix = `${hourPrefix}/atmos/`;
  let files: string[] | undefined = await getAWSForecastKeys(client, forecastConfig, endPrefix, hour);
  if (files === undefined) {
    if (hour != '00') {
      const newhour = (+hour - 6).toString().padStart(2, '0');
      const newPrefix = hourPrefix.replace(`/${hour}`, `/${newhour}`);
      endPrefix = `${newPrefix}/atmos/`;
      files = await getAWSForecastKeys(
        client,
        forecastConfig,
        endPrefix,
        newhour,
      );
      forecastHour = newhour;
    } else {
      const newhour = '18';
      const newPrefix = hourPrefixBefore.replace(`/${hour}`, `/${newhour}`);
      endPrefix = `${newPrefix}/atmos/`;
      files = await getAWSForecastKeys(
        client,
        forecastConfig,
        endPrefix,
        newhour,
      );
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
        filesBundle.map((file) => {
          const command = new GetObjectCommand({
            Bucket: forecastConfig.bucket,
            Key: file,
          });
          const filename = file.split('/').pop();
          return client.send(command).then((data) => {
            const body = data.Body?.toString() || ''; // Convert body to string
            return fs.promises.writeFile(
              `./grib_data_${forecastConfig.name}/${date}_${filename}.grb2`,
              body,
            );
          });
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
  return true;
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
