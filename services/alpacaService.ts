import { OptionLeg, StockPriceUpdate, OptionPriceUpdate, CandlestickData } from '../types';

const DATA_BASE_URL = 'https://data.alpaca.markets';

/**
 * Formats an option leg into an Alpaca compatible ticker string (OCC format).
 * Example: AAPL241220C00150000
 */
const formatAlpacaOptionTicker = (leg: OptionLeg): string => {
    // leg.expiration is 'YYYY-MM-DD'.
    const [yearStr, month, day] = leg.expiration.split('-');
    const expirationStr = `${yearStr.slice(-2)}${month}${day}`;
    const type = leg.type === 'CALL' ? 'C' : 'P';
    
    // Strike price needs to be padded to 8 digits (5 before decimal, 3 after)
    const strikeStr = (leg.strike * 1000).toString().padStart(8, '0');

    return `${leg.ticker}${expirationStr}${type}${strikeStr}`;
}

const getHeaders = (apiKey: string, apiSecret: string) => ({
    'APCA-API-KEY-ID': apiKey,
    'APCA-API-SECRET-KEY': apiSecret,
    'accept': 'application/json',
});

export const validateApiKeys = async (apiKey: string, apiSecret: string): Promise<{ success: boolean; message: string }> => {
    if (!apiKey || !apiSecret) return { success: false, message: 'API Key and Secret are required.' };

    const url = `${DATA_BASE_URL}/v2/stocks/snapshots?symbols=SPY`; // A simple, low-cost call
    try {
        const response = await fetch(url, { headers: getHeaders(apiKey, apiSecret) });
        if (response.ok) {
            return { success: true, message: 'Connection successful!' };
        }
        if (response.status === 403) {
            return { success: false, message: 'Invalid credentials. Please check your keys.' };
        }
        const errorBody = await response.json().catch(() => ({ message: response.statusText }));
        return { success: false, message: `Validation failed: ${errorBody.message}` };
    } catch (error) {
        console.error('Alpaca validation error:', error);
        return { success: false, message: 'Failed to connect to the server.' };
    }
};

export const fetchCurrentStockPrices = async (tickers: string[], apiKey: string, apiSecret: string): Promise<StockPriceUpdate[]> => {
    if (tickers.length === 0) return [];

    const url = `${DATA_BASE_URL}/v2/stocks/snapshots?symbols=${tickers.join(',')}`;
    
    try {
        const response = await fetch(url, { headers: getHeaders(apiKey, apiSecret) });
        if (!response.ok) {
            const errorBody = await response.json().catch(() => ({ message: response.statusText }));
            throw new Error(`Failed to fetch stock prices from Alpaca (${response.status}): ${errorBody.message}`);
        }
        const data = await response.json();
        
        return Object.entries(data).map(([ticker, snapshot]: [string, any]) => ({
            ticker,
            price: snapshot?.latestTrade?.p ?? snapshot?.dailyBar?.c ?? null,
            previousClose: snapshot?.prevDailyBar?.c ?? null
        })).filter((update: Partial<StockPriceUpdate>) => update.price !== null && update.previousClose !== null) as StockPriceUpdate[];

    } catch (error) {
        console.error("Error fetching stock prices from Alpaca:", error);
        throw error;
    }
};

export const fetchCurrentOptionPrices = async (legs: OptionLeg[], apiKey: string, apiSecret: string): Promise<OptionPriceUpdate[]> => {
    if (legs.length === 0) return [];
    
    const optionSymbols = legs.map(formatAlpacaOptionTicker);
    const url = `${DATA_BASE_URL}/v1beta1/options/snapshots?symbols=${optionSymbols.join(',')}`;

    try {
        const response = await fetch(url, { headers: getHeaders(apiKey, apiSecret) });
        if (!response.ok) {
            const errorBody = await response.json().catch(() => ({ message: response.statusText }));
            throw new Error(`Failed to fetch option prices from Alpaca (${response.status}): ${errorBody.message}`);
        }
        const data = await response.json();
        
        const updates: OptionPriceUpdate[] = [];
        Object.entries(data.snapshots).forEach(([symbol, snapshot]: [string, any]) => {
            const originalLeg = legs.find(leg => formatAlpacaOptionTicker(leg) === symbol);
            if (originalLeg) {
                const price = snapshot?.latestQuote?.ap ?? null; // Use ask price for current value
                if (price !== null) {
                    updates.push({ id: originalLeg.id, currentPrice: price });
                }
            }
        });
        return updates;
    } catch (error) {
        console.error("Error fetching option prices from Alpaca:", error);
        throw error;
    }
};

export const fetchStockBars = async (
  ticker: string,
  range: '5D' | '1M' | '3M' | '6M' | '1Y' | '2Y' | '5Y' | 'MAX',
  apiKey: string,
  apiSecret: string
): Promise<CandlestickData[]> => {
  const now = new Date();
  const endDate = new Date(now);
  endDate.setDate(endDate.getDate() - 1);

  const startDate = new Date(endDate);
  const timeframe = '1Day'; // Using daily bars for all timeframes for simplicity

  switch (range) {
    case '5D':
      // Request a wider range to account for non-trading days, we'll slice it later
      startDate.setDate(endDate.getDate() - 10);
      break;
    case '1M':
      startDate.setMonth(endDate.getMonth() - 1);
      break;
    case '3M':
      startDate.setMonth(endDate.getMonth() - 3);
      break;
    case '6M':
      startDate.setMonth(endDate.getMonth() - 6);
      break;
    case '2Y':
      startDate.setFullYear(endDate.getFullYear() - 2);
      break;
    case '5Y':
      startDate.setFullYear(endDate.getFullYear() - 5);
      break;
    case 'MAX':
      startDate.setFullYear(endDate.getFullYear() - 20); // Fetch up to 20 years of data
      break;
    case '1Y':
    default:
      startDate.setFullYear(endDate.getFullYear() - 1);
      break;
  }

  const start = startDate.toISOString().split('T')[0];
  const end = endDate.toISOString().split('T')[0];
  
  const url = `${DATA_BASE_URL}/v2/stocks/${ticker}/bars?timeframe=${timeframe}&start=${start}&end=${end}&limit=10000`;
  
  try {
    const response = await fetch(url, { headers: getHeaders(apiKey, apiSecret) });
    if (!response.ok) {
        const errorBody = await response.json().catch(() => ({ message: response.statusText }));
        throw new Error(`Failed to fetch stock bars from Alpaca (${response.status}): ${errorBody.message}`);
    }
    const data = await response.json();

    if (!data.bars) {
        console.warn(`No bars data found for ticker: ${ticker}. Response:`, data);
        return [];
    };
    
    const bars: CandlestickData[] = data.bars.map((bar: any) => ({
      time: bar.t.substring(0, 10), // 'YYYY-MM-DD'
      open: bar.o,
      high: bar.h,
      low: bar.l,
      close: bar.c,
      volume: bar.v,
    }));

    // For 5D, ensure we only return the most recent 5 trading days
    if (range === '5D') {
      return bars.slice(-5);
    }
    
    return bars;
  } catch (error) {
    console.error(`Error fetching stock bars for ${ticker}:`, error);
    throw error;
  }
};