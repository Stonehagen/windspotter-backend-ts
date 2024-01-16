import { model, Schema } from 'mongoose';
import { MapForecastDocument } from '../interfaces/models';

const MapForecastSchema = new Schema<MapForecastDocument>({
  forecastInfo: { type: Schema.Types.ObjectId, ref: 'Forecast' },
  forecastMaps: { type: Object },
});

export const MapForecast = model('MapForecast', MapForecastSchema);
