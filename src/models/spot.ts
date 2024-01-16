import { model, Schema } from 'mongoose';
import { SpotDocument } from '../interfaces/models';

const SpotSchema = new Schema<SpotDocument>({
  name: { type: String, required: true, maxLength: 100 },
  searchName: { type: String, required: true, maxLength: 100 },
  lat: { type: Number, required: true },
  lon: { type: Number, required: true },
  forecasts: [{ type: Schema.Types.ObjectId, ref: 'Forecast' }],
  windDirections: [{ type: Boolean }],
  forecast: [{ type: Object }],
});

export const Spot = model('Spot', SpotSchema);
