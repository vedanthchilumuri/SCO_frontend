import type { Metric } from '../types/api'

const plot = { left: 56, right: 586, top: 18, bottom: 150 }

function chartPoints(data: Metric[]) {
  const points = data.slice(-2880)
  const stride = Math.max(1, Math.ceil(points.length / 120))
  return points.filter((_, index) => index % stride === 0 || index === points.length - 1)
}

function timeLabel(timestamp: string) {
  const date = new Date(timestamp)
  return Number.isNaN(date.getTime()) ? timestamp : date.toLocaleString()
}

function timeAxisLabel(timestamp: string) {
  const date = new Date(timestamp)
  return Number.isNaN(date.getTime())
    ? timestamp
    : date.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export function MetricChart({ data }: { data: Metric[] }) {
  if (!data.length) return <div className="chart-empty">Utilization history will appear when metrics are available.</div>
  const points = chartPoints(data)
  const x = (index: number) => plot.left + (index / Math.max(points.length - 1, 1)) * (plot.right - plot.left)
  const y = (value: number) => plot.bottom - (Math.min(Math.max(value, 0), 100) / 100) * (plot.bottom - plot.top)
  const line = (key: 'cpu_pct' | 'memory_pct' | 'disk_pct') =>
    points.map((point, index) => {
      return `${x(index)},${y(point[key])}`
    }).join(' ')
  return (
    <div className="chart-wrap">
      <div className="chart-legend"><span><i className="legend-cpu" />CPU</span><span><i className="legend-memory" />Memory</span><span><i className="legend-disk" />Disk</span></div>
      <svg className="line-chart" viewBox="0 0 600 190" role="img" aria-label="CPU, memory and disk utilization history. Horizontal axis is time; vertical axis is utilization percentage. Hover a point for its timestamp and value.">
        {[0, 25, 50, 75, 100].map((tick) => {
          const tickY = y(tick)
          return <g key={tick}><line x1={plot.left} x2={plot.right} y1={tickY} y2={tickY} className="chart-grid" /><text x={plot.left - 8} y={tickY + 3} className="chart-label chart-label-y" textAnchor="end">{tick}%</text></g>
        })}
        <line x1={plot.left} x2={plot.right} y1={plot.bottom} y2={plot.bottom} className="chart-axis-line" />
        {[0, 0.5, 1].map((position) => {
          const index = Math.round((points.length - 1) * position)
          return <text key={position} x={x(index)} y="168" className="chart-label" textAnchor={position === 0 ? 'start' : position === 1 ? 'end' : 'middle'}>{timeAxisLabel(points[index].timestamp)}</text>
        })}
        <text x="12" y="84" className="chart-axis-title" textAnchor="middle" transform="rotate(-90 12 84)">Utilization (%)</text>
        <text x="320" y="186" className="chart-axis-title" textAnchor="middle">Time</text>
        <polyline points={line('disk_pct')} className="chart-line chart-line-disk" />
        <polyline points={line('memory_pct')} className="chart-line chart-line-memory" />
        <polyline points={line('cpu_pct')} className="chart-line chart-line-cpu" />
        {(['disk_pct', 'memory_pct', 'cpu_pct'] as const).map((key) => points.map((point, index) => <circle key={`${key}-${index}`} cx={x(index)} cy={y(point[key])} r="3.2" className={`chart-point chart-point-${key}`}><title>{`${timeLabel(point.timestamp)} · ${key.replace('_pct', '').toUpperCase()}: ${point[key].toFixed(1)}%`}</title></circle>))}
      </svg>
    </div>
  )
}

export function NetworkChart({ data }: { data: Metric[] }) {
  if (!data.length) return <div className="chart-empty">Network history will appear when metrics are available.</div>
  const points = chartPoints(data)
  const max = Math.max(...points.flatMap((point) => [point.network_in_mb, point.network_out_mb]), 1)
  const x = (index: number) => plot.left + (index / Math.max(points.length - 1, 1)) * (plot.right - plot.left)
  const y = (value: number) => plot.bottom - (Math.min(Math.max(value, 0), max) / max) * (plot.bottom - plot.top)
  const line = (key: 'network_in_mb' | 'network_out_mb') =>
    points.map((point, index) => {
      return `${x(index)},${y(point[key])}`
    }).join(' ')
  return (
    <div className="chart-wrap">
      <div className="chart-legend"><span><i className="legend-cpu" />Inbound MB / 15 min</span><span><i className="legend-memory" />Outbound MB / 15 min</span></div>
      <svg className="line-chart" viewBox="0 0 600 190" role="img" aria-label="Network traffic history. Horizontal axis is time; vertical axis is megabytes per 15-minute interval. Hover a point for its timestamp and value.">
        {[0, 0.25, 0.5, 0.75, 1].map((fraction) => {
          const tickY = y(max * fraction)
          return <g key={fraction}><line x1={plot.left} x2={plot.right} y1={tickY} y2={tickY} className="chart-grid" /><text x={plot.left - 8} y={tickY + 3} className="chart-label chart-label-y" textAnchor="end">{(max * fraction).toFixed(1)}</text></g>
        })}
        <line x1={plot.left} x2={plot.right} y1={plot.bottom} y2={plot.bottom} className="chart-axis-line" />
        {[0, 0.5, 1].map((position) => {
          const index = Math.round((points.length - 1) * position)
          return <text key={position} x={x(index)} y="168" className="chart-label" textAnchor={position === 0 ? 'start' : position === 1 ? 'end' : 'middle'}>{timeAxisLabel(points[index].timestamp)}</text>
        })}
        <text x="12" y="84" className="chart-axis-title" textAnchor="middle" transform="rotate(-90 12 84)">MB / 15 min</text>
        <text x="320" y="186" className="chart-axis-title" textAnchor="middle">Time</text>
        <polyline points={line('network_in_mb')} className="chart-line chart-line-cpu" />
        <polyline points={line('network_out_mb')} className="chart-line chart-line-memory" />
        {(['network_in_mb', 'network_out_mb'] as const).map((key) => points.map((point, index) => <circle key={`${key}-${index}`} cx={x(index)} cy={y(point[key])} r="3.2" className={`chart-point chart-point-${key}`}><title>{`${timeLabel(point.timestamp)} · ${key === 'network_in_mb' ? 'Inbound' : 'Outbound'}: ${point[key].toFixed(2)} MB`}</title></circle>))}
      </svg>
    </div>
  )
}

export function Bars({ values, color = 'violet' }: { values: { label: string; value: number }[]; color?: string }) {
  const max = Math.max(...values.map((item) => item.value), 1)
  return (
    <div className="bars-list" role="img" aria-label="Horizontal bar chart by category, measured in Indian rupees per month">
      <div className="bar-axis-title">Category</div>
      {values.map((item) => (
        <div className="bar-row" key={item.label}>
          <div className="bar-caption"><span>{item.label}</span><strong>{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(item.value)}</strong></div>
          <div className="bar-track" title={`${item.label}: ${new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(item.value)} per month`}><span className={`bar-fill bar-${color}`} style={{ width: `${Math.max((item.value / max) * 100, 2)}%` }} /></div>
        </div>
      ))}
      <div className="bar-x-axis"><span>₹0</span><span>{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(max)}</span></div>
      <div className="bar-axis-title">Monthly amount (INR)</div>
    </div>
  )
}
