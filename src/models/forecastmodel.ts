import { model, Schema } from 'mongoose';
import { IForecastModel } from '../interfaces/models';

const ForecastModelSchema = new Schema<IForecastModel>({
  name: { type: String, required: true },
  dataValues: { type: [String], required: true },
  serverDataTimeDelay: { type: Number, required: true },
  server: { type: String, required: false },
  dict: { type: String, required: false },
  bucket: { type: String, required: false },
  fcModel: { type: String, required: false },
  fcHeight: { type: String, required: false },
  split: { type: Boolean, required: true, default: false },
  regexRefTimeValue: { type: String, required: false },
  regexRefTimeDateNc: { type: String, required: false },
  regexRefTimeHoursNc: { type: String, required: false },
  regexRefTimeMinutesNc: { type: String, required: false },
  regexNameValue: { type: String, required: false },
  regexTimeValue: { type: String, required: false },
});

export const ForecastModel = model('ForecastModel', ForecastModelSchema);
