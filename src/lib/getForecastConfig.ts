import { ForecastModel } from '../models';
import { IForecastModel } from '../interfaces/models';

export const getForecastConfig = async (
  forecastName: string,
): Promise<IForecastModel | boolean> => {
  // try to find forecast config in database by name and throw error if not found
  try {
    const forecastConfig: IForecastModel = await ForecastModel.findOne({
      name: forecastName,
    }).orFail(
      new Error(`Forecast config not found for forecast name: ${forecastName}`),
    );
    return forecastConfig;
  } catch (error) {
    return false;
  }
};
