// src/components/mr/TradingViewWidget.tsx
import React, { useEffect, useRef, memo } from 'react';
import { MR } from '../../lib/theme';

function TradingViewWidget() {
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!container.current) return;

    // Cegah double render (React StrictMode)
    if (container.current.querySelector('script')) return;

    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-symbol-overview.js";
    script.type = "text/javascript";
    script.async = true;
    script.innerHTML = `
      {
        "lineWidth": 2,
        "lineType": 0,
        "chartType": "candlesticks",
        "fontColor": "rgb(106, 109, 120)",
        "gridLineColor": "rgba(242, 242, 242, 0.06)",
        "volumeUpColor": "rgba(34, 171, 148, 0.5)",
        "volumeDownColor": "rgba(247, 82, 95, 0.5)",
        "backgroundColor": "#0d0d0d",
        "widgetFontColor": "#DBDBDB",
        "upColor": "#10b981",
        "downColor": "#ef4444",
        "borderUpColor": "#10b981",
        "borderDownColor": "#ef4444",
        "wickUpColor": "#10b981",
        "wickDownColor": "#ef4444",
        "colorTheme": "dark",
        "isTransparent": false,
        "locale": "en",
        "chartOnly": false,
        "scalePosition": "right",
        "scaleMode": "Normal",
        "fontFamily": "Geist Mono, monospace",
        "valuesTracking": "2",
        "changeMode": "price-and-percent",
        "symbols": [
          ["FOREXCOM:XAUUSD|1M"],
          ["FOREXCOM:NAS100|1M"],
          ["FOREXCOM:US30|1M"]
        ],
        "dateRanges": ["1m|30", "3m|60", "12m|1D", "60m|1W", "all|1M"],
        "fontSize": "10",
        "headerFontSize": "medium",
        "autosize": true,
        "noTimeScale": false,
        "hideDateRanges": false,
        "hideMarketStatus": false,
        "hideSymbolLogo": false
      }`;

    container.current.appendChild(script);

    // Cleanup saat unmount
    return () => {
      if (container.current) {
        container.current.innerHTML = '';
      }
    };
  }, []);

  return (
    <div style={{
      border: `1px solid ${MR.border}`,
      background: MR.panel,
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      minHeight: 600,
      width: '100%',
    }}>
      {/* Header */}
      <div style={{
        fontFamily: MR.mono,
        display: 'flex',
        justifyContent: 'space-between',
        padding: '10px 14px',
        borderBottom: `1px solid ${MR.border}`,
        fontSize: 11,
        color: MR.dim,
        background: MR.darker,
        flexShrink: 0,
      }}>
        <span>◉ LIVE MARKET · XAUUSD · NAS100 · US30</span>
        <span style={{ color: MR.up }}>● REALTIME</span>
      </div>

      {/* Widget container */}
      <div
        className="tradingview-widget-container"
        ref={container}
        style={{ flex: 1, width: '100%', overflow: 'hidden' }}
      >
        <div
          className="tradingview-widget-container__widget"
          style={{ height: '100%', width: '100%' }}
        />
      </div>
    </div>
  );
}

export default memo(TradingViewWidget);
