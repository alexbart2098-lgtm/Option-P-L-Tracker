
import { CandlestickData, BollingerBandsSettings, StochasticRsiSettings, BollingerBandsDataPoint, StochasticRsiDataPoint } from '../types';
import { Time } from 'lightweight-charts';

// Helper for Simple Moving Average
const sma = (data: number[], period: number): (number | undefined)[] => {
  const result: (number | undefined)[] = [];
  if (data.length < period) return result;
  
  let sum = data.slice(0, period).reduce((a, b) => a + b, 0);
  result[period - 1] = sum / period;

  for (let i = period; i < data.length; i++) {
    sum += data[i] - data[i - period];
    result.push(sum / period);
  }
  return result;
};

export const calculateBollingerBands = (
  data: CandlestickData[],
  settings: BollingerBandsSettings
): BollingerBandsDataPoint[] => {
  const { period, stdDev } = settings;
  if (data.length < period) return [];

  const closePrices = data.map(d => d.close);
  const middleBand = sma(closePrices, period);
  
  const result: BollingerBandsDataPoint[] = [];

  for (let i = period - 1; i < data.length; i++) {
    const smaValue = middleBand[i];
    if (smaValue === undefined) continue;

    const slice = closePrices.slice(i - period + 1, i + 1);
    const mean = smaValue;
    const variance = slice.reduce((acc, price) => acc + Math.pow(price - mean, 2), 0) / period;
    const standardDeviation = Math.sqrt(variance);

    result.push({
      time: data[i].time as Time,
      middle: smaValue,
      upper: smaValue + standardDeviation * stdDev,
      lower: smaValue - standardDeviation * stdDev,
    });
  }

  return result;
};


// Helper for RSI calculation
const calculateRSI = (closePrices: number[], period: number): (number | undefined)[] => {
    const rsi: (number | undefined)[] = new Array(closePrices.length).fill(undefined);
    if (closePrices.length < period + 1) return rsi;

    let avgGain = 0;
    let avgLoss = 0;

    // Calculate initial average gain and loss
    for (let i = 1; i <= period; i++) {
        const change = closePrices[i] - closePrices[i - 1];
        if (change > 0) {
            avgGain += change;
        } else {
            avgLoss -= change;
        }
    }
    avgGain /= period;
    avgLoss /= period;

    let rs = avgLoss === 0 ? Infinity : avgGain / avgLoss;
    rsi[period] = 100 - (100 / (1 + rs));

    // Calculate subsequent RSI values using smoothing
    for (let i = period + 1; i < closePrices.length; i++) {
        const change = closePrices[i] - closePrices[i - 1];
        let gain = 0;
        let loss = 0;
        if (change > 0) {
            gain = change;
        } else {
            loss = -change;
        }

        avgGain = (avgGain * (period - 1) + gain) / period;
        avgLoss = (avgLoss * (period - 1) + loss) / period;

        rs = avgLoss === 0 ? Infinity : avgGain / avgLoss;
        rsi[i] = 100 - (100 / (1 + rs));
    }
    return rsi;
};


export const calculateStochasticRSI = (
  data: CandlestickData[],
  settings: StochasticRsiSettings
): StochasticRsiDataPoint[] => {
    const { rsiPeriod, stochasticPeriod, kPeriod, dPeriod } = settings;
    const closePrices = data.map(d => d.close);

    const rsiValuesWithGaps = calculateRSI(closePrices, rsiPeriod);
    const firstRsiIndex = rsiValuesWithGaps.findIndex(v => v !== undefined);
    if (firstRsiIndex === -1) return [];

    const rsiValues = rsiValuesWithGaps.slice(firstRsiIndex) as number[];
    const rsiDataPoints = data.slice(firstRsiIndex);
    
    if (rsiValues.length < stochasticPeriod) return [];

    const stochRsiKRaw: (number | undefined)[] = [];
    for(let i = 0; i < rsiValues.length; i++) {
        if(i < stochasticPeriod -1) {
            stochRsiKRaw.push(undefined);
            continue;
        }
        const slice = rsiValues.slice(i - stochasticPeriod + 1, i + 1);
        const highestRsi = Math.max(...slice);
        const lowestRsi = Math.min(...slice);
        const currentRsi = rsiValues[i];

        if (highestRsi === lowestRsi) {
            stochRsiKRaw.push(100);
        } else {
            stochRsiKRaw.push(((currentRsi - lowestRsi) / (highestRsi - lowestRsi)) * 100);
        }
    }
    
    const firstStochRsiIndex = stochRsiKRaw.findIndex(v => v !== undefined);
    if (firstStochRsiIndex === -1) return [];

    const stochRsiValues = stochRsiKRaw.slice(firstStochRsiIndex) as number[];

    const kValuesWithGaps = sma(stochRsiValues, kPeriod);
    const firstKIndex = kValuesWithGaps.findIndex(v => v !== undefined);
    if(firstKIndex === -1) return [];
    
    const kValues = kValuesWithGaps.slice(firstKIndex) as number[];

    const dValuesWithGaps = sma(kValues, dPeriod);
    const firstDIndex = dValuesWithGaps.findIndex(v => v !== undefined);
    if(firstDIndex === -1) return [];

    const dValues = dValuesWithGaps.slice(firstDIndex) as number[];

    const result: StochasticRsiDataPoint[] = [];
    
    const kOffset = firstDIndex;
    const dataOffset = firstStochRsiIndex + firstKIndex + firstDIndex;

    dValues.forEach((dValue, i) => {
        const kValue = kValues[i + kOffset];
        const dataPoint = rsiDataPoints[i + dataOffset];
        if (dValue !== undefined && kValue !== undefined && dataPoint) {
            result.push({
                time: dataPoint.time as Time,
                k: kValue,
                d: dValue,
            });
        }
    });

    return result;
};
