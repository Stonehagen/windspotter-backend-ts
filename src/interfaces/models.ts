import { Schema, Types } from 'mongoose';

export interface IForecast {
  forecastInfo: Types.ObjectId;
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

export interface IForecastInfo {
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

export interface IForecastModel {
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

export interface IMapForecast {
  forecastInfo: Schema.Types.ObjectId;
  forecastMaps: Object;
}

export interface ISpot {
  name: string;
  searchName: string;
  lat: number;
  lon: number;
  forecasts: Types.ObjectId[];
  windDirections: boolean[];
  forecast: Object[];
}

export interface ILatestPrefix { 
  hourPrefix: string, 
  hour: string, 
  hourPrefixBefore: string, 
}