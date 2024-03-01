import { Schema, Types, Document } from 'mongoose';

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

export interface IForecast extends Document {
  _id: Schema.Types.ObjectId;
  forecastInfo: IForecastInfo;
  time: Date;
  t_2m: Object;
  v_10m: Object;
  u_10m: Object;
  vmax_10m: Object;
  clct_mod: Object;
  rain_gsp: Object;
  mwd: Object;
  swh: Object;
  tm10: Object;
  tmp: Object;
  vgrd: Object;
  ugrd: Object;
  gust: Object;
  tcdc: Object;
  pres: Object;
  pers: Object;
  apcp: Object;
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
}

export interface ILatestPrefix { 
  hourPrefix: string, 
  hour: string, 
  hourPrefixBefore: string, 
}