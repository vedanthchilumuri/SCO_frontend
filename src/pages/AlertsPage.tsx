import { api } from '../services/api'
import { useApiQuery } from '../hooks/useApiQuery'
import { Icon } from '../components/Icon'
import { EmptyState, LoadState, PageHeader, Panel, Tag } from '../components/UI'
import { formatDate } from '../utils/format'
import { navigateTo } from '../utils/navigation'

function alertDestination(alertId: string, type?: string) {
  const resourceMatch = /^(?:anomaly|capacity)-(.+)$/.exec(alertId)
  if (resourceMatch) return `/analytics?resource=${encodeURIComponent(resourceMatch[1])}`
  if (type?.includes('recommendation')) return '/recommendations'
  if (type?.includes('budget')) return '/costs'
  if (type?.includes('cost-trend')) return '/forecast'
  return '/recommendations'
}

export function AlertsPage() {
  const query = useApiQuery(api.alerts, 'alerts')
  const alerts = query.data ?? []
  const high = alerts.filter((alert) => alert.severity.toLowerCase() === 'high').length
  return (
    <>
      <PageHeader eyebrow="OBSERVABILITY" title="Alert center" description="Usage events that may signal a capacity issue, an unusual spike, or a resource that needs investigation." action={<button type="button" className="text-action" onClick={() => void query.reload()} disabled={query.loading}><Icon name="clock" size={15} /> Refresh alerts</button>} />
      <LoadState loading={query.loading} error={query.error} onRetry={() => void query.reload()} />
      {query.data && (
        <>
          <div className="alert-summary"><span className="alert-summary-icon"><Icon name="alerts" size={19} /></span><div><strong>{alerts.length} active alerts</strong><span>{high} high severity · investigate before capacity is affected</span></div><Tag tone={high ? 'danger' : 'success'}>{high ? 'Attention needed' : 'No critical alerts'}</Tag></div>
          <Panel title="Recent activity" subtitle="Each alert includes the reason it was raised">
            {alerts.length ? <div className="alert-list">{alerts.map((alert) => {
              const destination = alertDestination(alert.alert_id, alert.type)
              return <a className="alert-card" href={destination} key={alert.alert_id} aria-label={`Investigate alert: ${alert.message}`} onClick={(event) => { event.preventDefault(); navigateTo(destination) }}><span className={`alert-severity-dot ${alert.severity.toLowerCase()}`} /><span className="alert-card-content"><span className="alert-card-title"><Tag tone={alert.severity.toLowerCase() === 'high' ? 'danger' : 'amber'}>{alert.severity} severity</Tag><Tag>{alert.type ?? 'Usage alert'}</Tag><span>{formatDate(alert.timestamp)}</span></span><strong className="alert-card-message">{alert.message}</strong><span className="alert-card-reason">{alert.reason ?? 'Review recent metrics and investigate before making a change.'}</span></span><Icon className="alert-card-icon" name="chevron" size={16} /></a>
            })}</div> : <EmptyState title="All clear" message="No active alerts were returned by the backend." icon="overview" />}
          </Panel>
        </>
      )}
    </>
  )
}
