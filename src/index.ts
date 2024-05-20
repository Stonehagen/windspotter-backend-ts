import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config({ path: __dirname + '/../.env' });
import { updateForecasts } from './lib/updateForecasts';

const forecastName: string = process.argv[2] || '';
console.log(forecastName);
if (!forecastName) {
  console.log('No forecast model specified.');
  process.exit(1);
}

const test = process.argv[3] === 'test';

const mongoDB: string = process.env.MONGODB_URI || '';
if (!mongoDB) {
  console.log(
    'No mongoDB connection string. Set MONGODB_URI environment variable.',
  );
  process.exit(1);
}

mongoose.connect(mongoDB);
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));

updateForecasts(forecastName, test)
  .then((res) => {
    if (res) {
      console.log('forecasts updated');
    } else {
      console.log('forecasts not updated');
    }
  })
  .finally(() => {
    db.close();
  });
