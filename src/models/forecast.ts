import { model, Schema, Types } from 'mongoose';

interface ForecastDocument {
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

const ForecastSchema = new Schema<ForecastDocument>({
  forecastInfo: { type: Schema.Types.ObjectId, ref: 'Forecast' },
  time: { type: Date, required: true },
  t_2m: { type: Object },
  v_10m: { type: Object },
  u_10m: { type: Object },
  vmax_10m: { type: Object },
  clct_mod: { type: Object },
  rain_gsp: { type: Object },
  mwd: { type: Object },
  swh: { type: Object },
  tm10: { type: Object },
  tmp: { type: Object },
  vgrd: { type: Object },
  ugrd: { type: Object },
  gust: { type: Object },
  tcdc: { type: Object },
  pres: { type: Object },
  pers: { type: Object },
  apcp: { type: Object },
});

export const Forecast = model('Forecast', ForecastSchema);
