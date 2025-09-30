
import { OptionLeg, OptionPriceUpdate, StockPriceUpdate } from '../types';

/**
 * Formats an option leg into a Polygon.io compatible ticker string.
 * Format: O:{ticker}{yyMMdd}{C/P}{strike_price}
 * Example: O:AAPL241220C00150000
 */
const formatPolygonOptionTicker = (leg: OptionLeg): string => {
    // leg.expiration is 'YYYY-MM-DD'. Avoid creating a Date object to prevent timezone issues.
    // By splitting the string, we get the correct date parts regardless of user's timezone.
    const [yearStr, month, day] = leg.expiration.split('-');
    const expirationStr = `${yearStr.slice(-2)}${month}${day}`;

    const type = leg.type === 'CALL' ? 'C' : 'P';
    
    // Strike price needs to be padded to 8 digits (5 before decimal, 3 after)
    const strikeStr = (leg.strike * 1000).toString().padStart(8, '0');

    return `O:${leg.ticker}${expirationStr}${type}${strikeStr}`;
}

const BASE_URL = 'https://api.polygon.io';

export const fetchCurrentOptionPrices = async (legs: OptionLeg[], apiKey: string): Promise<OptionPriceUpdate[]> => {
    if (legs.length === 0 || !apiKey) {
        return [];
    }

    const requests = legs.map(leg => {
        const polygonTicker = formatPolygonOptionTicker(leg);
        // The underlying ticker is needed for the URL path for options
        const url = `${BASE_URL}/v3/snapshot/options/${leg.ticker}/${polygonTicker}?apiKey=${apiKey}`;
        return fetch(url).then(async res => {
            if (!res.ok) {
                const errorBody = await res.json().catch(() => ({ message: res.statusText }));
                // Throw an error to be caught by Promise.allSettled
                throw new Error(`Failed to fetch option price for ${leg.ticker} (${res.status}): ${errorBody.message || res.statusText}`);
            }
            return res.json();
        }).then(data => ({
            id: leg.id,
            // Use last trade price, fallback to day's close
            currentPrice: data.results?.last_trade?.price ?? data.results?.day?.close ?? null
        }));
    });

    const results = await Promise.allSettled(requests);
    
    const successfulUpdates: OptionPriceUpdate[] = [];
    results.forEach(result => {
        if (result.status === 'fulfilled' && result.value.currentPrice !== null) {
            successfulUpdates.push(result.value);
        } else if (result.status === 'rejected') {
            console.error(result.reason);
        }
    });

    return successfulUpdates;
};


export const fetchCurrentStockPrices = async (tickers: string[], apiKey: string): Promise<StockPriceUpdate[]> => {
    if (tickers.length === 0 || !apiKey) {
        return [];
    }
    
    // Polygon's snapshot endpoint for multiple tickers is better
    const tickersStr = tickers.join(',');
    const url = `${BASE_URL}/v2/snapshot/locale/us/markets/stocks/tickers?tickers=${tickersStr}&apiKey=${apiKey}`;

    try {
        const res = await fetch(url);
        if (!res.ok) {
            const errorBody = await res.json().catch(() => ({ message: res.statusText }));
            throw new Error(`Failed to fetch stock prices (${res.status}): ${errorBody.message || res.statusText}`);
        }
        const data = await res.json();
        
        if (!data.tickers) {
            return [];
        }

        return data.tickers.map((tickerData: any) => ({
            ticker: tickerData.ticker,
            // Use last trade price, fallback to day's close
            price: tickerData.lastTrade?.p ?? tickerData.day?.c ?? null,
        })).filter((update: StockPriceUpdate) => update.price !== null);

    } catch (error) {
        console.error("Error fetching stock prices from Polygon API:", error);
        throw new Error("Failed to get live stock prices.");
    }
};