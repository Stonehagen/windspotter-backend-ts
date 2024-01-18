import { model, Schema } from 'mongoose';
import { IForecast } from '../interfaces/models';

const ForecastSchema = new Schema<IForecast>({
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
