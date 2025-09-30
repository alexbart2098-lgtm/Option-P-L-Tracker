import { OptionLegInput, OptionAction, OptionType } from '../types';

/**
 * Checks if all legs in an array share the same value for a given set of properties.
 */
const haveSharedProperties = (legs: OptionLegInput[], props: (keyof OptionLegInput)[]) => {
    if (legs.length < 2) return true;
    const firstLeg = legs[0];
    return legs.every(leg => props.every(prop => leg[prop] === firstLeg[prop]));
};

/**
 * Identifies a common options strategy from a list of legs.
 */
export const identifyStrategy = (legs: OptionLegInput[]): string => {
    const legCount = legs.length;
    
    if (legCount === 0 || !legs[0]?.ticker) {
        return '';
    }
    const ticker = legs[0].ticker.toUpperCase();
    const sortedLegs = [...legs].sort((a, b) => a.strike - b.strike);

    // --- Single-leg strategies ---
    if (legCount === 1) {
        const leg = legs[0];
        if (leg.action === OptionAction.BUY && leg.type === OptionType.CALL) return `${ticker} Long Call`;
        if (leg.action === OptionAction.BUY && leg.type === OptionType.PUT) return `${ticker} Long Put`;
        if (leg.action === OptionAction.SELL && leg.type === OptionType.PUT) return `${ticker} Cash-Secured Put`;
        if (leg.action === OptionAction.SELL && leg.type === OptionType.CALL) return `${ticker} Covered Call`;
    }

    // --- Two-leg strategies ---
    if (legCount === 2) {
        const buys = legs.filter(l => l.action === OptionAction.BUY);
        const sells = legs.filter(l => l.action === OptionAction.SELL);

        // 1. Ratio Spreads / Backspreads (unequal contracts)
        if (haveSharedProperties(legs, ['ticker', 'expiration', 'type']) && buys.length === 1 && sells.length === 1 && buys[0].contracts !== sells[0].contracts) {
            const buyLeg = buys[0];
            const sellLeg = sells[0];
            const type = legs[0].type === OptionType.CALL ? 'Call' : 'Put';
            if (sellLeg.contracts > buyLeg.contracts) {
                const ratio = `${buyLeg.contracts}x${sellLeg.contracts}`;
                return `${ticker} ${ratio} ${type} Ratio Spread`;
            } else { // buyLeg.contracts > sellLeg.contracts
                const ratio = `${sellLeg.contracts}x${buyLeg.contracts}`;
                return `${ticker} ${ratio} ${type} Backspread`;
            }
        }
        
        // 2. Vertical Spreads (same type, expiration, and contract count)
        if (haveSharedProperties(legs, ['ticker', 'expiration', 'type']) && buys.length === 1 && sells.length === 1 && buys[0].contracts === sells[0].contracts) {
            const buyLeg = buys[0];
            const sellLeg = sells[0];
            if (legs[0].type === OptionType.CALL) {
                if (buyLeg.strike < sellLeg.strike) return `${ticker} Bull Call Spread`;
                if (sellLeg.strike < buyLeg.strike) return `${ticker} Bear Call Spread`;
            }
            if (legs[0].type === OptionType.PUT) {
                if (buyLeg.strike > sellLeg.strike) return `${ticker} Bear Put Spread`;
                if (sellLeg.strike > buyLeg.strike) return `${ticker} Bull Put Spread`;
            }
        }
        
        // 3. Straddles / Strangles (different types, same expiration)
        if (haveSharedProperties(legs, ['ticker', 'expiration']) && !haveSharedProperties(legs, ['type'])) {
            const calls = legs.filter(l => l.type === OptionType.CALL);
            const puts = legs.filter(l => l.type === OptionType.PUT);
            if (calls.length === 1 && puts.length === 1) {
                const areBothBuys = buys.length === 2;
                const areBothSells = sells.length === 2;
                if (areBothBuys || areBothSells) {
                    const prefix = areBothBuys ? 'Long' : 'Short';
                    if (legs[0].strike === legs[1].strike) return `${ticker} ${prefix} Straddle`;
                    return `${ticker} ${prefix} Strangle`;
                }
            }
        }
        
        // 4. Calendar / Diagonal Spreads (different expirations)
        if (haveSharedProperties(legs, ['ticker', 'type', 'action']) && legs[0].expiration !== legs[1].expiration) {
            const prefix = legs[0].action === OptionAction.BUY ? 'Long' : 'Short';
            if (legs[0].strike === legs[1].strike) return `${ticker} ${prefix} Calendar Spread`;
            return `${ticker} ${prefix} Diagonal Spread`;
        }
    }

    // --- Three-leg strategies ---
    if (legCount === 3 && haveSharedProperties(legs, ['ticker', 'expiration', 'type'])) {
        const [leg1, leg2, leg3] = sortedLegs;
        const type = legs[0].type === OptionType.CALL ? 'Call' : 'Put';

        // Long Butterfly: Buy 1, Sell 2, Buy 1
        if (leg1.action === OptionAction.BUY && leg3.action === OptionAction.BUY && leg2.action === OptionAction.SELL &&
            leg1.contracts === leg3.contracts && leg2.contracts === leg1.contracts * 2 &&
            (leg2.strike - leg1.strike === leg3.strike - leg2.strike)) {
            return `${ticker} Long ${type} Butterfly`;
        }
        // Short Butterfly: Sell 1, Buy 2, Sell 1
        if (leg1.action === OptionAction.SELL && leg3.action === OptionAction.SELL && leg2.action === OptionAction.BUY &&
            leg1.contracts === leg3.contracts && leg2.contracts === leg1.contracts * 2 &&
            (leg2.strike - leg1.strike === leg3.strike - leg2.strike)) {
            return `${ticker} Short ${type} Butterfly`;
        }
    }

    // --- Four-leg strategies ---
    if (legCount === 4 && haveSharedProperties(legs, ['ticker', 'expiration'])) {
        const buys = legs.filter(l => l.action === OptionAction.BUY);
        const sells = legs.filter(l => l.action === OptionAction.SELL);
        const calls = legs.filter(l => l.type === OptionType.CALL);
        const puts = legs.filter(l => l.type === OptionType.PUT);

        // Long Condor (all calls or all puts)
        if (haveSharedProperties(legs, ['type']) && buys.length === 2 && sells.length === 2) {
            const [leg1, leg2, leg3, leg4] = sortedLegs;
            if (leg1.action === OptionAction.BUY && leg4.action === OptionAction.BUY && leg2.action === OptionAction.SELL && leg3.action === OptionAction.SELL) {
                const type = leg1.type === OptionType.CALL ? 'Call' : 'Put';
                return `${ticker} Long ${type} Condor`;
            }
        }

        // Iron Condor / Iron Butterfly
        if (buys.length === 2 && sells.length === 2 && calls.length === 2 && puts.length === 2) {
            const [leg1, leg2, leg3, leg4] = sortedLegs;
            const isIronCondorStructure = leg1.type === OptionType.PUT && leg1.action === OptionAction.BUY &&
                                          leg2.type === OptionType.PUT && leg2.action === OptionAction.SELL &&
                                          leg3.type === OptionType.CALL && leg3.action === OptionAction.SELL &&
                                          leg4.type === OptionType.CALL && leg4.action === OptionAction.BUY;
            if (isIronCondorStructure) {
                if (leg2.strike === leg3.strike) return `${ticker} Iron Butterfly`;
                return `${ticker} Iron Condor`;
            }
        }
    }

    return legCount > 1 ? `${ticker} Custom Strategy` : '';
};
