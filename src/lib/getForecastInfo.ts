import { ForecastInfo } from '../models';
import { IForecastInfo } from '../interfaces/models';

export const getForecastInfo = async (
  forecastName: string,
): Promise<IForecastInfo | undefined > => {
  // try to find forecastInfo in database by name and throw error if not found
  try {
    const forecastInfo: IForecastInfo = await ForecastInfo.findOne({
      name: forecastName,
    }).orFail(
      new Error(`ForecastInfo not found for forecast name: ${forecastName}`),
    );
    return forecastInfo;
  } catch (error) {
    return undefined;
  }
};
