import { useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import { Icon } from '../components/Icon'
import { useAuth } from '../hooks/useAuth'
import { useTheme } from '../hooks/useTheme'
import { Button } from '../components/UI'
import { navigateTo } from '../utils/navigation'

function BrandMark() {
  return <div className="auth-brand"><span className="brand-mark"><Icon name="cloud" size={21} /></span><span className="brand-text">SmartCloud</span></div>
}

function AuthFrame({ children, mode }: { children: ReactNode; mode: 'login' | 'register' }) {
  const { dark, toggle } = useTheme()
  return (
    <main className="auth-screen">
      <div className="auth-topline"><BrandMark /><button className="icon-button theme-button" type="button" onClick={toggle} aria-label={`Switch to ${dark ? 'light' : 'dark'} mode`}><Icon name={dark ? 'sun' : 'moon'} size={17} /></button></div>
      <div className="auth-content">
        <section className="auth-aside">
          <div className="auth-aside-content">
            <span className="auth-kicker"><Icon name="leaf" size={15} /> CLOUD COST INTELLIGENCE</span>
            <h1>Make every cloud resource count.</h1>
            <p>Turn utilization data into clear, safe decisions your team can stand behind.</p>
            <div className="auth-aside-stats"><div><strong>30 to 90</strong><span>day cost outlook</span></div><i /><div><strong>p95 / p99</strong><span>peak-aware sizing</span></div></div>
          </div>
          <span className="auth-aside-foot">Built for teams that own their infrastructure.</span>
        </section>
        <section className="auth-card-wrap">
          <div className="auth-card">
            <div className="auth-mobile-brand"><BrandMark /></div>
            <p className="eyebrow">{mode === 'login' ? 'WELCOME BACK' : 'START OPTIMIZING'}</p>
            <h2>{mode === 'login' ? 'Sign in to your workspace' : 'Create your workspace account'}</h2>
            <p className="auth-subtitle">{mode === 'login' ? 'Pick up where your cloud insights left off.' : 'Get a clearer picture of your cloud footprint.'}</p>
            {children}
            <div className="auth-switch">{mode === 'login' ? <>New to SmartCloud Optimizer? <button type="button" onClick={() => navigateTo('/register')}>Create an account</button></> : <>Already have an account? <button type="button" onClick={() => navigateTo('/login')}>Sign in</button></>}</div>
          </div>
          <p className="auth-footnote">Your infrastructure data stays within your workspace.</p>
        </section>
      </div>
    </main>
  )
}

export function LoginPage() {
  const { login, sessionError } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string>()
  const [loading, setLoading] = useState(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(undefined)
    setLoading(true)
    try {
      await login(email.trim(), password)
      navigateTo('/')
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to sign in.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthFrame mode="login">
      <form className="auth-form" onSubmit={(event) => void submit(event)}>
        {sessionError && <div className="form-error" role="alert">{sessionError}</div>}
        <label className="form-field"><span>Email address</span><input type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@company.com" required /></label>
        <label className="form-field"><span>Password</span><input type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Enter your password" required /></label>
        {error && <div className="form-error" role="alert">{error}</div>}
        <Button type="submit" className="auth-submit" disabled={loading}>{loading && <span className="button-spinner" />}Sign in</Button>
      </form>
    </AuthFrame>
  )
}

function passwordStrength(password: string) {
  return [
    password.length >= 8,
    /[A-Z]/.test(password) && /[a-z]/.test(password),
    /\d/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ].filter(Boolean).length
}

export function RegisterPage() {
  const { register } = useAuth()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [jobDescription, setJobDescription] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string>()
  const [loading, setLoading] = useState(false)
  const strength = passwordStrength(password)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(undefined)
    if (password.length < 8) {
      setError('Use at least 8 characters for your password.')
      return
    }
    if (password !== confirmPassword) {
      setError('The passwords do not match.')
      return
    }
    setLoading(true)
    try {
      await register(email.trim(), password, name.trim(), jobDescription.trim())
      navigateTo('/')
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to create your account.')
    } finally {
      setLoading(false)
    }
  }

  const strengthLabel = ['Add a longer password', 'Needs more variety', 'Getting stronger', 'Strong password', 'Excellent password'][strength]
  return (
    <AuthFrame mode="register">
      <form className="auth-form" onSubmit={(event) => void submit(event)}>
        <label className="form-field"><span>Full name</span><input autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} placeholder="Alex Smith" required /></label>
        <label className="form-field"><span>Work email</span><input type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@company.com" required /></label>
        <label className="form-field"><span>Job description</span><input value={jobDescription} onChange={(event) => setJobDescription(event.target.value)} maxLength={120} placeholder="e.g. Cloud engineer" required /></label>
        <label className="form-field"><span>Password</span><input type="password" autoComplete="new-password" minLength={8} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="At least 8 characters" required /></label>
        {password && <div className="password-strength" aria-live="polite"><div className="strength-meter">{[1, 2, 3, 4].map((step) => <span className={step <= strength ? `strength-${strength}` : ''} key={step} />)}</div><small>{strengthLabel}</small></div>}
        <label className="form-field"><span>Confirm password</span><input type="password" autoComplete="new-password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} placeholder="Re-enter your password" required /></label>
        {error && <div className="form-error" role="alert">{error}</div>}
        <Button type="submit" className="auth-submit" disabled={loading}>{loading && <span className="button-spinner" />}Create account</Button>
      </form>
    </AuthFrame>
  )
}
