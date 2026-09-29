import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  Mail,
  User,
  Pencil,
  Shield,
  Clock,
  Loader2,
  AlertCircle,
  RefreshCw,
  UserPlus,
  X
} from 'lucide-react'

const API_URL = 'http://localhost:5000'

export const JoinRequests = ({
  projectId,
  onClose
}) => {
  const [invitations, setInvitations] = useState([])
  const [loading, setLoading] = useState(true)
  const [action, setAction] = useState(null)
  const [error, setError] = useState('')

  const getToken = () => {
    return localStorage.getItem('codezy_token')
  }

  const loadInvitations = async () => {
    const token = getToken()

    if (!projectId) {
      setError('No project is currently selected.')
      setInvitations([])
      setLoading(false)
      return
    }

    if (!token) {
      setError('You are not authenticated.')
      setInvitations([])
      setLoading(false)
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await fetch(
        `${API_URL}/api/invitations/project/${encodeURIComponent(
          projectId
        )}`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      )

      let data = {}

      try {
        data = await response.json()
      } catch {
        data = {}
      }

      if (!response.ok) {
        throw new Error(
          data.message ||
            data.error ||
            'Failed to load sent invitations.'
        )
      }

      const items = Array.isArray(data.invitations)
        ? data.invitations
        : []

      setInvitations(
        items.filter(
          invitation =>
            invitation.status === 'requested'
        )
      )
    } catch (error) {
      console.error(
        'Load sent invitations error:',
        error
      )

      setError(
        error.message ||
          'Failed to load sent invitations.'
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadInvitations()
  }, [projectId])

  const handleCancel = async invitationId => {
    const token = getToken()

    if (
      !token ||
      !projectId ||
      !invitationId ||
      action
    ) {
      return
    }

    setAction(invitationId)
    setError('')

    try {
      const response = await fetch(
        `${API_URL}/api/invitations/project/${encodeURIComponent(
          projectId
        )}/${encodeURIComponent(
          invitationId
        )}/cancel`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      )

      let data = {}

      try {
        data = await response.json()
      } catch {
        data = {}
      }

      if (!response.ok) {
        throw new Error(
          data.message ||
            data.error ||
            'Failed to cancel invitation.'
        )
      }

      setInvitations(previous =>
        previous.filter(
          invitation =>
            String(invitation._id) !==
            String(invitationId)
        )
      )
    } catch (error) {
      console.error(
        'Cancel invitation error:',
        error
      )

      setError(
        error.message ||
          'Failed to cancel invitation.'
      )
    } finally {
      setAction(null)
    }
  }

  const formatDate = date => {
    if (!date) {
      return 'Recently'
    }

    const value = new Date(date)

    if (Number.isNaN(value.getTime())) {
      return 'Recently'
    }

    return value.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  return (
    <motion.div
      initial={{
        opacity: 0,
        x: 10
      }}
      animate={{
        opacity: 1,
        x: 0
      }}
      className="flex flex-col gap-3"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[11px] font-medium text-zinc-300">
            Sent invitations
          </p>

          <p className="text-[10px] text-zinc-600 mt-1">
            Invitations waiting for the user to accept
          </p>
        </div>

        {invitations.length > 0 && (
          <div className="min-w-5 h-5 px-1.5 rounded-full bg-violet-500/15 border border-violet-500/20 flex items-center justify-center">
            <span className="text-[9px] font-semibold text-violet-400">
              {invitations.length}
            </span>
          </div>
        )}
      </div>

      {error && (
        <div className="flex items-start gap-2 p-2.5 rounded-lg bg-red-500/10 border border-red-500/20">
          <AlertCircle
            size={13}
            className="text-red-400 mt-0.5 shrink-0"
          />

          <p className="text-[10px] text-red-300 leading-4">
            {error}
          </p>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center py-10">
          <div className="w-11 h-11 rounded-full bg-violet-500/10 border border-violet-500/10 flex items-center justify-center">
            <Loader2
              size={18}
              className="text-violet-400 animate-spin"
            />
          </div>

          <p className="text-[10px] text-zinc-500 mt-3">
            Checking sent invitations...
          </p>
        </div>
      ) : invitations.length === 0 ? (
        <div className="flex flex-col items-center py-10">
          <div className="w-12 h-12 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center">
            <UserPlus
              size={19}
              className="text-zinc-600"
            />
          </div>

          <p className="text-[11px] text-zinc-400 mt-3">
            No pending invitations
          </p>

          <p className="text-[10px] text-zinc-600 text-center mt-1 leading-4">
            Invitations you send will appear here.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2.5 max-h-80 overflow-y-auto pr-1">
          {invitations.map(invitation => {
            const recipient =
              invitation.email ||
              'Unknown user'

            const permission =
              invitation.permission || 'view'

            const cancelling =
              String(action) ===
              String(invitation._id)

            return (
              <motion.div
                key={invitation._id}
                initial={{
                  opacity: 0,
                  y: 5
                }}
                animate={{
                  opacity: 1,
                  y: 0
                }}
                className="rounded-xl bg-zinc-950 border border-zinc-800 overflow-hidden"
              >
                <div className="p-3">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-violet-600/10 border border-violet-500/10 flex items-center justify-center shrink-0">
                      <User
                        size={17}
                        className="text-violet-400"
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-white truncate">
                            {recipient}
                          </p>

                          <div className="flex items-center gap-1.5 mt-1">
                            <Mail
                              size={10}
                              className="text-zinc-600 shrink-0"
                            />

                            <p className="text-[9px] text-zinc-600 truncate">
                              {recipient}
                            </p>
                          </div>
                        </div>

                        <span className="shrink-0 text-[8px] px-2 py-1 rounded-full bg-amber-500/10 border border-amber-500/15 text-amber-400">
                          Waiting
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 p-2.5 rounded-lg bg-zinc-900 border border-zinc-800">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-md bg-violet-500/10 flex items-center justify-center">
                        <UserPlus
                          size={11}
                          className="text-violet-400"
                        />
                      </div>

                      <div>
                        <p className="text-[9px] text-zinc-500">
                          Invitation sent
                        </p>

                        <p className="text-[10px] text-zinc-300 mt-0.5">
                          Waiting for them to accept
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1.5">
                        {permission === 'edit' ? (
                          <Pencil
                            size={10}
                            className="text-violet-400"
                          />
                        ) : (
                          <Shield
                            size={10}
                            className="text-violet-400"
                          />
                        )}

                        <span className="text-[9px] text-zinc-500">
                          {permission === 'edit'
                            ? 'Can edit'
                            : 'View only'}
                        </span>
                      </div>

                      <div className="w-1 h-1 rounded-full bg-zinc-700" />

                      <div className="flex items-center gap-1.5">
                        <Clock
                          size={10}
                          className="text-zinc-600"
                        />

                        <span className="text-[9px] text-zinc-600">
                          {formatDate(
                            invitation.requestedAt ||
                              invitation.createdAt
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() =>
                    handleCancel(invitation._id)
                  }
                  disabled={!!action}
                  className="w-full h-9 flex items-center justify-center gap-2 bg-zinc-900 hover:bg-zinc-800 disabled:opacity-40 text-zinc-400 hover:text-white text-[10px] transition border-t border-zinc-800"
                >
                  {cancelling ? (
                    <Loader2
                      size={12}
                      className="animate-spin"
                    />
                  ) : (
                    <X size={12} />
                  )}

                  {cancelling
                    ? 'Cancelling...'
                    : 'Cancel invitation'}
                </button>
              </motion.div>
            )
          })}
        </div>
      )}

      <button
        onClick={loadInvitations}
        disabled={loading || !!action}
        className="h-8 flex items-center justify-center gap-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 text-zinc-400 hover:text-zinc-200 text-[10px] transition"
      >
        <RefreshCw
          size={11}
          className={loading ? 'animate-spin' : ''}
        />

        {loading
          ? 'Refreshing...'
          : 'Refresh invitations'}
      </button>

      {onClose && (
        <button
          onClick={onClose}
          disabled={!!action}
          className="text-[10px] text-zinc-600 hover:text-zinc-300 disabled:opacity-40 transition"
        >
          Close
        </button>
      )}
    </motion.div>
  )
}

export default JoinRequests