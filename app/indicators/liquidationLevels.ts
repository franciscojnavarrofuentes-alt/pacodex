// Liquidation Levels Custom Indicator for TradingView
// Shows 10x leverage liquidation levels

export const LiquidationLevelsIndicator: any = {
  name: 'Liquidation Levels',
  metainfo: {
    _metainfoVersion: 51,
    id: 'LiquidationLevels@tv-basicstudies-1',
    name: 'Liquidation Levels',
    description: 'Shows liquidation levels for 10x leverage positions',
    shortDescription: 'Liq Levels',

    is_price_study: true,
    isCustomIndicator: true,

    format: {
      type: 'price',
      precision: 2,
    },

    plots: [
      { id: 'long_liq', type: 'line' },
      { id: 'short_liq', type: 'line' },
    ],

    defaults: {
      styles: {
        long_liq: {
          linestyle: 0,
          linewidth: 2,
          plottype: 2,
          trackPrice: false,
          transparency: 30,
          color: '#FF4444',
        },
        short_liq: {
          linestyle: 0,
          linewidth: 2,
          plottype: 2,
          trackPrice: false,
          transparency: 30,
          color: '#4ECDC4',
        },
      },
      precision: 2,
      inputs: {},
    },

    styles: {
      long_liq: {
        title: 'Long Liq 10x',
        histogramBase: 0,
      },
      short_liq: {
        title: 'Short Liq 10x',
        histogramBase: 0,
      },
    },

    inputs: [],
  },

  constructor: function () {
    (this as any).init = function(context: any, inputCallback: any) {
      (this as any)._context = context;
      (this as any)._input = inputCallback;
    };

    (this as any).main = function (context: any, inputCallback: any) {
      // Access the context's symbol method
      // The context.symbol() function returns the current symbol data
      const symbolInfo = context.symbol();

      // Get close price from PineJS standard library
      // We need to get it from the context using the new keyword
      const PineJS = context.new_sym ? context.new_sym(context.symbol.ticker, context.symbol.period) : null;

      // Try multiple ways to get the current price
      let close = 2000; // Default fallback

      // Method 1: Try to get from symbol info
      if (symbolInfo && symbolInfo.ticker) {
        const priceStr = String(symbolInfo.ticker).match(/[\d.]+/);
        if (priceStr) {
          close = parseFloat(priceStr[0]);
        }
      }

      // Method 2: Try to access from context close values
      if (!close || close === 2000) {
        if ((this as any)._context && (this as any)._context.symbol) {
          const sym = (this as any)._context.symbol;
          if (typeof sym === 'function') {
            const symData = sym();
            if (symData && symData.ticker) {
              close = symData.ticker.close || symData.ticker.last || close;
            }
          } else if (sym && sym.ticker) {
            close = sym.ticker.close || sym.ticker.last || close;
          }
        }
      }

      // Calculate liquidation levels for 10x leverage
      // Long liquidation: -10.5% (10% leverage + 0.5% fee)
      // Short liquidation: +10.5% (10% leverage + 0.5% fee)
      const longLiq = close * 0.895;  // -10.5%
      const shortLiq = close * 1.105; // +10.5%

      return [longLiq, shortLiq];
    };
  },
};

export default LiquidationLevelsIndicator;
