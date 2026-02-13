// Liquidation Levels Custom Indicator for TradingView
// Based on Orderly Network Open Interest data

import { fetchOpenInterest, calculateLiquidationLevels } from '../services/orderlyDataService';

export const LiquidationLevelsIndicator = {
  name: 'Liquidation Levels',
  metainfo: {
    _metainfoVersion: 52,
    id: 'liquidation-levels@pacodex-1',
    description: 'Liquidation Levels',
    shortDescription: 'Liq Levels',
    is_price_study: true,
    isCustomIndicator: true,

    plots: [
      { id: 'long_liq_10x', type: 'line' },
      { id: 'long_liq_20x', type: 'line' },
      { id: 'long_liq_50x', type: 'line' },
      { id: 'short_liq_10x', type: 'line' },
      { id: 'short_liq_20x', type: 'line' },
      { id: 'short_liq_50x', type: 'line' },
    ],

    defaults: {
      styles: {
        long_liq_10x: {
          linestyle: 2, // Dashed
          linewidth: 1,
          plottype: 2, // Line
          trackPrice: false,
          transparency: 50,
          color: '#FF6B6B', // Red for long liquidations
        },
        long_liq_20x: {
          linestyle: 2,
          linewidth: 1,
          plottype: 2,
          trackPrice: false,
          transparency: 50,
          color: '#FF4444',
        },
        long_liq_50x: {
          linestyle: 2,
          linewidth: 2,
          plottype: 2,
          trackPrice: false,
          transparency: 50,
          color: '#FF0000',
        },
        short_liq_10x: {
          linestyle: 2,
          linewidth: 1,
          plottype: 2,
          trackPrice: false,
          transparency: 50,
          color: '#4ECDC4', // Cyan for short liquidations
        },
        short_liq_20x: {
          linestyle: 2,
          linewidth: 1,
          plottype: 2,
          trackPrice: false,
          transparency: 50,
          color: '#45B7D1',
        },
        short_liq_50x: {
          linestyle: 2,
          linewidth: 2,
          plottype: 2,
          trackPrice: false,
          transparency: 50,
          color: '#2E86AB',
        },
      },
      precision: 2,
      inputs: {},
    },

    styles: {
      long_liq_10x: {
        title: 'Long Liq 10x',
        histogramBase: 0,
      },
      long_liq_20x: {
        title: 'Long Liq 20x',
        histogramBase: 0,
      },
      long_liq_50x: {
        title: 'Long Liq 50x',
        histogramBase: 0,
      },
      short_liq_10x: {
        title: 'Short Liq 10x',
        histogramBase: 0,
      },
      short_liq_20x: {
        title: 'Short Liq 20x',
        histogramBase: 0,
      },
      short_liq_50x: {
        title: 'Short Liq 50x',
        histogramBase: 0,
      },
    },

    inputs: [],
  },

  constructor: function (this: any) {
    let cachedLevels: any = null;
    let lastFetchTime = 0;
    const CACHE_DURATION = 60000; // 1 minute cache

    this.init = function (context: any, inputCallback: any) {
      this._context = context;
      this._input = inputCallback;
    };

    this.main = function (context: any, inputCallback: any) {
      this._context = context;
      this._input = inputCallback;

      const currentTime = Date.now();

      // Fetch data if cache expired
      if (!cachedLevels || currentTime - lastFetchTime > CACHE_DURATION) {
        // Get current price from context
        const close = this._context.symbol.ticker.close || 0;

        if (close > 0) {
          // Calculate liquidation levels
          const levels = calculateLiquidationLevels(close, 1000000, [10, 20, 50]);

          cachedLevels = {
            longLiq10x: levels.longLiquidations[0],
            longLiq20x: levels.longLiquidations[1],
            longLiq50x: levels.longLiquidations[2],
            shortLiq10x: levels.shortLiquidations[0],
            shortLiq20x: levels.shortLiquidations[1],
            shortLiq50x: levels.shortLiquidations[2],
          };

          lastFetchTime = currentTime;

          // Fetch real open interest data asynchronously
          const symbol = this._context.symbol.ticker.symbol || 'ETHUSDC';
          fetchOpenInterest(symbol).then((data) => {
            if (data && data.longOI > 0) {
              // Update with real data when available
              console.log('Open Interest:', data);
            }
          }).catch((err) => {
            console.error('Error fetching OI:', err);
          });
        }
      }

      // Return current liquidation levels
      return [
        cachedLevels?.longLiq10x || 0,
        cachedLevels?.longLiq20x || 0,
        cachedLevels?.longLiq50x || 0,
        cachedLevels?.shortLiq10x || 0,
        cachedLevels?.shortLiq20x || 0,
        cachedLevels?.shortLiq50x || 0,
      ];
    };
  },
};

export default LiquidationLevelsIndicator;
