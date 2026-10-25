import { useState } from 'react'
import { api } from '../services/api'
import type { Recommendation } from '../types/api'
import { useApiQuery } from '../hooks/useApiQuery'
import { Icon } from '../components/Icon'
import { Button, EmptyState, LoadState, PageHeader, Panel, Tag } from '../components/UI'
import { useToast } from '../hooks/useToast'
import { formatCurrency, recommendationSavingsByEnvironment, riskTone, sumRecommendationSavings } from '../utils/format'

export function RecommendationsPage() {
  const query = useApiQuery(api.recommendations, 'recommendations')
  const toast = useToast()
  const [busyId, setBusyId] = useState<string>()
  const [batchBusy, setBatchBusy] = useState(false)
  const [optimizationBudget, setOptimizationBudget] = useState('100000')
  const [optimization, setOptimization] = useState<{
    summary: { candidate_count: number; selected_count: number; total_savings: number; max_budget: number }
    recommendations: Array<{
      resource_id: string
      action: string
      target_configuration?: string | null
      estimated_savings: number
      confidence: number
      risk_level: string
      reason: string
    }>
  }>()
  const [optimizerBusy, setOptimizerBusy] = useState(false)
  const [optimizerError, setOptimizerError] = useState<string>()
  const recommendations = query.data ?? []
  const pending = recommendations.filter((item) => item.status.toLowerCase() === 'pending')
  const pendingSavings = sumRecommendationSavings(pending)
  const savingsByEnvironment = recommendationSavingsByEnvironment(pending)

  async function update(item: Recommendation, status: 'Applied' | 'Dismissed') {
    setBusyId(item.rec_id)
    try {
      const result = await api.updateRecommendation(item.rec_id, status)
      if (!result.success || result.updated < 1) throw new Error('The recommendation was not updated.')
      query.setData((current) => current?.map((row) => row.rec_id === item.rec_id ? { ...row, status } : row))
      toast(status === 'Applied' ? 'Recommendation marked as applied.' : 'Recommendation dismissed.', 'success')
    } catch (cause) {
      toast(cause instanceof Error ? cause.message : 'Could not update the recommendation.', 'error')
    } finally {
      setBusyId(undefined)
    }
  }

  async function applyAll() {
    if (!pending.length) return
    setBatchBusy(true)
    try {
      const result = await api.batchApplyRecommendations(pending.map((item) => item.rec_id))
      if (!result.success) throw new Error('The recommendations were not applied.')
      if (result.applied_count !== pending.length) {
        toast(`${result.applied_count} of ${pending.length} recommendations were applied. Refresh to verify remaining items.`, 'info')
        void query.reload()
        return
      }
      query.setData((current) => current?.map((item) => item.status.toLowerCase() === 'pending' ? { ...item, status: 'Applied' } : item))
      const savings = result.total_estimated_savings || sumRecommendationSavings(pending)
      toast(`${result.applied_count} recommendations applied. Estimated savings: ${formatCurrency(savings)} / month.`)
    } catch (cause) {
      toast(cause instanceof Error ? cause.message : 'Could not apply recommendations.', 'error')
    } finally {
      setBatchBusy(false)
    }
  }

  async function runOptimizer() {
    setOptimizerBusy(true)
    setOptimizerError(undefined)
    try {
      setOptimization(await api.runOptimization(Number(optimizationBudget)))
    } catch (cause) {
      setOptimizerError(cause instanceof Error ? cause.message : 'Could not run the optimizer.')
    } finally {
      setOptimizerBusy(false)
    }
  }

  return (
    <>
      <PageHeader eyebrow="SAFE, ACTIONABLE CHANGES" title="Recommendations" description="Optimization ideas are tied to observed usage. Review peak utilization and risk before you decide what to change." action={<Button onClick={() => void applyAll()} disabled={!pending.length || batchBusy || query.loading}>{batchBusy && <span className="button-spinner" />}Mark all reviewed as applied</Button>} />
      <LoadState loading={query.loading} error={query.error} onRetry={() => void query.reload()} />
      {query.data && (
        <>
          <div className="recommendation-summary">
            <div><span>Potential monthly savings</span><strong>{formatCurrency(pendingSavings)}</strong><small>Across {pending.length} pending recommendations</small></div>
            <div><span>Awaiting review</span><strong>{pending.length}</strong><small>Applied or dismissed ideas are retained below</small></div>
            <div><span>Monthly savings by environment</span>{Object.entries(savingsByEnvironment).map(([environmentName, amount]) => <small key={environmentName}>{environmentName}: {formatCurrency(amount)}</small>)}</div>
            <div className="recommendation-caveat"><Icon name="assistant" size={18} /><p>Check resize advice against p95 and p99 usage, not averages alone. Apply changes through your normal rollout process.</p></div>
          </div>
          <Panel title="Optimization engine" subtitle="Run peak-aware candidate scoring against a review budget. This is a proposal, not an infrastructure action.">
            <div className="inventory-filters optimizer-controls">
              <label className="form-field"><span>Selection budget (INR)</span><input type="number" min="1" step="1000" value={optimizationBudget} onChange={(event) => setOptimizationBudget(event.target.value)} /></label>
              <Button onClick={() => void runOptimizer()} disabled={optimizerBusy || !Number(optimizationBudget)}>{optimizerBusy && <span className="button-spinner" />}Run optimizer</Button>
            </div>
            {optimizerError && <div className="form-error" role="alert">{optimizerError}</div>}
            {optimization && (
              <>
                <p>{optimization.summary.selected_count} of {optimization.summary.candidate_count} candidates fit the budget; selected estimated savings: {formatCurrency(optimization.summary.total_savings)} / month.</p>
                <div className="recommendation-list">{optimization.recommendations.map((item) => (
                  <article className="recommendation-card" key={item.resource_id}>
                    <div className="recommendation-detail"><div className="recommendation-title"><h3>{item.action}</h3><Tag tone={riskTone(item.risk_level)}>{item.risk_level} risk</Tag></div><p>{item.reason}</p><div className="recommendation-tags"><span>{item.resource_id}</span>{item.target_configuration && <Tag>Target: {item.target_configuration}</Tag>}<Tag>{item.confidence}% confidence</Tag></div></div>
                    <div className="recommendation-actions"><strong>{formatCurrency(item.estimated_savings)}<small>/mo</small></strong></div>
                  </article>
                ))}</div>
              </>
            )}
          </Panel>
          <Panel title="Optimization suggestions" subtitle="Individual savings are estimates at current illustrative pricing">
            {recommendations.length ? (
              <div className="recommendation-list">
                {recommendations.map((item) => {
                  const isPending = item.status.toLowerCase() === 'pending'
                  return (
                    <article className={`recommendation-card ${!isPending ? 'recommendation-complete' : ''}`} key={item.rec_id}>
                      <div className="recommendation-icon"><Icon name={item.status.toLowerCase() === 'applied' ? 'check' : 'recommendations'} size={18} /></div>
                      <div className="recommendation-detail">
                        <div className="recommendation-title"><h3>{item.action}</h3><Tag tone={item.status.toLowerCase() === 'pending' ? 'amber' : item.status.toLowerCase() === 'applied' ? 'success' : 'neutral'}>{item.status}</Tag></div>
                        <p>{item.reason}</p>
                        <div className="recommendation-tags"><span><Icon name="cloud" size={14} />{item.resource_id}</span><Tag tone={riskTone(item.risk_level)}>{item.risk_level} risk</Tag>{item.target_configuration && <Tag>Target: {item.target_configuration}</Tag>}{item.confidence != null && <Tag>{item.confidence}% confidence</Tag>}</div>
                      </div>
                      <div className="recommendation-actions">
                        <strong>{formatCurrency(item.estimated_monthly_saving)}<small>/mo</small></strong>
                        {isPending && <div><Button size="small" variant="secondary" disabled={Boolean(busyId) || batchBusy} onClick={() => void update(item, 'Dismissed')}>{busyId === item.rec_id ? 'Saving…' : 'Dismiss'}</Button><Button size="small" disabled={Boolean(busyId) || batchBusy} onClick={() => void update(item, 'Applied')}>{busyId === item.rec_id ? 'Saving…' : 'Mark applied'}</Button></div>}
                      </div>
                    </article>
                  )
                })}
              </div>
            ) : <EmptyState title="No recommendations yet" message="Suggestions will appear here when resource usage data is available." icon="recommendations" />}
          </Panel>
        </>
      )}
    </>
  )
}
