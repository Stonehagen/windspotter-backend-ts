import { IForecastHeader, ISpot, ISpotPos } from '../interfaces/models';

const getAbsoluteLon = (lonStart: number, lonEnd: number): number => {
  return lonStart > lonEnd ? lonEnd + 360 : lonEnd;
};

const isBetween = (x: number, min: number, max: number): boolean => {
  return x >= min && x <= max;
};

const inGrid = (spot: ISpot, forecastHeader: IForecastHeader): boolean => {
  const lo2 = getAbsoluteLon(forecastHeader.lo1, forecastHeader.lo2);
  const spotLon = getAbsoluteLon(forecastHeader.lo1, spot.lon);

  return (
    isBetween(spot.lat, forecastHeader.la1, forecastHeader.la2) &&
    isBetween(spotLon, forecastHeader.lo1, lo2)
  );
};

const getMinPoint = (point: number, delta: number): number => {
  return point % delta === 0 ? point : point - (point % delta);
};

const getMaxPoint = (point: number, delta: number): number => {
  return point % delta === 0 ? point : point - (point % delta) + delta;
};

const getGribIndex = (
  forecastHeader: IForecastHeader,
  spotPos: ISpotPos,
): number => {
  // check if end value for longitute is lower than start value
  const lo2 = getAbsoluteLon(forecastHeader.lo1, forecastHeader.lo2);
  const spotLon = getAbsoluteLon(forecastHeader.lo1, spotPos.lon);

  const latRow = Math.round(
    (spotPos.lat - forecastHeader.la1) / forecastHeader.dy,
  );
  const latWidth = Math.round(
    (lo2 - forecastHeader.lo1) / forecastHeader.dx + 1,
  );
  const lonPos = Math.round((spotLon - forecastHeader.lo1) / forecastHeader.dx);

  return Math.round(latRow * latWidth + lonPos);
};

export const calculateDataValue = (
  spot: ISpot,
  forecastHeader: IForecastHeader,
  forecastData: number[],
): number | null => {
  if (!inGrid(spot, forecastHeader)) {
    return null;
  }
  // bilinear interpolation for 4 points around spot position
  // https://en.wikipedia.org/wiki/Bilinear_interpolation
  const x = getAbsoluteLon(forecastHeader.lo1, spot.lon);
  const y = spot.lat;
  const x1 = getMinPoint(x, forecastHeader.dx);
  const x2 = getMaxPoint(x, forecastHeader.dx);
  const y1 = getMinPoint(y, forecastHeader.dy);
  const y2 = getMaxPoint(y, forecastHeader.dy);
  let Q11 = forecastData[getGribIndex(forecastHeader, { lon: x1, lat: y1 })];
  let Q21 = forecastData[getGribIndex(forecastHeader, { lon: x2, lat: y1 })];
  let Q22 = forecastData[getGribIndex(forecastHeader, { lon: x2, lat: y2 })];
  let Q12 = forecastData[getGribIndex(forecastHeader, { lon: x1, lat: y2 })];

  Q11 = Q11 > 9999999 ? 0 : Q11;
  Q21 = Q21 > 9999999 ? 0 : Q21;
  Q22 = Q22 > 9999999 ? 0 : Q22;
  Q12 = Q12 > 9999999 ? 0 : Q12;

  // If there are points with no measurements, return the maximum value of the other points
  const pointArray = [Q11, Q21, Q22, Q12].filter((point) => point > 0);
  if (pointArray.length > 0 && pointArray.length < 4) {
    const min = Math.max(...pointArray);
    return min;
  }

  const R1 = ((x2 - x) / (x2 - x1)) * Q11 + ((x - x1) / (x2 - x1)) * Q21;
  const R2 = ((x2 - x) / (x2 - x1)) * Q12 + ((x - x1) / (x2 - x1)) * Q22;

  const P = ((y2 - y) / (y2 - y1)) * R1 + ((y - y1) / (y2 - y1)) * R2;
  return P;
};
