export function navigateTo(path: string) {
  window.history.pushState({}, '', path)
  window.dispatchEvent(new PopStateEvent('popstate'))
}

export interface WorkspaceNavItem {
  path: string
  label: string
  icon: string
}

export const workspaceNavigation: { heading: string; items: WorkspaceNavItem[] }[] = [
  { heading: 'WORKSPACE', items: [
    { path: '/', label: 'Overview', icon: 'overview' },
    { path: '/inventory', label: 'Resource inventory', icon: 'inventory' },
    { path: '/analytics', label: 'Utilization', icon: 'analytics' },
    { path: '/recommendations', label: 'Recommendations', icon: 'recommendations' },
  ] },
  { heading: 'FINANCIAL CONTROL', items: [
    { path: '/costs', label: 'Cost analysis', icon: 'costs' },
    { path: '/forecast', label: 'Forecast', icon: 'forecast' },
    { path: '/alerts', label: 'Alerts', icon: 'alerts' },
    { path: '/simulator', label: 'What-if simulator', icon: 'simulator' },
  ] },
  { heading: 'TOOLS', items: [
    { path: '/assistant', label: 'AI explain', icon: 'assistant' },
    { path: '/export', label: 'Export center', icon: 'export' },
    { path: '/sustainability', label: 'Sustainability', icon: 'leaf' },
    { path: '/company', label: 'Company', icon: 'building' },
  ] },
]

export function getNavigationForRole(role: string) {
  const normalizedRole = role.toLowerCase()
  const allowedPaths = normalizedRole.includes('finance')
    ? new Set(['/', '/costs', '/forecast', '/export', '/sustainability', '/company'])
    : normalizedRole.includes('leadership')
      ? new Set(['/', '/costs', '/forecast', '/alerts', '/export', '/sustainability', '/company'])
      : null
  return allowedPaths
    ? workspaceNavigation.map((group) => ({ ...group, items: group.items.filter((item) => allowedPaths.has(item.path)) })).filter((group) => group.items.length)
    : workspaceNavigation
}
