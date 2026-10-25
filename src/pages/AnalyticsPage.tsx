import { useCallback, useMemo, useState } from 'react'
import { api } from '../services/api'
import type { Metric, Percentiles } from '../types/api'
import { useApiQuery } from '../hooks/useApiQuery'
import { MetricChart, NetworkChart } from '../components/Charts'
import { Icon } from '../components/Icon'
import { Button, EmptyState, LoadState, PageHeader, Panel, SelectField, StatCard, Tag } from '../components/UI'
import { formatDate, formatPercentile, getDistinct } from '../utils/format'

export function AnalyticsPage() {
  const inventory = useApiQuery(api.inventory, 'analytics-inventory')
  const fleet = useApiQuery(api.fleetMetrics, 'analytics-fleet')
  const [selectedId, setSelectedId] = useState(() => new URLSearchParams(window.location.search).get('resource') ?? '')
  const [region, setRegion] = useState('All regions')
  const [environment, setEnvironment] = useState('All environments')
  const [team, setTeam] = useState('All teams')
  const resources = useMemo(() => inventory.data ?? [], [inventory.data])
  const visibleResources = useMemo(() => resources.filter((resource) =>
    (region === 'All regions' || resource.region === region) &&
    (environment === 'All environments' || resource.environment === environment) &&
    (team === 'All teams' || resource.owner === team),
  ), [resources, region, environment, team])

  const selectedResource = visibleResources.find((resource) => resource.resource_id === selectedId) ?? visibleResources[0]
  const activeId = selectedResource?.resource_id ?? ''

  const loadMetrics = useCallback(async () => {
      if (!activeId) return { history: [] as Metric[], percentiles: null as Percentiles | null, anomalies: [] as Metric[] }
      const [history, percentiles, anomalies] = await Promise.all([
        api.metrics(activeId), api.percentiles(activeId), api.anomalies(),
      ])
      return { history, percentiles, anomalies: anomalies.filter((item) => item.resource_id === activeId) }
  }, [activeId])
  const metrics = useApiQuery(loadMetrics, activeId)
  const selected = selectedResource
  const latest = metrics.data?.history.at(-1)
  const visibleFleet = (fleet.data?.resources ?? []).filter((resource) =>
    (region === 'All regions' || resource.region === region) &&
    (environment === 'All environments' || resource.environment === environment) &&
    (team === 'All teams' || resource.owner === team),
  )
  const fleetAverage = (key: 'avg_cpu' | 'avg_memory' | 'avg_disk' | 'avg_network_in' | 'avg_network_out') => {
    const values = visibleFleet.map((resource) => resource[key]).filter((value): value is number => value != null)
    return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0
  }

  return (
    <>
      <PageHeader eyebrow="UTILIZATION & PERFORMANCE" title="Resource analytics" description="Inspect utilization over time, compare percentiles, and identify unusual readings before changing capacity." action={<Button variant="secondary" onClick={() => void metrics.reload()} disabled={metrics.loading}><Icon name="clock" size={15} /> Refresh metrics</Button>} />
      <LoadState loading={inventory.loading} error={inventory.error} onRetry={() => void inventory.reload()} />
      <LoadState loading={fleet.loading} error={fleet.error} onRetry={() => void fleet.reload()} />
      {inventory.data && (
        <>
          <div className="analytics-filters">
            <SelectField ariaLabel="Filter analytics by region" value={region} onChange={setRegion} options={['All regions', ...getDistinct(resources, (item) => item.region)]} />
            <SelectField ariaLabel="Filter analytics by environment" value={environment} onChange={setEnvironment} options={['All environments', ...getDistinct(resources, (item) => item.environment)]} />
            <SelectField ariaLabel="Filter analytics by team" value={team} onChange={setTeam} options={['All teams', ...getDistinct(resources, (item) => item.owner)]} />
            <SelectField label="Resource" ariaLabel="Select resource" value={activeId} onChange={setSelectedId} options={visibleResources.length ? visibleResources.map((resource) => resource.resource_id) : ['']} />
          </div>
          {fleet.data && (
            <>
              <div className="stat-grid stat-grid-four">
                <StatCard label="Fleet average CPU" value={`${fleetAverage('avg_cpu').toFixed(1)}%`} caption="30-day average" icon="cpu" tone="blue" />
                <StatCard label="Fleet average memory" value={`${fleetAverage('avg_memory').toFixed(1)}%`} caption="30-day average" icon="analytics" tone="violet" />
                <StatCard label="Fleet average storage" value={`${fleetAverage('avg_disk').toFixed(1)}%`} caption="30-day average" icon="inventory" tone="amber" />
                <StatCard label="Network in / out" value={`${fleetAverage('avg_network_in').toFixed(1)} / ${fleetAverage('avg_network_out').toFixed(1)} MB`} caption="Per 15-minute interval, fleet average" icon="cloud" tone="green" />
              </div>
              <Panel title="Fleet utilization" subtitle={`30-day averages and peak readings · ${visibleFleet.length} resources match these filters`}>
                <div className="table-scroll">
                  <table className="data-table">
                    <thead><tr><th>Resource</th><th>Environment</th><th>Owner</th><th>CPU avg / p95</th><th>Memory avg / p95</th><th>Disk avg</th><th>Network in / out</th><th>Samples</th></tr></thead>
                    <tbody>{visibleFleet.map((resource) => (
                      <tr key={resource.resource_id} className="clickable-row" onClick={() => setSelectedId(resource.resource_id)}>
                        <td><strong>{resource.name}</strong><span className="table-subtext">{resource.resource_id}</span></td>
                        <td>{resource.environment}</td><td>{resource.owner}</td>
                        <td>{resource.avg_cpu?.toFixed(1) ?? '—'}% / {resource.p95_cpu?.toFixed(1) ?? '—'}%</td>
                        <td>{resource.avg_memory?.toFixed(1) ?? '—'}% / {resource.p95_memory?.toFixed(1) ?? '—'}%</td>
                        <td>{resource.avg_disk?.toFixed(1) ?? '—'}%</td>
                        <td>{resource.avg_network_in?.toFixed(1) ?? '—'} / {resource.avg_network_out?.toFixed(1) ?? '—'} MB</td>
                        <td>{resource.sample_count?.toLocaleString('en-IN') ?? '—'}</td>
                      </tr>
                    ))}</tbody>
                  </table>
                </div>
              </Panel>
            </>
          )}
          {selected && <div className="selected-resource-strip"><span><Icon name="cpu" size={17} />{selected.name}</span><span>{selected.region}</span><Tag tone="blue">{selected.environment}</Tag><span>Owned by {selected.owner}</span></div>}
          <LoadState loading={metrics.loading} error={metrics.error} onRetry={() => void metrics.reload()} />
          {metrics.data && selected && (
            <>
              <div className="stat-grid stat-grid-four">
                <StatCard label="Latest CPU" value={latest ? `${latest.cpu_pct.toFixed(1)}%` : 'Unavailable'} caption="Recent measurement" icon="cpu" tone="blue" />
                <StatCard label="Latest memory" value={latest ? `${latest.memory_pct.toFixed(1)}%` : 'Unavailable'} caption="Recent measurement" icon="analytics" tone="violet" />
                <StatCard label="Latest disk" value={latest ? `${latest.disk_pct.toFixed(1)}%` : 'Unavailable'} caption="Recent measurement" icon="inventory" tone="amber" />
                <StatCard label="Network in / out" value={latest ? `${latest.network_in_mb.toFixed(1)} / ${latest.network_out_mb.toFixed(1)} MB` : 'Unavailable'} caption="Latest reading" icon="cloud" tone="green" />
              </div>
              <Panel title="30-day utilization history" subtitle="CPU, memory, and disk usage from the complete simulator time series" action={<Tag>{metrics.data.history.length.toLocaleString('en-IN')} readings</Tag>}>
                {metrics.data.history.length ? <MetricChart data={metrics.data.history} /> : <EmptyState title="No metrics found" message="The selected resource does not yet have utilization history." icon="analytics" />}
              </Panel>
              <Panel title="Network history" subtitle="Inbound and outbound MB per 15-minute interval">
                <NetworkChart data={metrics.data.history} />
              </Panel>
              <div className="content-grid-two">
                <Panel title="Peak-aware sizing" subtitle="Percentiles give context beyond average utilization">
                  {metrics.data.percentiles ? (
                    <div className="percentile-grid">
                      <div><span>p95 CPU</span><strong>{formatPercentile(metrics.data.percentiles.p95_cpu)}</strong></div><div><span>p99 CPU</span><strong>{formatPercentile(metrics.data.percentiles.p99_cpu)}</strong></div>
                      <div><span>p95 memory</span><strong>{formatPercentile(metrics.data.percentiles.p95_memory)}</strong></div><div><span>p99 memory</span><strong>{formatPercentile(metrics.data.percentiles.p99_memory)}</strong></div>
                    </div>
                  ) : <EmptyState title="No percentile data" message="Percentiles will be available once the resource has metrics." icon="analytics" />}
                  <div className="assumption-note compact-note"><Icon name="assistant" size={15} /><span>Use p95/p99 values to sanity-check resizing recommendations against peak load.</span></div>
                </Panel>
                <Panel title="Anomalies" subtitle="High-utilization events for this resource">
                  {metrics.data.anomalies.length ? <div className="anomaly-list">{metrics.data.anomalies.map((item, index) => <div className="anomaly-row" key={`${item.timestamp}-${index}`}><span className="anomaly-point" /><div><strong>{item.cpu_pct}% CPU · {item.memory_pct}% memory</strong><span>{formatDate(item.timestamp)}</span></div><Tag tone="danger">Anomaly</Tag></div>)}</div> : <EmptyState title="No anomalies detected" message="No unusual utilization events are recorded for this resource." icon="overview" />}
                </Panel>
              </div>
            </>
          )}
        </>
      )}
    </>
  )
}
