// =====================================================================
// PATTERN BENAR untuk semua TradingView widget di React/TypeScript
// Terapkan ke: MarketOverviewWidget, SymbolOverviewWidget, dll
// =====================================================================

import { useEffect, useRef, memo } from 'react';

// ── Market Overview (Dashboard) ───────────────────────────────────────
export const MarketOverviewWidget = memo(function MarketOverviewWidget() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // WAJIB: clear dulu sebelum append script baru
    // Ini mencegah querySelector null saat re-render
    container.innerHTML = `<div class="tradingview-widget-container__widget" style="height:100%;width:100%"></div>`;

    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-market-overview.js';
    script.type = 'text/javascript';
    script.async = true;
    script.innerHTML = JSON.stringify({
      colorTheme: 'dark',
      dateRange: '12M',
      showChart: true,
      locale: 'id',
      isTransparent: true,
      showSymbolLogo: true,
      showFloatingTooltip: false,
      width: '100%',
      height: '100%',
      tabs: [
        {
          title: 'Forex',
          symbols: [
            { s: 'FX:EURUSD', d: 'EUR/USD' },
            { s: 'FX:GBPUSD', d: 'GBP/USD' },
            { s: 'FX:USDJPY', d: 'USD/JPY' },
            { s: 'FOREXCOM:XAUUSD', d: 'GOLD' },
          ],
          originalTitle: 'Forex',
        },
        {
          title: 'Indices',
          symbols: [
            { s: 'FOREXCOM:NAS100', d: 'NASDAQ 100' },
            { s: 'FOREXCOM:US30', d: 'DOW JONES' },
          ],
          originalTitle: 'Indices',
        },
        {
          title: 'Crypto',
          symbols: [
            { s: 'COINBASE:BTCUSD', d: 'Bitcoin' },
            { s: 'COINBASE:ETHUSD', d: 'Ethereum' },
          ],
          originalTitle: 'Crypto',
        },
      ],
    });

    container.appendChild(script);

    // Cleanup saat unmount
    return () => {
      container.innerHTML = '';
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="tradingview-widget-container"
      style={{ height: '100%', width: '100%' }}
    />
  );
});

// ── Symbol Overview (Landing Page) ───────────────────────────────────
export const SymbolOverviewWidget = memo(function SymbolOverviewWidget() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // WAJIB: clear + buat widget div dulu
    container.innerHTML = `<div class="tradingview-widget-container__widget"></div>`;

    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-symbol-overview.js';
    script.type = 'text/javascript';
    script.async = true;
    script.innerHTML = JSON.stringify({
      lineWidth: 2,
      lineType: 0,
      chartType: 'candlesticks',
      colorTheme: 'dark',
      isTransparent: false,
      locale: 'en',
      autosize: true,
      backgroundColor: '#0F0F0F',
      fontColor: 'rgb(106, 109, 120)',
      gridLineColor: 'rgba(242, 242, 242, 0.06)',
      upColor: '#22ab94',
      downColor: '#f7525f',
      borderUpColor: '#22ab94',
      borderDownColor: '#f7525f',
      wickUpColor: '#22ab94',
      wickDownColor: '#f7525f',
      volumeUpColor: 'rgba(34, 171, 148, 0.5)',
      volumeDownColor: 'rgba(247, 82, 95, 0.5)',
      symbols: [
        ['FOREXCOM:XAUUSD|1M'],
        ['FOREXCOM:NAS100|1M'],
        ['FOREXCOM:US30|1M'],
      ],
      dateRanges: ['1m|30', '3m|60', '12m|1D', '60m|1W', 'all|1M'],
    });

    container.appendChild(script);

    return () => {
      container.innerHTML = '';
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="tradingview-widget-container"
      style={{ width: '100%', height: '100%' }}
    />
  );
});
