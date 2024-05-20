import {
  IForecastHeader,
  IForecastInfo,
  IForecastModel,
} from '../interfaces/models';

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
  const forecastDate = filename.match(forecastConfig.regexRefTimeDateNc);
  if (!forecastDate) {
    throw new Error('No match for forecast date in filename');
  }
  const forecastHour = filename.match(forecastConfig.regexRefTimeHoursNc);
  if (!forecastHour) {
    throw new Error('No match for forecast hour in filename');
  }
  const forecastRefTime = new Date(
    `${forecastDate[0].substring(0, 4)}-${forecastDate[0].substring(
      4,
      6,
    )}-${forecastDate[0].substring(6, 8)}T${forecastHour[0]}:00:00Z`,
  );

  const forecastType: string = forecastTypeMatch[0].toLowerCase();

  const forecastHeader: IForecastHeader = {
    forecastName: forecastConfig.name,
    forecastType,
    refTime: forecastRefTime,
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
