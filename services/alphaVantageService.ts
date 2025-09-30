import { StockPriceUpdate } from '../types';

const BASE_URL = 'https://www.alphavantage.co/query';

// Alpha Vantage free tier has a rate limit (e.g., 5 calls per minute).
// We add a delay between fetches to avoid hitting this limit.
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const validateApiKey = async (apiKey: string): Promise<{ success: boolean; message: string }> => {
    if (!apiKey) return { success: false, message: 'API key is empty.' };
    
    const url = `${BASE_URL}?function=GLOBAL_QUOTE&symbol=IBM&apikey=${apiKey}`;
    try {
        const res = await fetch(url);
        const data = await res.json();

        if (data['Error Message'] && data['Error Message'].includes('Invalid API call')) {
            return { success: false, message: 'Invalid API key.' };
        }
        if (data['Global Quote']) {
            return { success: true, message: 'Connection successful!' };
        }
        if (data.Note && data.Note.includes('API request frequency')) {
            // Rate limit hit, but the key is likely valid.
            return { success: true, message: 'Connection successful (rate limit hit, but key is valid).' };
        }
        return { success: false, message: 'Unknown validation error.' };
    } catch (error) {
        console.error('Alpha Vantage validation error:', error);
        return { success: false, message: 'Failed to connect to the server.' };
    }
};

export const fetchCurrentStockPrices = async (tickers: string[], apiKey: string): Promise<StockPriceUpdate[]> => {
    if (tickers.length === 0 || !apiKey) {
        return [];
    }
    
    const priceUpdates: StockPriceUpdate[] = [];
    
    for (const ticker of tickers) {
        const url = `${BASE_URL}?function=GLOBAL_QUOTE&symbol=${ticker}&apikey=${apiKey}`;
        try {
            const res = await fetch(url);
            if (!res.ok) {
                console.error(`Failed to fetch stock price for ${ticker} (${res.status})`);
                continue; // Skip to next ticker
            }
            const data = await res.json();
            
            const quote = data['Global Quote'];
            if (quote && Object.keys(quote).length > 0 && quote['05. price'] && quote['08. previous close']) {
                priceUpdates.push({
                    ticker: ticker,
                    price: parseFloat(quote['05. price']),
                    previousClose: parseFloat(quote['08. previous close']),
                });
            } else if (data.Note) {
                 // This indicates a rate limit error from Alpha Vantage
                 throw new Error(`API limit likely reached: ${data.Note}`);
            } else {
                 console.warn(`No price data found for ticker: ${ticker}. Response:`, data);
            }

            // Add a delay between requests to be kind to the free API tier.
            // A delay of ~1 second should be safe for most tiers.
            if (tickers.length > 1) {
                await delay(1200);
            }

        } catch (error) {
            console.error(`Error fetching stock price for ${ticker}:`, error);
            // Re-throw to allow the UI to display a general error message
            throw error;
        }
    }
    
    return priceUpdates;
};