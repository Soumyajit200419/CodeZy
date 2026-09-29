import React, { useCallback, useEffect, useState } from 'react'
import {
  Crown,
  Loader2,
  AlertCircle,
  RefreshCw,
  Pencil,
  Shield,
  Trash2,
  Users
} from 'lucide-react'

const API_URL = 'http://localhost:5000'

const COLORS = ['#8b5cf6', '#22c55e', '#f97316', '#06b6d4', '#ec4899', '#eab308', '#3b82f6']

const getToken = () => localStorage.getItem('codezy_token')

const colorFor = (seed = '') => {
  let hash = 0
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) | 0
  return COLORS[Math.abs(hash) % COLORS.length]
}

const initialsOf = (name = '') =>
  String(name)
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map(part => part[0]?.toUpperCase() || '')
    .join('') || '?'

const displayName = user =>
  user?.name || user?.username || user?.email || 'Unknown user'

const formatDate = date => {
  if (!date) return ''
  const value = new Date(date)
  if (Number.isNaN(value.getTime())) return ''
  return value.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function Members({ projectId, onLoaded, refreshKey = 0 }) {
  const [owner, setOwner] = useState(null)
  const [members, setMembers] = useState([])
  const [currentUserId, setCurrentUserId] = useState('')
  const [isOwner, setIsOwner] = useState(false)
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState(null)
  const [error, setError] = useState('')

  const load = useCallback(
    async signal => {
      const token = getToken()

      if (!projectId) {
        setError('No project is currently selected.')
        setLoading(false)
        return
      }

      if (!token) {
        setError('You are not authenticated.')
        setLoading(false)
        return
      }

      setLoading(true)
      setError('')

      try {
        const response = await fetch(
          `${API_URL}/api/projects/${encodeURIComponent(projectId)}/members`,
          {
            method: 'GET',
            headers: { Authorization: `Bearer ${token}` },
            signal
          }
        )

        let data = {}
        try {
          data = await response.json()
        } catch {
          data = {}
        }

        if (!response.ok) {
          throw new Error(data.message || data.error || 'Failed to load members.')
        }

        setOwner(data.owner || null)
        setMembers(data.members || [])
        setCurrentUserId(String(data.currentUserId || ''))
        setIsOwner(Boolean(data.isOwner))

        if (typeof onLoaded === 'function') {
          onLoaded({
            owner: data.owner || null,
            members: data.members || [],
            currentUserId: String(data.currentUserId || ''),
            isOwner: Boolean(data.isOwner)
          })
        }
      } catch (err) {
        if (err.name === 'AbortError') return
        console.error('Load members error:', err)
        setError(err.message || 'Failed to load members.')
      } finally {
        if (!signal?.aborted) setLoading(false)
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [projectId]
  )

  useEffect(() => {
    const controller = new AbortController()
    load(controller.signal)
    return () => controller.abort()
  }, [load, refreshKey])

  const changePermission = async (memberId, permission) => {
    const token = getToken()
    if (!token || busyId) return

    setBusyId(memberId)
    setError('')

    try {
      const response = await fetch(
        `${API_URL}/api/invitations/project/${encodeURIComponent(projectId)}/member/${encodeURIComponent(memberId)}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ permission })
        }
      )

      let data = {}
      try {
        data = await response.json()
      } catch {
        data = {}
      }

      if (!response.ok) {
        throw new Error(data.message || data.error || 'Failed to update permission.')
      }

      setMembers(previous =>
        previous.map(member =>
          String(member._id) === String(memberId) ? { ...member, permission } : member
        )
      )
    } catch (err) {
      setError(err.message || 'Failed to update permission.')
    } finally {
      setBusyId(null)
    }
  }

  const removeMember = async memberId => {
    const token = getToken()
    if (!token || busyId) return

    setBusyId(memberId)
    setError('')

    try {
      const response = await fetch(
        `${API_URL}/api/invitations/project/${encodeURIComponent(projectId)}/member/${encodeURIComponent(memberId)}`,
        {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` }
        }
      )

      let data = {}
      try {
        data = await response.json()
      } catch {
        data = {}
      }

      if (!response.ok) {
        throw new Error(data.message || data.error || 'Failed to remove member.')
      }

      setMembers(previous =>
        previous.filter(member => String(member._id) !== String(memberId))
      )
    } catch (err) {
      setError(err.message || 'Failed to remove member.')
    } finally {
      setBusyId(null)
    }
  }

  const total = (owner ? 1 : 0) + members.length

  return (
    <div className="flex flex-col" aria-busy={loading}>
      <div className="px-4 py-3 border-b border-zinc-800 flex items-center justify-between">
        <div>
          <div className="text-sm font-medium flex items-center gap-2">
            <Users size={14} className="text-violet-400" />
            Project members
          </div>
          <div className="text-xs text-zinc-500 mt-1">
            {loading ? 'Loading...' : `${total} ${total === 1 ? 'person' : 'people'}`}
          </div>
        </div>

        <button
          onClick={() => load()}
          disabled={loading || !!busyId}
          title="Refresh members"
          className="w-7 h-7 flex items-center justify-center rounded-md text-zinc-500 hover:text-white hover:bg-zinc-800 disabled:opacity-40 transition"
        >
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {error && (
        <div
          role="alert"
          className="m-2 flex items-start gap-2 p-2.5 rounded-lg bg-red-500/10 border border-red-500/20"
        >
          <AlertCircle size={13} className="text-red-400 mt-0.5 shrink-0" />
          <p className="text-[11px] text-red-300 leading-4">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center py-8">
          <Loader2 size={18} className="text-violet-400 animate-spin" />
          <p className="text-[11px] text-zinc-500 mt-2">Loading members...</p>
        </div>
      ) : (
        <div className="p-2 max-h-80 overflow-y-auto">
          {owner && (
            <div className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-zinc-800">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold shrink-0"
                style={{ backgroundColor: colorFor(String(owner._id || owner.email)) }}
              >
                {initialsOf(displayName(owner))}
              </div>

              <div className="flex-1 min-w-0">
                <div className="text-sm truncate flex items-center gap-1.5">
                  {displayName(owner)}
                  {String(owner._id) === currentUserId && (
                    <span className="text-[10px] text-violet-400">You</span>
                  )}
                </div>
                <div className="text-[11px] text-zinc-500 truncate">{owner.email}</div>
              </div>

              <span className="flex items-center gap-1 text-[10px] px-2 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 shrink-0">
                <Crown size={10} />
                Owner
              </span>
            </div>
          )}

          {members.length === 0 && (
            <p className="text-[11px] text-zinc-600 text-center py-4">
              No team members yet.
            </p>
          )}

          {members.map(member => {
            const memberId = String(member._id)
            const isMe = memberId === currentUserId
            const working = busyId === member._id

            return (
              <div
                key={memberId}
                className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-zinc-800"
              >
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold shrink-0"
                  style={{ backgroundColor: colorFor(memberId) }}
                >
                  {initialsOf(displayName(member))}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="text-sm truncate flex items-center gap-1.5">
                    {displayName(member)}
                    {isMe && <span className="text-[10px] text-violet-400">You</span>}
                  </div>
                  <div className="text-[11px] text-zinc-500 truncate">
                    {member.email}
                    {member.joinedAt ? ` · Joined ${formatDate(member.joinedAt)}` : ''}
                  </div>
                </div>

                {isOwner ? (
                  <div className="flex items-center gap-1 shrink-0">
                    <select
                      value={member.permission || 'view'}
                      disabled={working}
                      onChange={event => changePermission(member._id, event.target.value)}
                      className="h-7 rounded-md bg-zinc-900 border border-zinc-700 text-[11px] text-zinc-300 px-1.5 outline-none disabled:opacity-50"
                    >
                      <option value="view">View</option>
                      <option value="edit">Edit</option>
                    </select>

                    <button
                      onClick={() => removeMember(member._id)}
                      disabled={working}
                      title="Remove member"
                      className="w-7 h-7 flex items-center justify-center rounded-md text-zinc-500 hover:text-red-400 hover:bg-red-500/10 disabled:opacity-40 transition"
                    >
                      {working ? (
                        <Loader2 size={12} className="animate-spin" />
                      ) : (
                        <Trash2 size={12} />
                      )}
                    </button>
                  </div>
                ) : (
                  <span className="flex items-center gap-1 text-[10px] text-zinc-400 shrink-0">
                    {member.permission === 'edit' ? (
                      <Pencil size={10} className="text-violet-400" />
                    ) : (
                      <Shield size={10} className="text-violet-400" />
                    )}
                    {member.permission === 'edit' ? 'Can edit' : 'View only'}
                  </span>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}