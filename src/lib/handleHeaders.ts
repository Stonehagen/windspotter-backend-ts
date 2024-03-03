import { IForecastHeader, IForecastInfo, IForecastModel } from '../interfaces/models';

const getForecastTime = (
  filename: string,
  forecastConfig: IForecastModel,
): number => {
  const minutesMatch = filename.match(forecastConfig.regexRefTimeMinutesNc);
  if (!minutesMatch) {
    throw new Error('No match for minutes in filename');
  }
  return +minutesMatch[0] * 60;
};

export const getForecastHeader = (
  filename: string,
  forecastInfo: IForecastInfo,
  forecastConfig: IForecastModel,
) => {
  const forecastTime: number = getForecastTime(filename, forecastConfig);

  const forecastTypeMatch = filename.match(forecastConfig.regexNameValue);
  if (!forecastTypeMatch) {
    throw new Error('No match for forecast type in filename');
  }
  const forecastType: string = forecastTypeMatch[0].toLowerCase();

  const forecastHeader: IForecastHeader = {
    forecastName: forecastConfig.name,
    forecastType,
    refTime: forecastInfo.time,
    forecastTime,
    lo1: forecastInfo.lo1,
    lo2: forecastInfo.lo2,
    la1: forecastInfo.la1,
    la2: forecastInfo.la2,
    dx: forecastInfo.dx,
    dy: forecastInfo.dy,
    nx: null,
    ny: null,
  };

  return forecastHeader;
};
