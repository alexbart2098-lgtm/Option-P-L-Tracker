import { OptionStrategy, OptionLeg, OptionAction, OptionType } from '../types';

/**
 * Calculates the required capital (margin) for a single options leg.
 * Note: This is a simplified calculation and may not match all broker methodologies.
 */
const calculateSingleLegMargin = (leg: OptionLeg): number => {
    const contracts = leg.contracts;
    const premium = leg.purchasePrice * 100 * contracts;
    const strikePriceValue = leg.strike * 100 * contracts;

    if (leg.action === OptionAction.BUY) {
        // For long positions (debits), the max loss is the premium paid. This is the margin.
        return premium;
    } else { // SELL
        if (leg.type === OptionType.PUT) {
            // Cash-Secured Put: Margin is typically (Strike * 100) - Premium Received.
            // This represents the cash needed to buy the shares if assigned.
            return strikePriceValue - premium;
        } else { // CALL
            // Naked Call: Risk is theoretically unlimited. Margin calculations are complex
            // and require data not available here (e.g., underlying stock price).
            // We'll return Infinity to signify this is not a simple calculation.
            return Infinity; 
        }
    }
};

/**
 * Calculates the required margin for a given options strategy.
 * Provides simplified calculations for common strategies.
 */
export const calculateMargin = (strategy: OptionStrategy): number => {
    const { legs } = strategy;
    const legCount = legs.length;

    if (legCount === 0) {
        return 0;
    }

    // Handle single-leg strategies
    if (legCount === 1) {
        return calculateSingleLegMargin(legs[0]);
    }

    const contracts = legs[0].contracts; // Assuming same number of contracts per leg for spreads
    const isSameTicker = legs.every(leg => leg.ticker === legs[0].ticker);
    const isSameExpiration = legs.every(leg => leg.expiration === legs[0].expiration);
    
    // Check for common multi-leg strategies if ticker and expiration match
    if (isSameTicker && isSameExpiration) {
        // Vertical Spreads (2 legs)
        if (legCount === 2) {
            const buys = legs.filter(l => l.action === OptionAction.BUY);
            const sells = legs.filter(l => l.action === OptionAction.SELL);
            const isSameType = legs[0].type === legs[1].type;

            if (buys.length === 1 && sells.length === 1 && isSameType) {
                const strikeDifference = Math.abs(buys[0].strike - sells[0].strike) * 100 * contracts;
                const netPremium = (sells[0].purchasePrice - buys[0].purchasePrice) * 100 * contracts;
                
                if (netPremium > 0) { // Credit Spread
                    // Margin is the max loss: difference in strikes minus net credit.
                    return strikeDifference - netPremium;
                } else { // Debit Spread
                    // Margin is the max loss: the net debit paid.
                    return -netPremium;
                }
            }
        }
        
        // Iron Condor (4 legs)
        if (legCount === 4) {
             const puts = legs.filter(l => l.type === OptionType.PUT);
             const calls = legs.filter(l => l.type === OptionType.CALL);
             
             if (puts.length === 2 && calls.length === 2) {
                 const putStrikes = puts.map(p => p.strike).sort((a,b) => a-b);
                 const callStrikes = calls.map(c => c.strike).sort((a,b) => a-b);
                 
                 if(putStrikes.length === 2 && callStrikes.length === 2){
                     const putSpreadWidth = putStrikes[1] - putStrikes[0];
                     // For a standard condor, widths are equal.
                     // The margin for an Iron Condor is the width of the spread (max loss).
                     return putSpreadWidth * 100 * contracts;
                 }
             }
        }
    }

    // Fallback for custom/unrecognized strategies: Sum of individual margins.
    // This is a conservative estimate and may be higher than a broker's portfolio margin.
    const totalMargin = legs.reduce((acc, leg) => acc + calculateSingleLegMargin(leg), 0);
    return totalMargin;
};
