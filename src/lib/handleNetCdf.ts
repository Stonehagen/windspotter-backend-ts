import mongoose from 'mongoose';
import {
  IForecastInfo,
  IForecastModel,
  ISpot,
  IForecast,
  IDataValues,
  IForecastHeader,
} from '../interfaces/models';
import { getForecastInfo } from './getForecastInfo';
import { Spot } from '../models/spot';
import { Forecast } from '../models/forecast';
import { getForecastHeader } from './handleHeaders';
import { readFileSync } from 'fs';
import { NetCDFReader } from 'netcdfjs';
import { calculateDataValue } from './calculateValues';
import { updateSpotForecast } from './updateDatabase';

export const convertNetCdf = async (
  filesList: string[][],
  forecastConfig: IForecastModel,
): Promise<boolean> => {
  const forecastInfo: IForecastInfo | undefined = await getForecastInfo(
    forecastConfig.name,
  );
  if (!forecastInfo) {
    return false;
  }
  const addedEmptyForecast: boolean = await addEmptyForecastToSpotsNetCDF(
    forecastInfo,
  );
  if (!addedEmptyForecast) {
    console.log('something went wrong with adding empty forecast to spots');
    return false;
  }

  const convertPromises: Promise<boolean>[] = filesList.map((files) =>
    saveNetCdfToDB(files, forecastInfo, forecastConfig),
  );
  const savedToDB = await Promise.all(convertPromises);
  if (savedToDB.includes(false)) {
    // TODO: add better error handling and logging
    console.log('some spots could not be updated');
  }
  return true;
};

const populateSpots = async (
  filename: string,
  spots: ISpot[],
  forecastInfo: IForecastInfo,
  forecastConfig: IForecastModel,
  lastValues: IDataValues,
): Promise<IDataValues> => {
  const forecastHeader: IForecastHeader = getForecastHeader(
    filename,
    forecastInfo,
    forecastConfig,
  );
  const ncData: Buffer = readFileSync(
    `./grib_data_${forecastConfig.name}/${filename}`,
  );
  const reader = new NetCDFReader(ncData);
  const variableName = reader.header.variables[3].name;
  const valueArray = reader.getDataVariable(variableName)[0] as number[];

  // Calculate data values for all spots in parallel
  const dataValuePromises = spots.map((spot) => {
    return calculateDataValue(spot, forecastHeader, valueArray);
  });

  // Wait for all dataValue promises to resolve
  const dataValues = await Promise.all(dataValuePromises);

  // convert accumulated rain to rain per hour
  // If the forecastHeader.forecastType is 'apcp'
  // and the lastValues array is not empty, calculate the difference
  // between the current and the last forecast and divide it by the
  // difference between the current and the last forecast time

  let rawDataValues: IDataValues | null = null;
  if (
    forecastHeader.forecastType === 'apcp' ||
    forecastHeader.forecastType === 'rain_gsp'
  ) {
    rawDataValues = {
      dataValues: [...dataValues],
      forecastTime: forecastHeader.forecastTime,
    };
    if (lastValues.dataValues.length > 0) {
      for (const [index, value] of dataValues.entries()) {
        if (value !== null && value !== 0) {
          const newValue =
            (value - lastValues.dataValues[index]) /
            ((forecastHeader.forecastTime - lastValues.forecastTime) / 60);
          dataValues[index] = newValue >= 0 ? newValue : 0;
        }
      }
    }
  }

  // Update spot forecasts with calculated data values
  for (const [index, spot] of spots.entries()) {
    if (dataValues[index] !== null) {
      await updateSpotForecast(
        spot,
        forecastInfo,
        forecastHeader,
        dataValues[index],
      );
    }
  }
  return rawDataValues ? rawDataValues : lastValues;
};

const addEmptyForecastToSpotsNetCDF = async (
  forecastInfo: IForecastInfo,
): Promise<boolean> => {
  const spots: ISpot[] = await Spot.find({}).populate('forecasts').exec();
  if (!spots || spots.length === 0) {
    console.log('no spots found');
    return false;
  }

  try {
    for (const spot of spots) {
      // check if forecast already exists
      const forecastFound: IForecast | undefined = spot.forecasts.find(
        (spotForecast) =>
          spotForecast.forecastInfo._id.toString() ===
          forecastInfo._id.toString(),
      );

      // if not create new forecast
      if (!forecastFound) {
        const forecastData: IForecast = new Forecast({
          _id: new mongoose.Types.ObjectId(),
          forecastInfo,
          time: forecastInfo.time,
        });
        spot.forecasts.push(forecastData);

        await forecastData.save();
      }
    }
    for (const spot of spots) {
      await spot.save();
    }
  } catch (err) {
    console.log(err);
    return false;
  }
  return true;
};

const saveNetCdfToDB = async (
  filenames: string[],
  forecastInfo: IForecastInfo,
  forecastConfig: IForecastModel,
) => {
  const spots: ISpot[] = await Spot.find({}).populate('forecasts').exec();
  if (!spots) {
    console.log('no spots found');
    return false;
  }
  try {
    let lastValues: IDataValues = {
      dataValues: [],
      forecastTime: 0,
    };
    for (const filename of filenames) {
      lastValues = await populateSpots(
        filename,
        spots,
        forecastInfo,
        forecastConfig,
        lastValues,
      );
    }
    for (const spot of spots) {
      await spot.save();
    }
  } catch (err) {
    console.log(err);
    return false;
  }
  return true;
};
