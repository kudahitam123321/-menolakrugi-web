// src/components/mr/TradingViewWidget.tsx
import React, { useEffect, useRef, memo } from 'react';
import { MR } from '../../lib/theme';

function TradingViewWidget() {
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!container.current) return;
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
        "backgroundColor": "#0F0F0F",
        "widgetFontColor": "#DBDBDB",
        "upColor": "#22ab94",
        "downColor": "#f7525f",
        "borderUpColor": "#22ab94",
        "borderDownColor": "#f7525f",
        "wickUpColor": "#22ab94",
        "wickDownColor": "#f7525f",
        "colorTheme": "dark",
        "isTransparent": false,
        "locale": "en",
        "chartOnly": false,
        "scalePosition": "right",
        "scaleMode": "Normal",
        "fontFamily": "-apple-system, BlinkMacSystemFont, Trebuchet MS, Roboto, Ubuntu, sans-serif",
        "valuesTracking": "1",
        "changeMode": "price-and-percent",
        "symbols": [
          ["FOREXCOM:XAUUSD|3M"],
          ["FOREXCOM:NAS100|3M"],
          ["FOREXCOM:US30|3M"],
          ["FOREXCOM:GBPUSD|3M"]
        ],
        "dateRanges": [
          "1d|15",
          "3m|60",
          "12m|1D",
          "60m|1W",
          "all|1M"
        ],
        "fontSize": "10",
        "headerFontSize": "medium",
        "autosize": true,
        "width": "100%",
        "height": "100%",
        "noTimeScale": false,
        "hideDateRanges": false,
        "hideMarketStatus": false,
        "hideSymbolLogo": false
      }`;

    container.current.appendChild(script);

    return () => {
      if (container.current) {
        container.current.innerHTML = '';
      }
    };
  }, []);

  return (
    <div style={{
      border: `1px solid ${MR.border}`,
      background: '#0F0F0F',
      display: 'flex',
      flexDirection: 'column',
      width: '100%',
      height: '100%',
    }}>
      {/* Header label */}
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
        <span>◉ LIVE MARKET · XAUUSD · NAS100 · US30 · GBPUSD</span>
        <span style={{ color: '#22ab94' }}>● REALTIME</span>
      </div>

      {/* Widget — autosize mengisi sisa ruang */}
      <div
        className="tradingview-widget-container"
        ref={container}
        style={{ flex: 1, width: '100%', minHeight: 0 }}
      >
        <div className="tradingview-widget-container__widget" style={{ height: '100%', width: '100%' }} />
        <div className="tradingview-widget-copyright">
          <a href="https://www.tradingview.com/markets/" rel="noopener nofollow" target="_blank">
            <span className="blue-text" style={{ color: MR.dim, fontSize: 10, fontFamily: MR.mono }}>World markets</span>
          </a>
          <span style={{ color: MR.dimmer, fontSize: 10, fontFamily: MR.mono }}> by TradingView</span>
        </div>
      </div>
    </div>
  );
}

export default memo(TradingViewWidget);
