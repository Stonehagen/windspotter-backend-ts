import {
  S3Client,
  GetObjectCommand,
  ListObjectsCommand,
} from '@aws-sdk/client-s3';
import { IForecastModel, ILatestPrefix } from '../interfaces/models';

const client = new S3Client({
  region: 'us-east-1',
  signer: {
    sign: async (request) => request,
  },
});

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

export const getLatestPrefix = async (
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
        forecastConfig,
        prefix,
      );
      if (hourPrefixForDate) {
        const datebeforePrefix = getDatePrefix(i + 1);
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

export const getKeysFromPrefix = async (
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

export const getBody = async (
  bucket: string,
  file: string,
): Promise<Buffer> => {
  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: file,
  });
  const data = await client.send(command);
  // Convert body to string
  const body = data.Body as unknown as Buffer;

  return body;
};
