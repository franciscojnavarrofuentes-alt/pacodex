// Liquidation Levels Custom Indicator for TradingView
// Simple version with 10x leverage

export const LiquidationLevelsIndicator = {
  name: 'Liquidation Levels',
  metainfo: {
    _metainfoVersion: 53,
    id: 'liquidation-levels@pacodex-1',
    description: 'Liquidation Levels',
    shortDescription: 'Liq Levels',
    is_price_study: true,
    isCustomIndicator: true,

    plots: [
      { id: 'long_liq', type: 'line' },
      { id: 'short_liq', type: 'line' },
    ],

    defaults: {
      styles: {
        long_liq: {
          linestyle: 2,
          linewidth: 2,
          plottype: 2,
          trackPrice: false,
          transparency: 30,
          color: '#FF4444',
        },
        short_liq: {
          linestyle: 2,
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
    return {
      main: function (context: any) {
        // Get current close price from the last bar
        const close = context.symbol.close || 0;

        if (close === 0) {
          return [null, null];
        }

        // Calculate liquidation levels for 10x leverage
        const longLiq = close * 0.895; // close * (1 - 1/10 - 0.005)
        const shortLiq = close * 1.105; // close * (1 + 1/10 + 0.005)

        return [longLiq, shortLiq];
      },
    };
  },
};

export default LiquidationLevelsIndicator;
