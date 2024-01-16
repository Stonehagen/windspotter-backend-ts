import { model, Schema } from 'mongoose';

interface MapForecastDocument {
  forecastInfo: Schema.Types.ObjectId;
  forecastMaps: Object;
}

const MapForecastSchema = new Schema<MapForecastDocument>({
  forecastInfo: { type: Schema.Types.ObjectId, ref: 'Forecast' },
  forecastMaps: { type: Object },
});

export const MapForecast = model('MapForecast', MapForecastSchema);
