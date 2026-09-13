import React, { useMemo } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid,
} from 'recharts';
import { TrendingUp, TrendingDown } from 'lucide-react';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload || !payload.length) return null;
  return (
    <div style={{
      background: 'rgba(0,18,36,0.95)',
      border: '1px solid rgba(0,212,255,0.3)',
      borderRadius: '3px',
      padding: '6px 10px',
      fontFamily: "'Share Tech Mono', monospace",
      fontSize: 10,
      color: '#00d4ff',
    }}>
      <div style={{ color: 'rgba(0,212,255,0.6)', fontSize: 9 }}>{label}</div>
      <div style={{ color: '#00d4ff', fontWeight: 700 }}>{payload[0]?.value?.toFixed(2)}</div>
    </div>
  );
};

/**
 * LiveChart — Recharts AreaChart for stock/crypto price history
 * Accepts data array: [{time: "10:00", price: 45000}, ...]
 */
const LiveChart = ({ data = [], ticker = '', currency = '$', isUp = true }) => {
  const color  = isUp ? '#00ff88' : '#ff4757';
  const gradId = `grad_${ticker.replace(/[^a-z0-9]/gi, '')}`;

  // Normalize data
  const chartData = useMemo(() => {
    if (!data || data.length === 0) {
      // Generate dummy sine-wave if no real data
      return Array.from({ length: 24 }, (_, i) => ({
        time: `${i}:00`,
        price: 100 + Math.sin(i * 0.5) * 10 + Math.random() * 5,
      }));
    }
    return data;
  }, [data]);

  const minPrice = Math.min(...chartData.map(d => d.price)) * 0.998;
  const maxPrice = Math.max(...chartData.map(d => d.price)) * 1.002;

  return (
    <div
      className="mt-2"
      style={{
        background: 'linear-gradient(135deg, rgba(0,18,36,0.97), rgba(0,10,22,0.97))',
        border: `1px solid ${isUp ? 'rgba(0,255,136,0.25)' : 'rgba(255,71,87,0.25)'}`,
        borderRadius: '4px',
        padding: '12px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {isUp
            ? <TrendingUp style={{ width: 12, height: 12, color }} />
            : <TrendingDown style={{ width: 12, height: 12, color }} />
          }
          <span style={{ fontFamily: "'Orbitron', monospace", fontSize: 10, color, letterSpacing: '1px' }}>
            {ticker}
          </span>
          <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 9, color: 'rgba(0,212,255,0.4)', letterSpacing: '1px' }}>
            24H CHART
          </span>
        </div>
        <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 9, color: 'var(--text-muted)', letterSpacing: '1px' }}>
          {currency}
        </span>
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={80}>
        <AreaChart data={chartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor={color} stopOpacity={0.35} />
              <stop offset="100%" stopColor={color} stopOpacity={0.01} />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="2 8"
            stroke="rgba(0,212,255,0.07)"
            vertical={false}
          />
          <XAxis
            dataKey="time"
            tick={{ fill: 'rgba(0,212,255,0.3)', fontSize: 7, fontFamily: "'Share Tech Mono', monospace" }}
            axisLine={false}
            tickLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            domain={[minPrice, maxPrice]}
            tick={{ fill: 'rgba(0,212,255,0.3)', fontSize: 7, fontFamily: "'Share Tech Mono', monospace" }}
            axisLine={false}
            tickLine={false}
            width={50}
            tickFormatter={v => v.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="price"
            stroke={color}
            strokeWidth={1.5}
            fill={`url(#${gradId})`}
            dot={false}
            activeDot={{ r: 3, fill: color, strokeWidth: 0 }}
          />
        </AreaChart>
      </ResponsiveContainer>

      {/* Scan line decoration */}
      <div className="scan-line" style={{ bottom: 0, top: 'auto', opacity: 0.3 }} />
    </div>
  );
};

export default LiveChart;
