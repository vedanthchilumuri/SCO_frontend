import { useState } from 'react'
import type { FormEvent } from 'react'
import { Button, PageHeader, Panel, Tag } from '../components/UI'
import { useToast } from '../hooks/useToast'
import type { ProfileUpdate, User } from '../types/api'

export function ProfilePage({ user, onSave }: { user: User; onSave: (profile: ProfileUpdate) => Promise<void> }) {
  const toast = useToast()
  const [name, setName] = useState(user.name)
  const [email, setEmail] = useState(user.email)
  const [jobDescription, setJobDescription] = useState(user.role)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string>()

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(undefined)
    setSaving(true)
    try {
      await onSave({ name: name.trim(), email: email.trim(), role: jobDescription.trim() })
      toast('Profile saved.')
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to update your profile.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="ACCOUNT"
        title="Your profile"
        description="Update the personal details associated with your SmartCloud account."
      />
      <Panel title="Profile details" subtitle="Changes are saved to your account">
        <form className="profile-form" onSubmit={(event) => void submit(event)}>
          <div className="profile-details-heading">
            <span className="profile-details-avatar">{name.trim().slice(0, 1).toUpperCase() || '?'}</span>
            <strong>{name || 'Your name'}</strong>
            <Tag tone={user.is_admin ? 'violet' : 'blue'}>{user.is_admin ? 'Admin' : 'Member'}</Tag>
          </div>
          <div className="profile-edit-fields">
            <label className="form-field"><span>Full name</span><input value={name} onChange={(event) => setName(event.target.value)} maxLength={120} required /></label>
            <label className="form-field"><span>Email address</span><input type="email" value={email} onChange={(event) => setEmail(event.target.value)} maxLength={254} required /></label>
            <label className="form-field"><span>Job description</span><input value={jobDescription} onChange={(event) => setJobDescription(event.target.value)} maxLength={120} required /></label>
            <label className="form-field"><span>Account ID</span><input value={user.id} readOnly /></label>
          </div>
          {error && <div className="form-error" role="alert">{error}</div>}
          <Button type="submit" disabled={saving}>{saving && <span className="button-spinner" />}Save profile</Button>
        </form>
      </Panel>
    </>
  )
}
