import mongoose from 'mongoose';
import {
  IForecast,
  IForecastHeader,
  IForecastInfo,
  ISpot,
} from '../interfaces/models';
import { Forecast } from '../models/forecast';

export const updateSpotForecast = async (
  spot: ISpot,
  forecastInfo: IForecastInfo,
  forecastHeader: IForecastHeader,
  dataValue: number,
) => {
  // add forecastTime in minutes to refTime to get timestamp of forecast
  const forecastTime = new Date(
    new Date(forecastHeader.refTime).getTime() +
      forecastHeader.forecastTime * 60000,
  );

  const twoDaysBefore = new Date(
    new Date().getTime() - 2 * 24 * 60 * 60 * 1000,
  );

  // check if a forecastData Document already exists
  const forecastData = spot.forecasts.find(
    (spotForecast) =>
      spotForecast.forecastInfo.toString() === forecastInfo._id.toString(),
  );

  // if not create new forecastData Document
  if (!forecastData) {
    const newForecastData: IForecast = new Forecast({
      _id: new mongoose.Types.ObjectId(),
      forecastInfo,
      time: forecastHeader.refTime,
      [forecastHeader.forecastType]: {
        [forecastTime.toUTCString()]: dataValue,
      },
    });
    spot.forecasts.push(newForecastData);
    await newForecastData.save();
  } else if (!forecastData[forecastHeader.forecastType as keyof IForecast]) {
    // if forecast exists but forecastType does not we create the forecastType
    forecastData[forecastHeader.forecastType as keyof IForecast] = {
      [forecastTime.toUTCString()]: dataValue,
    };
    await Forecast.updateOne(
      { _id: forecastData._id },
      {
        $set: {
          [forecastHeader.forecastType]:
            forecastData[forecastHeader.forecastType as keyof IForecast],
        },
      },
    );
  } else {
    // if forecast exists remove the data that is to not up to date anymore
    for (const key in forecastData[
      forecastHeader.forecastType as keyof IForecast
    ]) {
      const dateFromKey = new Date(key);
      if (dateFromKey.getTime() < twoDaysBefore.getTime()) {
        delete forecastData[forecastHeader.forecastType as keyof IForecast][
          key
        ];
      }
    }
    // update data
    forecastData.time = forecastHeader.refTime;
    forecastData[forecastHeader.forecastType as keyof IForecast][
      forecastTime.toUTCString()
    ] = dataValue;
    await Forecast.updateOne(
      { _id: forecastData._id },
      {
        $set: {
          time: forecastHeader.refTime,
          [forecastHeader.forecastType]:
            forecastData[forecastHeader.forecastType as keyof IForecast],
        },
      },
    );
  }
  await spot.populate({
    path: 'forecasts',
    match: { forecastInfo: forecastInfo._id.toString() },
  });
};
