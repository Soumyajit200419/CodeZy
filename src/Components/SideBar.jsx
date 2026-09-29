import React, { useState } from 'react'

import { AnimatePresence, motion } from 'framer-motion'

import {
  Files,
  Play,
  Users,
  Settings,
  Terminal,
  X,
  UserPlus,
  Copy,
  Check,
  ArrowLeft,
  Loader2,
  Mail,
  Shield,
  Pencil,
  AlertCircle,
  UserCheck,
  ChevronRight,
  User
} from 'lucide-react'

import { Language } from './Language'
import { JoinRequests } from './JoinRequests'

const sidebarItems = [
  {
    name: 'Explorer',
    icon: Files
  },
  {
    name: 'Run & Debug',
    icon: Play
  },
  {
    name: 'Members',
    icon: Users
  }
]

const API_URL = 'http://localhost:5000'

const Tooltip = ({ label }) => (
  <div className="absolute left-12 top-1/2 -translate-y-1/2 hidden group-hover:block z-50">
    <motion.div
      initial={{
        opacity: 0,
        x: -6
      }}
      animate={{
        opacity: 1,
        x: 0
      }}
      transition={{
        duration: 0.15
      }}
      className="bg-zinc-800 text-white text-xs px-3 py-2 rounded-md whitespace-nowrap shadow-lg border border-zinc-700"
    >
      {label}
    </motion.div>
  </div>
)

export const SideBar = ({
  projectId,
  onExplorerClick,
  onRunDebugClick,
  onTerminalClick,
  onSettingsClick,
  onUserClick
}) => {
  const [membersOpen, setMembersOpen] = useState(false)
  const [view, setView] = useState('choice')

  const [email, setEmail] = useState('')
  const [permission, setPermission] = useState('edit')
  const [sendingInvite, setSendingInvite] = useState(false)
  const [inviteSent, setInviteSent] = useState(false)
  const [inviteError, setInviteError] = useState('')
  const [inviteLink, setInviteLink] = useState('')
  const [copied, setCopied] = useState(false)

  const getToken = () => {
    return localStorage.getItem('codezy_token')
  }

  const openMembers = () => {
    setView('choice')
    setMembersOpen(true)
  }

  const closeMembers = () => {
    setMembersOpen(false)

    setTimeout(() => {
      setView('choice')
      setEmail('')
      setPermission('edit')
      setSendingInvite(false)
      setInviteSent(false)
      setInviteError('')
      setInviteLink('')
      setCopied(false)
    }, 200)
  }

  const handleButtonClick = (name) => {
    if (name === 'Explorer') {
      onExplorerClick?.()
    }

    if (name === 'Run & Debug') {
      onRunDebugClick?.()
    }

    if (name === 'Members') {
      openMembers()
    }
  }

  const handleAccountClick = () => {
    onUserClick?.()
  }

  const sendInvitation = async () => {
    const cleanEmail = email.trim()
    const token = getToken()

    if (!cleanEmail) {
      setInviteError('Enter an email address.')
      return
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setInviteError('Enter a valid email address.')
      return
    }

    if (!projectId) {
      setInviteError('No project is currently selected.')
      return
    }

    if (!token) {
      setInviteError('You are not authenticated.')
      return
    }

    if (sendingInvite) {
      return
    }

    setSendingInvite(true)
    setInviteError('')
    setInviteSent(false)
    setInviteLink('')

    try {
      const response = await fetch(
        `${API_URL}/api/invitations/project/${encodeURIComponent(
          projectId
        )}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            email: cleanEmail,
            permission
          })
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
            'Failed to send invitation.'
        )
      }

      setInviteSent(true)

      if (data.invitation?.inviteLink) {
        setInviteLink(data.invitation.inviteLink)
      }
    } catch (error) {
      console.error('Invitation error:', error)

      setInviteError(
        error.message ||
          'Failed to send invitation.'
      )
    } finally {
      setSendingInvite(false)
    }
  }

  const copyInvite = async () => {
    if (!inviteLink) {
      return
    }

    try {
      await navigator.clipboard.writeText(inviteLink)

      setCopied(true)

      setTimeout(() => {
        setCopied(false)
      }, 1500)
    } catch (error) {
      console.error('Copy failed:', error)
    }
  }

  const resetInviteForm = () => {
    setEmail('')
    setInviteSent(false)
    setInviteLink('')
    setInviteError('')
    setCopied(false)
  }

  return (
    <div className="w-15 h-screen bg-zinc-200 py-1 pl-1 flex items-center relative">
      <div className="w-full h-full bg-zinc-900 rounded-l-md flex flex-col items-center py-4">
        <div className="w-9 h-9 bg-violet-600 rounded-lg flex items-center justify-center text-white font-bold text-lg mb-6 shadow-lg shadow-violet-900/20">
          C
        </div>

        <div className="flex flex-col gap-3">
          {sidebarItems.map((item) => {
            const Icon = item.icon

            return (
              <div
                key={item.name}
                className="relative group"
              >
                <button
                  onClick={() =>
                    handleButtonClick(item.name)
                  }
                  className="w-9 h-9 flex items-center justify-center rounded-md text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all duration-300"
                >
                  <Icon size={20} />
                </button>

                <Tooltip label={item.name} />
              </div>
            )
          })}

          <Language />

          <div className="relative group">
            <button
              onClick={onTerminalClick}
              className="w-9 h-9 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-md transition-all duration-300"
            >
              <Terminal size={20} />
            </button>

            <Tooltip label="Terminal" />
          </div>
        </div>

        <div className="relative group mt-auto flex flex-col gap-2">
          <button
            onClick={handleAccountClick}
            className="w-9 h-9 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-md transition"
          >
            <User size={20} />
          </button>

          <Tooltip label="Account" />

          <button
            onClick={onSettingsClick}
            className="w-9 h-9 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-md transition"
          >
            <Settings size={20} />
          </button>

          <Tooltip label="Settings" />
        </div>
      </div>

      <AnimatePresence>
        {membersOpen && (
          <>
            <motion.div
              initial={{
                opacity: 0
              }}
              animate={{
                opacity: 1
              }}
              exit={{
                opacity: 0
              }}
              transition={{
                duration: 0.15
              }}
              onClick={closeMembers}
              className="fixed inset-0 z-40"
            />

            <motion.div
              initial={{
                opacity: 0,
                x: -12,
                scale: 0.97
              }}
              animate={{
                opacity: 1,
                x: 0,
                scale: 1
              }}
              exit={{
                opacity: 0,
                x: -12,
                scale: 0.97
              }}
              transition={{
                type: 'spring',
                stiffness: 400,
                damping: 32
              }}
              className="absolute left-16 top-6 w-80 bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl z-50 overflow-hidden"
            >
              <div className="h-12 px-4 flex items-center justify-between border-b border-zinc-800">
                <div className="flex items-center gap-2">
                  {view !== 'choice' && (
                    <button
                      onClick={() => {
                        setView('choice')
                        setInviteError('')
                      }}
                      className="w-6 h-6 flex items-center justify-center text-zinc-500 hover:text-white hover:bg-zinc-800 rounded-md transition"
                    >
                      <ArrowLeft size={14} />
                    </button>
                  )}

                  <div>
                    <p className="text-xs font-semibold text-white">
                      {view === 'choice' &&
                        'Workspace'}

                      {view === 'invite' &&
                        'Invite member'}

                      {view === 'requests' &&
                        'Join requests'}
                    </p>

                    {view === 'choice' && (
                      <p className="text-[10px] text-zinc-500">
                        Manage workspace access
                      </p>
                    )}
                  </div>
                </div>

                <button
                  onClick={closeMembers}
                  className="w-6 h-6 flex items-center justify-center text-zinc-500 hover:text-white hover:bg-zinc-800 rounded-md transition"
                >
                  <X size={14} />
                </button>
              </div>

              <div className="p-4">
                <AnimatePresence mode="wait">
                  {view === 'choice' && (
                    <motion.div
                      key="choice"
                      initial={{
                        opacity: 0,
                        y: 6
                      }}
                      animate={{
                        opacity: 1,
                        y: 0
                      }}
                      exit={{
                        opacity: 0,
                        y: -6
                      }}
                      transition={{
                        duration: 0.15
                      }}
                      className="flex flex-col gap-2"
                    >
                      <div className="mb-2">
                        <p className="text-[11px] text-zinc-400">
                          Collaborate with your team
                        </p>

                        <p className="text-[10px] text-zinc-600 mt-1">
                          Invite people or manage join requests.
                        </p>
                      </div>

                      <motion.button
                        whileHover={{
                          scale: 1.015
                        }}
                        whileTap={{
                          scale: 0.985
                        }}
                        onClick={() => {
                          setView('invite')
                          setInviteError('')
                        }}
                        className="w-full flex items-center gap-3 p-3 rounded-lg bg-zinc-800/60 hover:bg-zinc-800 border border-transparent hover:border-zinc-700 transition-all text-left"
                      >
                        <div className="w-9 h-9 rounded-lg bg-violet-600/15 flex items-center justify-center shrink-0">
                          <UserPlus
                            size={16}
                            className="text-violet-400"
                          />
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-medium text-white">
                            Invite member
                          </p>

                          <p className="text-[10px] text-zinc-500 mt-0.5">
                            Enter an email and send an invite
                          </p>
                        </div>

                        <ChevronRight
                          size={14}
                          className="text-zinc-600"
                        />
                      </motion.button>

                      <motion.button
                        whileHover={{
                          scale: 1.015
                        }}
                        whileTap={{
                          scale: 0.985
                        }}
                        onClick={() => {
                          setView('requests')
                        }}
                        className="w-full flex items-center gap-3 p-3 rounded-lg bg-zinc-800/60 hover:bg-zinc-800 border border-transparent hover:border-zinc-700 transition-all text-left"
                      >
                        <div className="w-9 h-9 rounded-lg bg-emerald-600/15 flex items-center justify-center shrink-0">
                          <UserCheck
                            size={16}
                            className="text-emerald-400"
                          />
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-medium text-white">
                            Join requests
                          </p>

                          <p className="text-[10px] text-zinc-500 mt-0.5">
                            Review people requesting access
                          </p>
                        </div>

                        <ChevronRight
                          size={14}
                          className="text-zinc-600"
                        />
                      </motion.button>

                      <div className="mt-2 px-2.5 py-2.5 rounded-lg bg-zinc-950 border border-zinc-800">
                        <p className="text-[9px] text-zinc-600 leading-4">
                          People who receive an invitation must request access before joining.
                        </p>
                      </div>
                    </motion.div>
                  )}

                  {view === 'invite' && (
                    <motion.div
                      key="invite"
                      initial={{
                        opacity: 0,
                        y: 6
                      }}
                      animate={{
                        opacity: 1,
                        y: 0
                      }}
                      exit={{
                        opacity: 0,
                        y: -6
                      }}
                      transition={{
                        duration: 0.15
                      }}
                      className="flex flex-col gap-3"
                    >
                      {!inviteSent ? (
                        <>
                          <div>
                            <p className="text-[11px] font-medium text-zinc-300">
                              Invite a member
                            </p>

                            <p className="text-[10px] text-zinc-600 mt-1">
                              Enter their email address.
                            </p>
                          </div>

                          <div className="relative">
                            <Mail
                              size={14}
                              className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600"
                            />

                            <input
                              autoFocus
                              type="email"
                              value={email}
                              onChange={(e) => {
                                setEmail(e.target.value)
                                setInviteError('')
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  sendInvitation()
                                }
                              }}
                              placeholder="name@example.com"
                              className="w-full h-10 pl-9 pr-3 bg-zinc-950 border border-zinc-800 focus:border-violet-500 rounded-lg outline-none text-xs text-white placeholder:text-zinc-600 transition-colors"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <button
                              onClick={() =>
                                setPermission('edit')
                              }
                              className={`h-9 flex items-center justify-center gap-2 rounded-lg border text-[10px] transition ${
                                permission === 'edit'
                                  ? 'bg-violet-600/15 border-violet-500/40 text-violet-300'
                                  : 'bg-zinc-950 border-zinc-800 text-zinc-500 hover:text-zinc-300'
                              }`}
                            >
                              <Pencil size={12} />
                              Can edit
                            </button>

                            <button
                              onClick={() =>
                                setPermission('view')
                              }
                              className={`h-9 flex items-center justify-center gap-2 rounded-lg border text-[10px] transition ${
                                permission === 'view'
                                  ? 'bg-violet-600/15 border-violet-500/40 text-violet-300'
                                  : 'bg-zinc-950 border-zinc-800 text-zinc-500 hover:text-zinc-300'
                              }`}
                            >
                              <Shield size={12} />
                              View only
                            </button>
                          </div>

                          {inviteError && (
                            <div className="flex items-start gap-2 p-2.5 rounded-lg bg-red-500/10 border border-red-500/20">
                              <AlertCircle
                                size={13}
                                className="text-red-400 mt-0.5 shrink-0"
                              />

                              <p className="text-[10px] text-red-300 leading-4">
                                {inviteError}
                              </p>
                            </div>
                          )}

                          <motion.button
                            whileHover={{
                              scale: email.trim()
                                ? 1.01
                                : 1
                            }}
                            whileTap={{
                              scale: email.trim()
                                ? 0.99
                                : 1
                            }}
                            onClick={sendInvitation}
                            disabled={
                              !email.trim() ||
                              sendingInvite
                            }
                            className="h-10 flex items-center justify-center gap-2 rounded-lg bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:hover:bg-violet-600 text-white text-xs font-medium transition-colors"
                          >
                            {sendingInvite ? (
                              <>
                                <Loader2
                                  size={14}
                                  className="animate-spin"
                                />
                                Sending invitation...
                              </>
                            ) : (
                              <>
                                <UserPlus size={14} />
                                Send invitation
                              </>
                            )}
                          </motion.button>
                        </>
                      ) : (
                        <motion.div
                          initial={{
                            opacity: 0,
                            scale: 0.96
                          }}
                          animate={{
                            opacity: 1,
                            scale: 1
                          }}
                          className="flex flex-col gap-3"
                        >
                          <div className="flex flex-col items-center py-2">
                            <div className="w-11 h-11 rounded-full bg-emerald-500/15 flex items-center justify-center">
                              <Check
                                size={19}
                                className="text-emerald-400"
                              />
                            </div>

                            <p className="text-xs font-medium text-white mt-3">
                              Invitation sent
                            </p>

                            <p className="text-[10px] text-zinc-500 mt-1 text-center">
                              {email}
                            </p>
                          </div>

                          {inviteLink && (
                            <div className="flex items-center gap-2 bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2">
                              <span className="flex-1 text-[10px] font-mono text-zinc-400 truncate">
                                {inviteLink}
                              </span>

                              <button
                                onClick={copyInvite}
                                className="w-7 h-7 flex items-center justify-center rounded-md text-zinc-500 hover:text-white hover:bg-zinc-800 transition"
                              >
                                {copied ? (
                                  <Check
                                    size={13}
                                    className="text-emerald-400"
                                  />
                                ) : (
                                  <Copy size={13} />
                                )}
                              </button>
                            </div>
                          )}

                          <button
                            onClick={resetInviteForm}
                            className="h-9 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs transition"
                          >
                            Invite another member
                          </button>
                        </motion.div>
                      )}
                    </motion.div>
                  )}

                  {view === 'requests' && (
                    <JoinRequests
                      projectId={projectId}
                    />
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

