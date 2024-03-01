import { getForecastConfig } from './getForecastConfig';
import { getForecastInfo } from './getForecastInfo';
import { prepareFolder } from './prepareFolder';
import { IForecastModel, IForecastInfo } from '../interfaces/models';
import { downloadFiles } from './downloadFiles';
import { getFiles, deleteFiles, sortFilesByValue } from './handleLocalFiles';
import { splitWgribToNetcdf, convertWgribToNetcdf } from './handleWgrib';

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
  const hasDownloaded = await downloadFiles(forecastDBTime, forecastConfig);
  if (!hasDownloaded) {
    console.log('could not download files from server');
    return false;
  }

  // get downloaded files and convert them to netcdf
  const gribFiles = await getFiles(`./grib_data_${forecastConfig.name}`);

  // check if the grib files need to be splitted
  if (forecastConfig.split) {
    const convertedWgrib2Netcdf = await splitWgribToNetcdf(
      gribFiles,
      forecastConfig,
    );
    if (!convertedWgrib2Netcdf) {
      console.log('could not convert wgrib to netcdf files split');
      return false;
    }
  } else {
    const convertedWgrib2Netcdf = await convertWgribToNetcdf(
      gribFiles,
      forecastConfig,
    );
    if (!convertedWgrib2Netcdf) {
      console.log('could not convert wgrib to netcdf files single');
      return false;
    }
  }

  const ncFiles = await getFiles(`./grib_data_${forecastConfig.name}`);
  const sortedNcFiles = forecastConfig.dataValues.map((value) =>
    sortFilesByValue(ncFiles, value, forecastConfig),
  );
  // await convertAllGfsToJSON(ncFiles, forecastConfig);

  // if (forecastConfigName === 'gfsAWS') {
  //   console.log('gfsAWS to json');
  //   await splitWGrib2ToNetcdf(files, forecastConfigName);
  //   const ncFiles = getFiles(`./grib_data_${forecastConfigName}`);
  //   await convertAllGfsToJSON(ncFiles, forecastConfigName);
  // } else {
  //   const sortedFiles = dataValues.map((value) =>
  //     sortFilesByValue(files, value, forecastConfigName),
  //   );
  //   if (wgrib2) {
  //     console.log('wgrib2');
  //     await convertAllWGrib2(sortedFiles, forecastConfigName);
  //     const ncFiles = getFiles(`./grib_data_${forecastConfigName}`);
  //     const sortedNcFiles = dataValues.map((value) =>
  //       sortFilesByValue(ncFiles, value, forecastConfigName),
  //     );
  //     await convertAllNetCDFToJSON(sortedNcFiles, forecastConfigName);
  //   } else {
  //     console.log('grib to json');
  //     await convertAllGribToJSON(sortedFiles, forecastConfigName, forecastMap);
  //   }
  // }

  const deletedFiles = deleteFiles(`./grib_data_${forecastName}`);
  if (!deletedFiles) {
    console.log('could not delete files');
    return false;
  }

  console.log('stiching Forecasts');
  // await compileSpotForecasts();
  console.log('stiched Forecasts');
  console.log('Database is up to date');
  return true;
};
