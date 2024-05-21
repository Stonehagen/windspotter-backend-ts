import mongoose from 'mongoose';
import moment from 'moment';
import { getSunrise, getSunset } from 'sunrise-sunset-js';
import { Types } from 'mongoose';
import {
  IForecast,
  IForecastHeader,
  IForecastInfo,
  ILastForecast,
  ISpot,
  ISpotForecast,
  ISpotForecastData,
  ISpotForecastModel,
  ISpotForecastModels,
} from '../interfaces/models';
import { Forecast, ForecastInfo, Spot } from '../models';

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

const compressSpotForecast = async (id: Types.ObjectId): Promise<boolean> => {
  const getWindDirection = (v: number, u: number): number => {
    return (270 - Math.atan2(v, u) * (180 / Math.PI)) % 360;
  };

  const getWindSpeed = (v: number, u: number): number => {
    return Math.sqrt(Math.pow(u, 2) + Math.pow(v, 2));
  };

  const getTemperature = (t: number): number => {
    return t - 273.15;
  };
  const getLastForecastDay = (forecast: Object): string => {
    if (!forecast) {
      return new Date(0).toISOString();
    }

    const lastDay = Object.keys(forecast)
      .sort((a, b) => new Date(a).getTime() - new Date(b).getTime())
      .pop();

    if (!lastDay) {
      return new Date(0).toISOString();
    }

    return lastDay;
  };

  const spot = await Spot.findById(id).populate({
    path: 'forecasts',
    populate: { path: 'forecastInfo', model: 'ForecastInfo' },
  });

  if (!spot) {
    return false;
  }

  // get the waveForecast cwam
  let waveForecast: IForecast | undefined = spot.forecasts.filter(
    (forecast) => forecast.forecastInfo.name === spot.waveForecast,
  )[0];

  // get the shortRangeWeather icon-d2
  let shortRangeWeather: IForecast | undefined = {
    ...spot.forecasts.filter(
      (forecast) => forecast.forecastInfo.name === spot.shortRangeForecast,
    ),
  }[0];

  // get the midRangeWeather: Icon-eu
  let midRangeWeather: IForecast | undefined = {
    ...spot.forecasts.filter(
      (forecast) => forecast.forecastInfo.name === spot.midRangeForecast,
    ),
  }[0];

  // get the longRangeWeather: gfsAWS
  let longRangeWeather: IForecast | undefined = {
    ...spot.forecasts.filter(
      (forecast) => forecast.forecastInfo.name === spot.longRangeForecast,
    ),
  }[0];

  if (
    !waveForecast &&
    !shortRangeWeather &&
    !midRangeWeather &&
    !longRangeWeather
  ) {
    return false;
  }

  if (!waveForecast) {
    waveForecast = new Forecast({
      mwd: {},
      swh: {},
      tm10: {},
      forecastInfo: new ForecastInfo({ time: new Date(0), name: '' }),
    });
  }

  if (!shortRangeWeather) {
    shortRangeWeather = new Forecast({
      t_2m: {},
      v_10m: {},
      u_10m: {},
      vmax_10m: {},
      clct_mod: {},
      rain_gsp: {},
      forecastInfo: new ForecastInfo({ time: new Date(0), name: '' }),
    });
  }

  if (!midRangeWeather) {
    midRangeWeather = new Forecast({
      t_2m: {},
      v_10m: {},
      u_10m: {},
      vmax_10m: {},
      clct_mod: {},
      rain_gsp: {},
      forecastInfo: new ForecastInfo({ time: new Date(0), name: '' }),
    });
  }

  if (!longRangeWeather) {
    longRangeWeather = new Forecast({
      t_2m: {},
      v_10m: {},
      u_10m: {},
      vmax_10m: {},
      clct_mod: {},
      rain_gsp: {},
      forecastInfo: new ForecastInfo({ time: new Date(0), name: '' }),
    });
  }

  const emptyForecastModel: ISpotForecastModel = {
    name: '',
    time: new Date(0),
    lastDay: new Date(0).toISOString(),
  };

  const spotForecast: ISpotForecast = {
    forecastModels: {
      wave: emptyForecastModel,
      shortRange: emptyForecastModel,
      midRange: emptyForecastModel,
      longRange: emptyForecastModel,
    },
    forecast: {
      mwd: waveForecast.mwd ? waveForecast.mwd : {},
      swh: waveForecast.swh ? waveForecast.swh : {},
      tm10: waveForecast.tm10 ? waveForecast.tm10 : {},
      t_2m: shortRangeWeather.t_2m ? shortRangeWeather.t_2m : {},
      v_10m: shortRangeWeather.v_10m ? shortRangeWeather.v_10m : {},
      u_10m: shortRangeWeather.u_10m ? shortRangeWeather.u_10m : {},
      vmax_10m: shortRangeWeather.vmax_10m ? shortRangeWeather.vmax_10m : {},
      clct_mod: shortRangeWeather.clct_mod ? shortRangeWeather.clct_mod : {},
      rain_gsp: shortRangeWeather.rain_gsp ? shortRangeWeather.rain_gsp : {},
    },
  };

  const midRangeForecast: ISpotForecastData = {
    mwd: {},
    swh: {},
    tm10: {},
    t_2m: midRangeWeather.t_2m ? midRangeWeather.t_2m : {},
    v_10m: midRangeWeather.v_10m ? midRangeWeather.v_10m : {},
    u_10m: midRangeWeather.u_10m ? midRangeWeather.u_10m : {},
    vmax_10m: midRangeWeather.vmax_10m ? midRangeWeather.vmax_10m : {},
    clct_mod: midRangeWeather.clct_mod ? midRangeWeather.clct_mod : {},
    rain_gsp: midRangeWeather.rain_gsp ? midRangeWeather.rain_gsp : {},
  };

  const longRangeForecast: ISpotForecastData = {
    mwd: {},
    swh: {},
    tm10: {},
    t_2m: longRangeWeather.tmp ? longRangeWeather.tmp : {},
    v_10m: longRangeWeather.vgrd ? longRangeWeather.vgrd : {},
    u_10m: longRangeWeather.ugrd ? longRangeWeather.ugrd : {},
    vmax_10m: longRangeWeather.gust ? longRangeWeather.gust : {},
    clct_mod: longRangeWeather.tcdc ? longRangeWeather.tcdc : {},
    rain_gsp: longRangeWeather.apcp ? longRangeWeather.apcp : {},
  };

  let lastShortRangeForecastDay: string = new Date(0).toISOString();
  let lastMidRangeForecastDay: string = new Date(0).toISOString();
  // go through the midRangeForecast
  // delete all days that are in the shortRangeForecast
  // combine the objects in short and midrange forecast
  for (const [key, value] of Object.entries(midRangeForecast)) {
    // get the end of the short forecast term
    lastShortRangeForecastDay = getLastForecastDay(
      shortRangeWeather[key as keyof IForecast],
    );
    for (const [date, data] of Object.entries(value)) {
      if (
        new Date(date).getTime() > new Date(lastShortRangeForecastDay).getTime()
      ) {
        spotForecast.forecast[key as keyof ISpotForecastData][date] =
          data as number;
      }
    }
  }

  // go through the longRangeForecast
  // delete all days that are in the midRangeForecast
  // combine the objects in mid and longrange forecast
  for (const [key, value] of Object.entries(longRangeForecast)) {
    // get the end of the mid forecast term
    lastMidRangeForecastDay = getLastForecastDay(
      midRangeWeather[key as keyof IForecast],
    );
    for (const [date, data] of Object.entries(value)) {
      if (
        new Date(date).getTime() > new Date(lastMidRangeForecastDay).getTime()
      ) {
        spotForecast.forecast[key as keyof ISpotForecastData][date] =
          data as number;
      }
    }
  }

  spotForecast.forecastModels = {
    wave: {
      name: waveForecast.forecastInfo.name,
      time: waveForecast.forecastInfo.time,
      lastDay: new Date(0).toISOString(),
    },
    shortRange: {
      name: shortRangeWeather.forecastInfo.name,
      time: shortRangeWeather.forecastInfo.time,
      lastDay: lastShortRangeForecastDay,
    },
    midRange: {
      name: midRangeWeather.forecastInfo.name,
      time: midRangeWeather.forecastInfo.time,
      lastDay: lastMidRangeForecastDay,
    },
    longRange: {
      name: longRangeWeather.forecastInfo.name,
      time: longRangeWeather.forecastInfo.time,
      lastDay: new Date(0).toISOString(),
    },
  };

  lastShortRangeForecastDay = new Date(
    spotForecast.forecastModels.shortRange.lastDay,
  ).toISOString();
  lastMidRangeForecastDay = new Date(
    spotForecast.forecastModels.midRange.lastDay,
  ).toISOString();

  const getForecastModel = (
    timestamp: Date,
    forecastModels: ISpotForecastModels,
  ) => {
    const time = new Date(timestamp);
    if (time.getTime() <= new Date(lastShortRangeForecastDay).getTime()) {
      return forecastModels.shortRange;
    } else if (
      time.getTime() > new Date(lastShortRangeForecastDay).getTime() &&
      time.getTime() <= new Date(lastMidRangeForecastDay).getTime()
    ) {
      return forecastModels.midRange;
    } else {
      return forecastModels.longRange;
    }
  };

  const newForecastArray = [];

  // get current date
  const today = new Date().setHours(0, 0, 0, 0);

  // sort forecast by date
  // v_10m: Wind at 10m above ground is leading value
  const sortedDates = Object.keys(spotForecast.forecast.v_10m).sort((a, b) => {
    return new Date(a).getTime() - new Date(b).getTime();
  });

  // get last day of forecast
  const lastTimestamp = new Date(sortedDates[sortedDates.length - 1]);
  const lastDay = +moment(lastTimestamp).format('DD');

  for (const time of sortedDates) {
    const forecastTimestamp = new Date(time);

    // only add forecast values for today and the future
    if (forecastTimestamp.getTime() >= today) {
      // if forecast value is not available, use last available value or 0
      const lastForecast: ILastForecast = newForecastArray[
        newForecastArray.length - 1
      ]
        ? newForecastArray[newForecastArray.length - 1]
        : {
            t: 0,
            dir: 0,
            ws: 0,
            wsMax: 0,
            clouds: 0,
            rain: 0,
            waveDir: 0,
            waveHeight: 0,
            wavePeriod: 0,
          };

      const forecastModel = getForecastModel(
        forecastTimestamp,
        spotForecast.forecastModels,
      );

      // add forecast values to array
      newForecastArray.push({
        time: forecastTimestamp,
        hour: +moment(forecastTimestamp).format('HH'),
        day: +moment(forecastTimestamp).format('DD'),
        model: forecastModel.name,
        modelTime: forecastModel.time,
        t: spotForecast.forecast.t_2m[time]
          ? getTemperature(spotForecast.forecast.t_2m[time])
          : lastForecast.t,
        dir: getWindDirection(
          spotForecast.forecast.v_10m[time],
          spotForecast.forecast.u_10m[time],
        ),
        ws: getWindSpeed(
          spotForecast.forecast.v_10m[time],
          spotForecast.forecast.u_10m[time],
        ),
        wsMax: spotForecast.forecast.vmax_10m[time]
          ? spotForecast.forecast.vmax_10m[time]
          : getWindSpeed(
              spotForecast.forecast.v_10m[time],
              spotForecast.forecast.u_10m[time],
            ),
        clouds: spotForecast.forecast.clct_mod[time]
          ? spotForecast.forecast.clct_mod[time]
          : 0,
        rain: spotForecast.forecast.rain_gsp[time]
          ? spotForecast.forecast.rain_gsp[time]
          : 0,
        waveDir: spotForecast.forecast.mwd[time]
          ? spotForecast.forecast.mwd[time]
          : 0,
        waveHeight: spotForecast.forecast.swh[time]
          ? spotForecast.forecast.swh[time]
          : 0,
        wavePeriod: spotForecast.forecast.tm10[time]
          ? spotForecast.forecast.tm10[time]
          : 0,
      });
    }
  }

  spot.forecast = newForecastArray;

  // check if spot sunrise and sunset are set and update them if not or if they are outdated
  const todayDate = new Date().setHours(0, 0, 0, 0);
  const updateTime = spot.updated ? spot.updated : new Date(0);
  if (
    !spot.sunrise ||
    !spot.sunset ||
    updateTime.getTime() < todayDate
  ) {
    const sunrise = getSunrise(
      spot.lat,
      spot.lon,
      new Date(todayDate),
    ).toISOString();
    const sunset = getSunset(
      spot.lat,
      spot.lon,
      new Date(todayDate),
    ).toISOString();
    spot.sunrise = new Date(sunrise);
    spot.sunset = new Date(sunset);
    spot.updated = new Date(todayDate);
  }
  
  await spot.save();
  return true;
};

export const compileSpotForecasts = async (): Promise<boolean> => {
  // get all spot ids
  const spotIds: Types.ObjectId[] = await Spot.find().select('_id');
  // compress all spot forecasts
  await Promise.all(spotIds.map((spotId) => compressSpotForecast(spotId)));
  return true;
};