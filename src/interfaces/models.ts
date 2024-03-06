import { Schema, Document } from 'mongoose';

export interface IForecastInfo extends Document {
  _id: Schema.Types.ObjectId;
  name: string;
  time: Date;
  lo1: number;
  lo2: number;
  la1: number;
  la2: number;
  dy: number;
  dx: number;
  nx: number;
  ny: number;
}

interface IDataValue {
  [id: string]: number;
}

export interface IForecast extends Document {
  _id: Schema.Types.ObjectId;
  forecastInfo: IForecastInfo;
  time: Date;
  t_2m: IDataValue;
  v_10m: IDataValue;
  u_10m: IDataValue;
  vmax_10m: IDataValue;
  clct_mod: IDataValue;
  rain_gsp: IDataValue;
  mwd: IDataValue;
  swh: IDataValue;
  tm10: IDataValue;
  tmp: IDataValue;
  vgrd: IDataValue;
  ugrd: IDataValue;
  gust: IDataValue;
  tcdc: IDataValue;
  pres: IDataValue;
  pers: IDataValue;
  apcp: IDataValue;
}

export interface IForecastModel extends Document {
  _id: Schema.Types.ObjectId;
  name: string;
  dataValues: string[];
  serverDataTimeDelay: number;
  server: string;
  dict: string;
  bucket: string;
  fcModel: string;
  fcHeight: string;
  split: boolean;
  regexRefTimeValue: RegExp;
  regexRefTimeDateNc: RegExp;
  regexRefTimeHoursNc: RegExp;
  regexRefTimeMinutesNc: RegExp;
  regexNameValue: RegExp;
  regexTimeValue: RegExp;
}

export interface IMapForecast extends Document {
  _id: Schema.Types.ObjectId;
  forecastInfo: IForecastInfo;
  forecastMaps: Object;
}

export interface ISpot extends Document {
  _id: Schema.Types.ObjectId;
  name: string;
  searchName: string;
  lat: number;
  lon: number;
  forecasts: IForecast[];
  windDirections: boolean[];
  forecast: Object[];
  waveForecast: string;
  shortRangeForecast: string;
  midRangeForecast: string;
  longRangeForecast: string;
}

export interface ILatestPrefix {
  hourPrefix: string;
  hour: string;
  hourPrefixBefore: string;
}

export interface IDataValues {
  dataValues: number[];
  forecastTime: number;
}

export interface IForecastHeader {
  forecastName: string;
  forecastType: string;
  refTime: Date;
  forecastTime: number;
  lo1: number;
  lo2: number;
  la1: number;
  la2: number;
  dx: number;
  dy: number;
  nx: number | null;
  ny: number | null;
}

export interface ISpotPos {
  lon: number;
  lat: number;
}

export interface ISpotForecastData {
  mwd: IDataValue;
  swh: IDataValue;
  tm10: IDataValue;
  t_2m: IDataValue;
  v_10m: IDataValue;
  u_10m: IDataValue;
  vmax_10m: IDataValue;
  clct_mod: IDataValue;
  rain_gsp: IDataValue;
}

export interface ISpotForecast {
  forecastModels: ISpotForecastModels;
  forecast: ISpotForecastData;
}

export interface ISpotForecastModels {
  wave: ISpotForecastModel;
  shortRange: ISpotForecastModel;
  midRange: ISpotForecastModel;
  longRange: ISpotForecastModel;
}

export interface ISpotForecastModel {
  name: string;
  time: Date;
  lastDay: string;
}

export interface ILastForecast {
  t: number;
  dir: number;
  ws: number;
  wsMax: number;
  clouds: number;
  rain: number;
  waveDir: number;
  waveHeight: number;
  wavePeriod: number;
}