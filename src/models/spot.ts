import { model, Schema } from 'mongoose';
import { ISpot } from '../interfaces/models';

const SpotSchema = new Schema<ISpot>({
  name: { type: String, required: true, maxLength: 100 },
  searchName: { type: String, required: true, maxLength: 100 },
  updated: {
    type: Date,
    required: true,
    default: new Date('2020-01-01T00:00:00Z'),
  },
  sunrise: {
    type: Date,
    required: true,
    default: new Date('2020-01-01T07:00:00Z'),
  },
  sunset: {
    type: Date,
    required: true,
    default: new Date('2020-01-01T21:00:00Z'),
  },
  lat: { type: Number, required: true },
  lon: { type: Number, required: true },
  forecasts: [{ type: Schema.Types.ObjectId, ref: 'Forecast' }],
  windDirections: [{ type: Boolean }],
  forecast: [{ type: Object }],
  lightForecast: [{ type: Object }],
  waveForecast: { type: String, default: '' },
  shortRangeForecast: { type: String, default: '' },
  midRangeForecast: { type: String, default: '' },
  longRangeForecast: { type: String, default: 'gfsAWS' },
});

export const Spot = model('Spot', SpotSchema);
