import { useCallback } from 'react'
import { api } from '../services/api'
import { useApiQuery } from '../hooks/useApiQuery'
import { Icon } from '../components/Icon'
import { LoadState, PageHeader, Panel, StatCard, Tag } from '../components/UI'
import { formatCurrency } from '../utils/format'

export function ForecastPage() {
  const loadForecast = useCallback(async () => {
    const [cost, trend] = await Promise.all([api.costForecast(), api.forecast()])
    return { cost, trend }
  }, [])
  const query = useApiQuery(loadForecast, 'forecast')
  const data = query.data
  const forecastValues = data ? [
    ['Now', data.cost.current_monthly_spend],
    ['30 days', data.cost.forecast_30_days],
    ['60 days', data.cost.forecast_60_days],
    ['90 days', data.cost.forecast_90_days],
  ] as const : []
  const forecastMax = Math.max(data?.cost.current_monthly_spend ?? 0, data?.cost.forecast_30_days ?? 0, data?.cost.forecast_60_days ?? 0, data?.cost.forecast_90_days ?? 0, 1)
  return (
    <>
      <PageHeader eyebrow="PLAN AHEAD" title="Spend forecast" description="A near-term view of projected costs and the operating decisions that can help keep growth predictable." action={<button type="button" className="text-action" onClick={() => void query.reload()} disabled={query.loading}><Icon name="clock" size={15} /> Refresh forecast</button>} />
      <LoadState loading={query.loading} error={query.error} onRetry={() => void query.reload()} />
      {data && (
        <>
          <div className="stat-grid stat-grid-four">
            <StatCard label="Current monthly spend" value={formatCurrency(data.cost.current_monthly_spend)} icon="costs" />
            <StatCard label="30-day projection" value={formatCurrency(data.cost.forecast_30_days)} caption="Estimated next month" icon="forecast" tone="blue" />
            <StatCard label="60-day projection" value={formatCurrency(data.cost.forecast_60_days)} caption="Estimated in two months" icon="forecast" tone="violet" />
            <StatCard label="90-day projection" value={formatCurrency(data.cost.forecast_90_days)} caption="Estimated in three months" icon="forecast" tone="amber" />
          </div>
          <Panel title="Projected monthly spend" subtitle="Backend forecast at 30, 60, and 90 days">
            <div className="forecast-chart" role="img" aria-label="Projected monthly spend bar chart. Horizontal axis is forecast period; vertical axis is monthly spend in Indian rupees. Hover a bar for its value.">
              <span className="forecast-y-axis-title">Monthly spend (INR)</span>
              <div className="forecast-y-axis-ticks" aria-hidden="true"><span>{formatCurrency(forecastMax, true)}</span><span>{formatCurrency(forecastMax / 2, true)}</span><span>₹0</span></div>
              <div className="forecast-chart-columns">
                {forecastValues.map(([period, value]) => <div className="forecast-chart-column" key={period}><strong>{formatCurrency(value, true)}</strong><span className="forecast-chart-bar" title={`${period}: ${formatCurrency(value)} monthly spend`} style={{ height: `${Math.max(value / forecastMax * 100, 8)}%` }} /><small>{period}</small></div>)}
              </div>
              <span className="forecast-x-axis-title">Forecast period</span>
            </div>
          </Panel>
          <Panel title="Usage trend" subtitle="Based on current utilization and forecast signals">
            <div className="trend-insight"><span className={`trend-icon ${data.trend.trend.toLowerCase()}`}><Icon name="forecast" size={21} /></span><div><Tag tone={data.trend.trend.toLowerCase() === 'increasing' ? 'amber' : 'success'}>{data.trend.trend} trend</Tag><h2>Projected utilization change: {data.trend.projected_growth_rate_pct}%</h2><p>{data.trend.recommendation}</p><small>{data.trend.method}</small></div></div>
            <div className="assumption-note"><Icon name="assistant" size={15} /><span>{data.cost.method ?? 'Projection based on simulated inventory data, not a guaranteed bill.'} Actual spend changes require provider billing and pricing data.</span></div>
          </Panel>
        </>
      )}
    </>
  )
}
