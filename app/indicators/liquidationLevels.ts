// Liquidation Levels Custom Indicator for TradingView
// Simple version with 10x leverage

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
    (this as any).main = function (context: any, inputCallback: any) {
      // The context parameter contains the PineJS instance
      // We need to access it from the symbol parameter
      const { symbol } = context;

      // Get the close price from the symbol's data
      // For custom indicators, we use the close price from the current bar
      const close = (this as any)._context?.symbol()?.ticker?.close ||
                    symbol?.ticker?.close ||
                    context?.close?.(context) ||
                    2000; // Fallback to a default value if we can't get the price

      // Calculate liquidation levels for 10x leverage
      // Long liquidation: price drops 9.5% (10% for leverage + 0.5% fee buffer)
      // Short liquidation: price rises 10.5% (10% for leverage + 0.5% fee buffer)
      const longLiq = close * 0.895;  // -10.5%
      const shortLiq = close * 1.105; // +10.5%

      return [longLiq, shortLiq];
    };

    (this as any).init = function(context: any, inputCallback: any) {
      (this as any)._context = context;
      (this as any)._input = inputCallback;
    };
  },
};

export default LiquidationLevelsIndicator;
