import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'

const APP_URL = import.meta.env.VITE_APP_URL || window.location.origin

export default function AdminPanel() {
  const { createInvitation, listInvitations, listUsers, setUserRole, deleteInvitation, user } = useAuth()

  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteLink, setInviteLink]   = useState('')
  const [invitations, setInvitations] = useState([])
  const [users, setUsers]             = useState([])
  const [error, setError]             = useState('')
  const [success, setSuccess]         = useState('')
  const [busy, setBusy]               = useState(false)
  const [tab, setTab]                 = useState('invite')

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    const [inv, usr] = await Promise.all([listInvitations(), listUsers()])
    setInvitations(inv.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)))
    setUsers(usr.sort((a, b) => (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0)))
  }

  async function handleInvite(e) {
    e.preventDefault()
    setError(''); setSuccess(''); setInviteLink('')
    if (!inviteEmail) return
    setBusy(true)
    try {
      const token = await createInvitation(inviteEmail)
      const link = `${APP_URL}/register?invite=${token}`
      setInviteLink(link)
      setSuccess(`Invitation created for ${inviteEmail}`)
      setInviteEmail('')
      loadData()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  function copyLink() {
    navigator.clipboard.writeText(inviteLink)
    setSuccess('Link copied to clipboard!')
    setTimeout(() => setSuccess(''), 3000)
  }

  async function handleRoleChange(uid, currentRole) {
    const newRole = currentRole === 'admin' ? 'user' : 'admin'
    if (!confirm(`Change this user to ${newRole}?`)) return
    try {
      await setUserRole(uid, newRole)
      loadData()
    } catch (err) {
      setError(err.message)
    }
  }

  async function handleDeleteInvite(token, email) {
    if (!confirm(`Delete invitation for ${email}?`)) return
    try {
      await deleteInvitation(token)
      loadData()
    } catch (err) {
      setError(err.message)
    }
  }

  function formatDate(ts) {
    if (!ts) return '—'
    const d = ts.toDate ? ts.toDate() : new Date(ts)
    return d.toLocaleDateString('en-AU', { day: '2-digit', month: 'short', year: 'numeric' })
  }

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1>Administration</h1>
        <p>Manage user access and invitations</p>
      </div>

      {error   && <div className="admin-error">{error}</div>}
      {success && <div className="admin-success">{success}</div>}

      {/* Tab bar */}
      <div className="admin-tabs">
        <button className={`admin-tab ${tab === 'invite' ? 'active' : ''}`} onClick={() => setTab('invite')}>
          Invite User
        </button>
        <button className={`admin-tab ${tab === 'invitations' ? 'active' : ''}`} onClick={() => setTab('invitations')}>
          Pending Invitations ({invitations.filter(i => !i.used).length})
        </button>
        <button className={`admin-tab ${tab === 'users' ? 'active' : ''}`} onClick={() => setTab('users')}>
          Users ({users.length})
        </button>
      </div>

      {/* ── Invite tab ──────────────────────────────────────────── */}
      {tab === 'invite' && (
        <div className="admin-card">
          <h2>Send Invitation</h2>
          <p className="admin-card-desc">
            Generate an invitation link for a new user. The link expires in <strong>7 days</strong>.
            Only the invited email address can use the link to register.
          </p>
          <form onSubmit={handleInvite} className="invite-form">
            <div className="invite-input-wrap">
              <input
                type="email"
                className="admin-input"
                placeholder="colleague@company.com"
                value={inviteEmail}
                onChange={e => setInviteEmail(e.target.value)}
                required
              />
              <button type="submit" className="admin-btn primary" disabled={busy}>
                {busy ? 'Creating…' : 'Generate Link'}
              </button>
            </div>
          </form>

          {inviteLink && (
            <div className="invite-result">
              <div className="invite-link-label">Invitation Link</div>
              <div className="invite-link-box">
                <code className="invite-link-text">{inviteLink}</code>
                <button className="copy-btn" onClick={copyLink}>Copy</button>
              </div>
              <p className="invite-hint">
                Send this link to the new user. It will expire in 7 days and can only be used once.
              </p>
            </div>
          )}
        </div>
      )}

      {/* ── Invitations tab ─────────────────────────────────────── */}
      {tab === 'invitations' && (
        <div className="admin-card">
          <h2>Invitations</h2>
          {invitations.length === 0 ? (
            <p className="empty-msg">No invitations yet.</p>
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Created</th>
                  <th>Expires</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {invitations.map(inv => {
                  const expired = inv.expiresAt && new Date(inv.expiresAt.seconds ? inv.expiresAt.toDate() : inv.expiresAt) < new Date()
                  return (
                    <tr key={inv.id}>
                      <td className="mono">{inv.email}</td>
                      <td>{formatDate(inv.createdAt)}</td>
                      <td>{formatDate(inv.expiresAt)}</td>
                      <td>
                        <span className={`status-badge ${inv.used ? 'used' : expired ? 'expired' : 'pending'}`}>
                          {inv.used ? 'Used' : expired ? 'Expired' : 'Pending'}
                        </span>
                      </td>
                      <td>
                        {!inv.used && (
                          <button
                            className="danger-btn"
                            onClick={() => handleDeleteInvite(inv.id, inv.email)}
                          >Revoke</button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ── Users tab ───────────────────────────────────────────── */}
      {tab === 'users' && (
        <div className="admin-card">
          <h2>Registered Users</h2>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Email</th>
                <th>Role</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id}>
                  <td className="mono">
                    {u.email}
                    {u.id === user.uid && <span className="you-badge">you</span>}
                  </td>
                  <td>
                    <span className={`role-badge ${u.role}`}>{u.role}</span>
                  </td>
                  <td>{formatDate(u.createdAt)}</td>
                  <td>
                    {u.id !== user.uid && (
                      <button
                        className={`role-btn ${u.role === 'admin' ? 'demote' : 'promote'}`}
                        onClick={() => handleRoleChange(u.id, u.role)}
                      >
                        {u.role === 'admin' ? 'Remove Admin' : 'Make Admin'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
