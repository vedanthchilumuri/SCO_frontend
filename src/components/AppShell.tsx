import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { Icon } from './Icon'
import type { User } from '../types/api'
import { api } from '../services/api'
import { useApiQuery } from '../hooks/useApiQuery'
import { getNavigationForRole, workspaceNavigation } from '../utils/navigation'

interface AppShellProps {
  user: User
  path: string
  navigate: (path: string) => void
  onLogout: () => void
  onToggleTheme: () => void
  dark: boolean
  children: ReactNode
}

export function AppShell({ user, path, navigate, onLogout, onToggleTheme, dark, children }: AppShellProps) {
  const activePath = path === '/' ? '/' : path
  const alerts = useApiQuery(api.alerts, 'sidebar-alerts')
  const company = useApiQuery(api.company, 'sidebar-company')
  const [companyName, setCompanyName] = useState<string>()
  const visibleNavigation = getNavigationForRole(user.role)

  useEffect(() => {
    const updateCompanyName = (event: Event) => {
      const updated = (event as CustomEvent<{ name: string }>).detail
      setCompanyName(updated.name)
    }
    window.addEventListener('sco:company-updated', updateCompanyName)
    return () => window.removeEventListener('sco:company-updated', updateCompanyName)
  }, [])
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <button className="brand" type="button" onClick={() => navigate('/')} aria-label="SmartCloud home">
          <span className="brand-mark"><Icon name="cloud" size={21} /></span>
          <span className="brand-text">SmartCloud</span>
        </button>
        <button type="button" className="workspace-picker" onClick={() => navigate('/company')} aria-label="Open company details">
          <span className="workspace-avatar">SC</span>
          <span className="workspace-label"><strong>{companyName ?? company.data?.name ?? 'Your company'}</strong><small>Company details</small></span>
        </button>
        <nav className="sidebar-nav" aria-label="Main navigation">
          {visibleNavigation.map((group) => (
            <div className="nav-group" key={group.heading}>
              <p className="nav-heading">{group.heading}</p>
              {group.items.map((item) => (
                <button
                  key={item.path}
                  type="button"
                  className={`nav-link ${activePath === item.path ? 'active' : ''}`}
                  onClick={() => navigate(item.path)}
                >
                  <Icon name={item.icon} size={17} />
                  <span>{item.label}</span>
                  {item.path === '/alerts' && Boolean(alerts.data?.length) && <span className="nav-dot" aria-label={`${alerts.data?.length} active alerts`} />}
                </button>
              ))}
            </div>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="profile-row">
            <span className="profile-avatar">{user.name.trim().slice(0, 1).toUpperCase()}</span>
            <button type="button" className={`profile-info profile-open ${path === '/profile' ? 'active' : ''}`} onClick={() => navigate('/profile')} aria-label="View profile">
              <strong>{user.name}</strong><small>{user.role}</small>
            </button>
            <button type="button" className="icon-button profile-logout" onClick={onLogout} aria-label="Sign out" title="Sign out"><Icon name="logout" size={16} /></button>
          </div>
        </div>
      </aside>
      <div className="main-column">
        <header className="topbar">
          <div className="breadcrumb"><span>Workspace</span><Icon name="chevron" size={13} /><strong>{activePath === '/profile' ? 'Profile' : workspaceNavigation.flatMap((group) => group.items).find((item) => item.path === activePath)?.label ?? 'Overview'}</strong></div>
          <div className="topbar-actions">
            <button type="button" className="icon-button theme-button" onClick={onToggleTheme} aria-label={`Switch to ${dark ? 'light' : 'dark'} mode`} title={`Switch to ${dark ? 'light' : 'dark'} mode`}><Icon name={dark ? 'sun' : 'moon'} size={17} /></button>
            <span className="topbar-date">{new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium' }).format(new Date())}</span>
          </div>
        </header>
        <main className="main-content">{children}</main>
        <footer className="page-footer"><span>SmartCloud</span><span>Cost estimates are illustrative and based on current usage data.</span></footer>
      </div>
    </div>
  )
}
