import { getForecastConfig } from './getForecastConfig';
import { getForecastInfo } from './getForecastInfo';
import { prepareFolder } from './prepareFolder';
import { IForecastModel, IForecastInfo } from '../interfaces/models';
import { downloadFiles } from './downloadFiles';
import { getFiles, deleteFiles, sortFilesByValue } from './handleLocalFiles';
import { splitWgribToNetcdf, convertWgribToNetcdf } from './handleWgrib';
import { convertNetCdf } from './handleNetCdf';
import { compileSpotForecasts } from './updateDatabase';

export const updateForecasts = async (forecastName: string) => {
  // get forecast config from database
  const forecastConfig: IForecastModel | undefined = await getForecastConfig(
    forecastName,
  );
  if (!forecastConfig) {
    console.log(`no forecast config with the name ${forecastName} was found`);
    return false;
  }

  //prepare folder for new files
  await prepareFolder(`./grib_data_${forecastName}`);

  // get forecast info from database if it exists
  const forecastInfo: IForecastInfo | undefined = await getForecastInfo(
    forecastName,
  );
  // get time the forecast was updated or set it to 0 if it does not exist
  const forecastDBTime: Date = forecastInfo ? forecastInfo.time : new Date(0);

  // download files
  const hasDownloaded: boolean = await downloadFiles(
    forecastDBTime,
    forecastConfig,
  );
  if (!hasDownloaded) {
    console.log('could not download files from server');
    return false;
  }

  // get downloaded files and convert them to netcdf
  const gribFiles: string[] = await getFiles(
    `./grib_data_${forecastConfig.name}`,
  );

  // check if the grib files need to be splitted
  if (forecastConfig.split) {
    const convertedWgrib2Netcdf: boolean = await splitWgribToNetcdf(
      gribFiles,
      forecastConfig,
    );
    if (!convertedWgrib2Netcdf) {
      console.log('could not convert wgrib to netcdf files split');
      return false;
    }
  } else {
    const convertedWgrib2Netcdf: boolean = await convertWgribToNetcdf(
      gribFiles,
      forecastConfig,
    );
    if (!convertedWgrib2Netcdf) {
      console.log('could not convert wgrib to netcdf files single');
      return false;
    }
  }

  const ncFiles: string[] = await getFiles(
    `./grib_data_${forecastConfig.name}`,
  );
  if (!ncFiles || ncFiles.length === 0) {
    console.log('could not get netcdf files');
    return false;
  }
  const sortedNcFiles: string[][] = forecastConfig.dataValues.map((value) =>
    sortFilesByValue(ncFiles, value, forecastConfig),
  );
  if (!sortedNcFiles || sortedNcFiles.length === 0) {
    console.log('could not sort netcdf files');
    return false;
  }

  const convertedNetCdf = await convertNetCdf(
    sortedNcFiles,
    forecastConfig,
  );
  if (!convertedNetCdf) {
    console.log('could not convert netcdf files');
    return false;
  }

  const deletedFiles = deleteFiles(`./grib_data_${forecastName}`);
  if (!deletedFiles) {
    console.log('could not delete files');
    return false;
  }

  const stichedForecast = await compileSpotForecasts();
  if (!stichedForecast) {
    console.log('could not stich forecasts');
    return false;
  }
  return true;
};
