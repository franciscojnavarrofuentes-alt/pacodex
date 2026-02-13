// Liquidation Levels Custom Indicator for TradingView
// Simple version with 10x leverage

export const LiquidationLevelsIndicator: any = {
  name: 'Liquidation Levels',
  metainfo: {
    _metainfoVersion: 51,
    id: 'LiquidationLevels@tv-basicstudies-1',
    name: 'Liquidation Levels',
    description: 'Liquidation Levels',
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
    console.log('🚀 Liquidation Levels Indicator CONSTRUCTOR called');

    (this as any).init = function(context: any, inputCallback: any) {
      console.log('📊 INIT called with context:', context);
      (this as any)._context = context;
      (this as any)._input = inputCallback;
    };

    (this as any).main = function (context: any, inputCallback: any) {
      console.log('📊 Liquidation Levels Indicator MAIN called');
      console.log('📊 Context:', context);
      console.log('📊 Input callback:', inputCallback);

      // Access PineJS from the global scope
      const PineJS = (window as any).PineJS;

      if (!PineJS || !PineJS.Std) {
        console.error('❌ PineJS not available');
        return [NaN, NaN];
      }

      try {
        // Use PineJS.Std.close to get the current close price
        const close = PineJS.Std.close(context);
        console.log('📊 Close price from PineJS:', close);

        if (!close || close === 0 || isNaN(close)) {
          console.log('📊 Invalid close price, returning NaN');
          return [NaN, NaN];
        }

        // Calculate liquidation levels for 10x leverage
        const longLiq = close * 0.895; // close * (1 - 1/10 - 0.005)
        const shortLiq = close * 1.105; // close * (1 + 1/10 + 0.005)

        console.log('📊 Returning levels - Long:', longLiq, 'Short:', shortLiq);
        return [longLiq, shortLiq];
      } catch (error) {
        console.error('❌ Error in main function:', error);
        return [NaN, NaN];
      }
    };
  },
};

export default LiquidationLevelsIndicator;
