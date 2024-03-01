import shell from 'shelljs';
import fs from 'fs';
import 'dotenv/config';
import { IForecastModel } from '../interfaces/models';

const wgrib2 = process.env.WGRIB2_PATH;

export const convertWgribToNetcdf = async (
  filenames: string[],
  forecastConfig: IForecastModel,
): Promise<boolean> => {
  try {
    for (const filename of filenames) {
      for (const value of forecastConfig.dataValues) {
        const pathGribFile = `./grib_data_${forecastConfig.name}/${filename}`;
        const pathNetcdfFile = pathGribFile.replace(
          '.grb2',
          `_${value.split(':')[1]}.nc`,
        );
        if (
          (await shell.exec(
            `${wgrib2} ${pathGribFile} -match '${value}' -netcdf ${pathNetcdfFile}`,
          ).code) !== 0
        ) {
          shell.echo('Error: wgrib2 failed');
          shell.exit(1);
        }
      }
      await fs.unlinkSync(`./grib_data_${forecastConfig.name}/${filename}`);
    }
  } catch (err) {
    console.log(err);
    return false;
  }
  return true;
};