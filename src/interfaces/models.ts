import { Schema, Types } from 'mongoose';

export interface ForecastDocument {
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

export interface ForecastInfoDocument {
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

export interface ForecastModelDocument {
  name: string;
  dataValues: string[];
  serverDataTimeDelay: number;
  server: string;
  dict: string;
  bucket: string;
  fcModel: string;
  fcHeight: string;
  regexRefTimeValue: RegExp;
  regexRefTimeDateNc: RegExp;
  regexRefTimeHoursNc: RegExp;
  regexRefTimeMinutesNc: RegExp;
  regexNameValue: RegExp;
  regexTimeValue: RegExp;
}

export interface MapForecastDocument {
  forecastInfo: Schema.Types.ObjectId;
  forecastMaps: Object;
}

export interface SpotDocument {
  name: string;
  searchName: string;
  lat: number;
  lon: number;
  forecasts: Types.ObjectId[];
  windDirections: boolean[];
  forecast: Object[];
}