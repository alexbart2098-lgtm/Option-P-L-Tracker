import { GoogleGenAI, Type } from "@google/genai";
import { OptionLeg } from '../types';

// Per guidelines, initialize GoogleGenAI with the API key directly from environment variables.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const simulateCurrentOptionPrice = async (leg: OptionLeg, stockPrice: number): Promise<number | null> => {
    // Fix: Updated prompt to be more explicit about JSON output.
    const prompt = `You are a financial expert specializing in options pricing. Based on the following data, estimate the current market price per share for a single options contract.

- Underlying Stock: ${leg.ticker}
- Current Stock Price: $${stockPrice.toFixed(2)}
- Option Type: ${leg.type}
- Strike Price: $${leg.strike.toFixed(2)}
- Expiration Date: ${leg.expiration}

Respond with only a JSON object matching the provided schema, with a single key "price". For example: {"price": 2.35}`;

    try {
        // Fix: Switched to JSON mode for robust parsing of the option price.
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        price: {
                            type: Type.NUMBER,
                            description: 'The estimated current market price per share for a single options contract.',
                        },
                    },
                    required: ['price'],
                },
            },
        });
        
        const jsonString = response.text.trim();
        const result = JSON.parse(jsonString);

        if (typeof result.price === 'number') {
            return result.price;
        }

        console.error('Gemini API did not return a valid price in JSON:', jsonString);
        return null;
    } catch (error) {
        console.error('Error simulating option price with Gemini API:', error);
        return null;
    }
};
