import { model, Schema } from 'mongoose';

interface ForecastInfoDocument {
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

const ForecastInfoSchema = new Schema<ForecastInfoDocument>({
  name: { type: String, required: true, maxLength: 100 },
  time: { type: Date, required: true },
  lo1: { type: Number, required: true },
  lo2: { type: Number, required: true },
  la1: { type: Number, required: true },
  la2: { type: Number, required: true },
  dy: { type: Number, required: true },
  dx: { type: Number, required: true },
  nx: { type: Number, required: true },
  ny: { type: Number, required: true },
});

export const ForecastInfo = model('ForecastInfo', ForecastInfoSchema);
