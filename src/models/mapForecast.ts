import { model, Schema } from 'mongoose';
import { IMapForecast } from '../interfaces/models';

const MapForecastSchema = new Schema<IMapForecast>({
  forecastInfo: { type: Schema.Types.ObjectId, ref: 'Forecast' },
  forecastMaps: { type: Object },
});

export const MapForecast = model('MapForecast', MapForecastSchema);
