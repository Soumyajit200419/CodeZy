import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  Mail,
  User,
  UserCheck,
  UserX,
  Pencil,
  Shield,
  Clock,
  Loader2,
  AlertCircle,
  RefreshCw,
  Folder
} from 'lucide-react'

const API_URL = 'http://localhost:5000'

const MyInvitations = () => {
  const [invitations, setInvitations] = useState([])
  const [loading, setLoading] = useState(true)
  const [action, setAction] = useState(null)
  const [error, setError] = useState('')

  const getToken = () => {
    return localStorage.getItem('codezy_token')
  }

  const loadInvitations = async () => {
    const token = getToken()

    if (!token) {
      setError('You are not authenticated.')
      setLoading(false)
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await fetch(
        `${API_URL}/api/invitations/my-requests`,
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
            'Failed to load project requests.'
        )
      }

      setInvitations(data.invitations || [])
    } catch (error) {
      console.error(
        'Load my invitations error:',
        error
      )

      setError(
        error.message ||
          'Failed to load project requests.'
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadInvitations()
  }, [])

  const handleAction = async (
    invitationId,
    type
  ) => {
    const token = getToken()

    if (!token || !invitationId || action) {
      return
    }

    setAction({
      id: invitationId,
      type
    })

    setError('')

    try {
      const response = await fetch(
        `${API_URL}/api/invitations/my-requests/${encodeURIComponent(
          invitationId
        )}/${type}`,
        {
          method: 'POST',
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
            `Failed to ${type} request.`
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
        `${type} invitation error:`,
        error
      )

      setError(
        error.message ||
          `Failed to ${type} request.`
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
        y: 8
      }}
      animate={{
        opacity: 1,
        y: 0
      }}
      className="flex flex-col gap-3"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[11px] font-medium text-zinc-300">
            Project requests
          </p>

          <p className="text-[10px] text-zinc-600 mt-1">
            Requests sent to your Codezy account
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
            Checking project requests...
          </p>
        </div>
      ) : invitations.length === 0 ? (
        <div className="flex flex-col items-center py-10">
          <div className="w-12 h-12 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center">
            <UserCheck
              size={19}
              className="text-zinc-600"
            />
          </div>

          <p className="text-[11px] text-zinc-400 mt-3">
            No project requests
          </p>

          <p className="text-[10px] text-zinc-600 text-center mt-1 leading-4">
            You don't have any pending project requests.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2.5 max-h-96 overflow-y-auto pr-1">
          {invitations.map(invitation => {
            const sender = invitation.invitedBy

            const senderName =
              sender?.name ||
              sender?.username ||
              sender?.email ||
              'A Codezy user'

            const senderEmail =
              sender?.email ||
              'No email available'

            const project =
              invitation.project

            const projectName =
              project?.name ||
              project?.title ||
              'Codezy project'

            const permission =
              invitation.permission || 'view'

            const accepting =
              String(action?.id) ===
                String(invitation._id) &&
              action?.type === 'accept'

            const declining =
              String(action?.id) ===
                String(invitation._id) &&
              action?.type === 'decline'

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
                            {senderName}
                          </p>

                          <div className="flex items-center gap-1.5 mt-1">
                            <Mail
                              size={10}
                              className="text-zinc-600 shrink-0"
                            />

                            <p className="text-[9px] text-zinc-600 truncate">
                              {senderEmail}
                            </p>
                          </div>
                        </div>

                        <span className="shrink-0 text-[8px] px-2 py-1 rounded-full bg-violet-500/10 border border-violet-500/15 text-violet-400">
                          Project request
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 p-2.5 rounded-lg bg-zinc-900 border border-zinc-800">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-md bg-violet-500/10 flex items-center justify-center">
                        <Folder
                          size={11}
                          className="text-violet-400"
                        />
                      </div>

                      <div className="min-w-0">
                        <p className="text-[9px] text-zinc-500">
                          Project
                        </p>

                        <p className="text-[10px] text-zinc-300 mt-0.5 truncate">
                          {projectName}
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

                <div className="grid grid-cols-2 gap-px bg-zinc-800">
                  <button
                    onClick={() =>
                      handleAction(
                        invitation._id,
                        'decline'
                      )
                    }
                    disabled={!!action}
                    className="h-9 flex items-center justify-center gap-2 bg-zinc-900 hover:bg-zinc-800 disabled:opacity-40 text-zinc-400 hover:text-white text-[10px] transition"
                  >
                    {declining ? (
                      <Loader2
                        size={12}
                        className="animate-spin"
                      />
                    ) : (
                      <UserX size={12} />
                    )}

                    {declining
                      ? 'Declining...'
                      : 'Decline'}
                  </button>

                  <button
                    onClick={() =>
                      handleAction(
                        invitation._id,
                        'accept'
                      )
                    }
                    disabled={!!action}
                    className="h-9 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white text-[10px] font-medium transition"
                  >
                    {accepting ? (
                      <Loader2
                        size={12}
                        className="animate-spin"
                      />
                    ) : (
                      <UserCheck size={12} />
                    )}

                    {accepting
                      ? 'Accepting...'
                      : 'Accept'}
                  </button>
                </div>
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
          : 'Refresh requests'}
      </button>
    </motion.div>
  )
}

export default MyInvitations