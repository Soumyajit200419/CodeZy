import React, { useEffect, useState } from 'react'
import {
  ArrowLeft,
  Check,
  Loader2,
  LogOut,
  Mail,
  User,
  Shield,
  Calendar,
  Code2,
  AlertCircle,
  Braces
} from 'lucide-react'

const API_URL = 'http://localhost:5000'

const dotGridStyle = {
  backgroundImage:
    'radial-gradient(rgba(139,92,246,0.18) 1px, transparent 1px)',
  backgroundSize: '22px 22px'
}

const glowStyle = {
  background:
    'radial-gradient(900px circle at 15% -10%, rgba(139,92,246,0.10), transparent 45%)'
}

const TerminalInput = ({ value, onChange, placeholder, type = 'text' }) => (
  <div className="flex items-center gap-2 border-b border-zinc-800 focus-within:border-violet-500 transition-colors py-2.5">
    <span className="text-zinc-700 font-mono text-sm select-none">{'>'}</span>
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      type={type}
      className="flex-1 bg-transparent outline-none text-sm text-white placeholder:text-zinc-600"
    />
  </div>
)

export const Account = ({ onClose, onLoginSuccess }) => {
  const [token, setToken] = useState(
    localStorage.getItem('codezy_token') || null
  )
  const [user, setUser] = useState(null)
  const [mode, setMode] = useState('login')
  const [loading, setLoading] = useState(!!token)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [name, setName] = useState('')
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  useEffect(() => {
    if (token) {
      loadUser()
    } else {
      setLoading(false)
    }
  }, [token])

  const apiRequest = async (url, options = {}) => {
    const headers = {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }

    const currentToken =
      localStorage.getItem('codezy_token') || token

    if (currentToken) {
      headers.Authorization = `Bearer ${currentToken}`
    }

    const response = await fetch(`${API_URL}${url}`, {
      ...options,
      headers
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.message || 'Something went wrong')
    }

    return data
  }

  const loadUser = async () => {
    try {
      setLoading(true)
      setError('')

      const response = await apiRequest('/api/auth/me')

      if (response.user) {
        setUser(response.user)
      }
    } catch (error) {
      localStorage.removeItem('codezy_token')
      setToken(null)
      setUser(null)
      setError('')
    } finally {
      setLoading(false)
    }
  }

  const handleLogin = async (e) => {
    e.preventDefault()

    if (!email.trim() || !password) {
      setError('Email/username and password are required')
      return
    }

    try {
      setSubmitting(true)
      setError('')

      const response = await fetch(
        `${API_URL}/api/auth/login`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            email: email.trim(),
            password
          })
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Login failed')
      }

      localStorage.setItem('codezy_token', data.token)

      setToken(data.token)
      setUser(data.user)

      if (onLoginSuccess) {
        onLoginSuccess(data.token, data.user)
      }
    } catch (error) {
      setError(error.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleRegister = async (e) => {
    e.preventDefault()

    if (
      !name.trim() ||
      !username.trim() ||
      !email.trim() ||
      !password
    ) {
      setError('Please fill in all fields')
      return
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    try {
      setSubmitting(true)
      setError('')

      const response = await fetch(
        `${API_URL}/api/auth/register`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            name: name.trim(),
            username: username.trim(),
            email: email.trim(),
            password
          })
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Registration failed')
      }

      localStorage.setItem('codezy_token', data.token)

      setToken(data.token)
      setUser(data.user)

      if (onLoginSuccess) {
        onLoginSuccess(data.token, data.user)
      }
    } catch (error) {
      setError(error.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleLogout = async () => {
    try {
      if (token) {
        await apiRequest('/api/auth/logout', {
          method: 'POST'
        })
      }
    } catch (error) {
      console.error('Logout error:', error.message)
    } finally {
      localStorage.removeItem('codezy_token')
      localStorage.removeItem('codezy_project_id')

      setToken(null)
      setUser(null)

      if (onLoginSuccess) {
        onLoginSuccess(null, null)
      }
    }
  }

  const formatDate = (date) => {
    if (!date) return 'Never'

    return new Date(date).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="fixed inset-0 z-[100] bg-zinc-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-zinc-500 font-mono text-xs">
          <Loader2 size={20} className="animate-spin text-violet-500" />
          <span>
            loading account<span className="animate-pulse">...</span>
          </span>
        </div>
      </div>
    )
  }

  if (user) {
    const accountFields = [
      { label: 'name', value: user.name, tone: 'string' },
      { label: 'username', value: `@${user.username}`, tone: 'string' },
      { label: 'email', value: user.email, tone: 'string' },
      { label: 'role', value: user.role || 'user', tone: 'string' },
      { label: 'verified', value: !!user.isVerified, tone: 'boolean' },
      { label: 'joined', value: formatDate(user.createdAt), tone: 'string' },
      { label: 'lastLogin', value: formatDate(user.lastLogin), tone: 'string' },
      ...(user.bio ? [{ label: 'bio', value: user.bio, tone: 'string' }] : [])
    ]

    return (
      <div className="fixed inset-0 z-[100] bg-zinc-950 text-white">
        <div className="absolute inset-0 z-0 pointer-events-none" style={glowStyle} />

        <div className="relative z-10 h-full overflow-y-auto">
          <div className="min-h-full flex items-center justify-center p-6">
            <div className="w-full max-w-md">

              <div className="flex items-center justify-between mb-6">
                <button
                  onClick={onClose}
                  className="flex items-center gap-2 text-zinc-500 hover:text-white text-xs transition-colors"
                >
                  <ArrowLeft size={15} />
                  Back to Codezy
                </button>

                <div className="flex items-center gap-2 font-mono">
                  <span className="w-6 h-6 bg-violet-600 rounded-md flex items-center justify-center text-xs font-bold">
                    C
                  </span>
                  <span className="text-sm font-semibold">Codezy</span>
                </div>
              </div>

              <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl backdrop-blur-sm">

                <div className="p-6 border-b border-zinc-800">
                  <div className="flex items-center gap-4">

                    <div className="w-20 h-20 rounded-full p-[2px] bg-gradient-to-br from-violet-500 via-fuchsia-500 to-amber-400 shrink-0">
                      <div className="w-full h-full rounded-full bg-zinc-950 flex items-center justify-center overflow-hidden">
                        {user.avatar ? (
                          <img
                            src={user.avatar}
                            alt={user.name}
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          <User size={30} className="text-violet-400" />
                        )}
                      </div>
                    </div>

                    <div className="min-w-0">
                      <h1 className="text-lg font-semibold truncate">
                        {user.name}
                      </h1>

                      <p className="text-xs text-zinc-500 truncate font-mono">
                        @{user.username}
                      </p>

                      <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                        {user.isVerified && (
                          <span className="flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 px-2 py-1 rounded-full">
                            <Check size={10} />
                            Verified
                          </span>
                        )}

                        <span className="text-[10px] text-zinc-400 bg-zinc-800 px-2 py-1 rounded-full capitalize">
                          {user.role || 'user'}
                        </span>
                      </div>
                    </div>

                  </div>
                </div>

                <div className="p-5">
                  <div className="rounded-xl border border-zinc-800 bg-zinc-950/70 overflow-hidden font-mono text-[11px]">

                    <div className="flex items-center gap-2 h-9 px-3 border-b border-zinc-800 bg-zinc-900/70">
                      <span className="flex gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-zinc-700" />
                        <span className="w-2.5 h-2.5 rounded-full bg-zinc-700" />
                        <span className="w-2.5 h-2.5 rounded-full bg-zinc-700" />
                      </span>
                      <Braces size={12} className="text-violet-400 ml-1" />
                      <span className="text-zinc-400">account.json</span>
                    </div>

                    <div className="flex">
                      <div className="select-none text-right text-zinc-700 py-3 px-3 border-r border-zinc-800/80">
                        {Array.from({ length: accountFields.length + 2 }).map((_, i) => (
                          <div key={i} className="leading-6">{i + 1}</div>
                        ))}
                      </div>

                      <div className="flex-1 py-3 px-3 overflow-x-auto">
                        <div className="leading-6 text-zinc-500">{'{'}</div>

                        {accountFields.map((f) => (
                          <div key={f.label} className="leading-6 flex items-baseline gap-2">
                            <span className="text-violet-400">{f.label}</span>
                            <span className="text-zinc-600">:</span>
                            <span className={f.tone === 'boolean' ? 'text-amber-300' : 'text-emerald-300'}>
                              {f.tone === 'boolean' ? String(f.value) : `"${f.value}"`}
                            </span>
                          </div>
                        ))}

                        <div className="leading-6 text-zinc-500">{'}'}</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-5 pt-0">
                  <button
                    onClick={handleLogout}
                    className="w-full h-10 flex items-center justify-center gap-2 rounded-lg bg-red-500/10 hover:bg-red-500/15 border border-red-500/20 text-red-400 text-xs font-medium transition-colors"
                  >
                    <LogOut size={14} />
                    Logout
                  </button>
                </div>

              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-[100] bg-zinc-950 text-white">
      <div className="absolute inset-0 z-0 pointer-events-none" style={glowStyle} />

      <div className="relative z-10 h-full overflow-y-auto">
        <div className="absolute top-0 left-0 right-0 h-14 flex items-center px-6 z-20">
          <button
            onClick={onClose}
            className="flex items-center gap-2 text-zinc-500 hover:text-white text-xs transition-colors"
          >
            <ArrowLeft size={15} />
            Back to Codezy
          </button>
        </div>

        <div className="min-h-full grid lg:grid-cols-2">

          <div
            className="hidden lg:flex flex-col justify-between p-12 border-r border-zinc-900 relative overflow-hidden"
            style={dotGridStyle}
          >
            <div className="pt-8">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-3xl font-mono font-bold tracking-tight">
                  Codezy
                </span>
                <span className="w-[2px] h-7 bg-violet-400 animate-pulse" />
              </div>

              <p className="text-sm text-zinc-500 max-w-xs leading-relaxed">
                Write, run and ship projects from any browser. Your code,
                your cloud.
              </p>
            </div>

            <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 shadow-2xl overflow-hidden font-mono text-xs">
              <div className="flex items-center gap-1.5 h-8 px-3 border-b border-zinc-800">
                <span className="w-2 h-2 rounded-full bg-zinc-700" />
                <span className="w-2 h-2 rounded-full bg-zinc-700" />
                <span className="w-2 h-2 rounded-full bg-zinc-700" />
                <span className="ml-2 text-[10px] text-zinc-600">main.js</span>
              </div>

              <div className="p-4 space-y-1 leading-6">
                <div>
                  <span className="text-purple-400">import</span>{' '}
                  <span className="text-zinc-300">{'{ deploy }'}</span>{' '}
                  <span className="text-purple-400">from</span>{' '}
                  <span className="text-emerald-300">'codezy'</span>
                </div>
                <div>&nbsp;</div>
                <div>
                  <span className="text-blue-400">function</span>{' '}
                  <span className="text-yellow-300">shipIt</span>() {'{'}
                </div>
                <div className="pl-4">
                  <span className="text-purple-400">return</span>{' '}
                  <span className="text-yellow-300">deploy</span>
                  (<span className="text-zinc-300">project</span>)
                </div>
                <div>{'}'}</div>
              </div>
            </div>

            <p className="text-[11px] text-zinc-700">
              © {new Date().getFullYear()} Codezy
            </p>
          </div>

          <div className="flex items-center justify-center p-6 lg:p-12">
            <div className="w-full max-w-sm">

              <div className="lg:hidden mb-8 flex items-center gap-2 pt-8">
                <span className="text-2xl font-mono font-bold">Codezy</span>
                <span className="w-[2px] h-5 bg-violet-400 animate-pulse" />
              </div>

              <div className="flex items-center gap-6 border-b border-zinc-800 mb-8">
                <button
                  onClick={() => {
                    setMode('login')
                    setError('')
                  }}
                  className={`relative pb-3 text-sm transition-colors ${
                    mode === 'login'
                      ? 'text-white'
                      : 'text-zinc-600 hover:text-zinc-400'
                  }`}
                >
                  Sign in
                  {mode === 'login' && (
                    <span className="absolute left-0 right-0 -bottom-px h-[2px] bg-violet-500 rounded-full" />
                  )}
                </button>

                <button
                  onClick={() => {
                    setMode('register')
                    setError('')
                  }}
                  className={`relative pb-3 text-sm transition-colors ${
                    mode === 'register'
                      ? 'text-white'
                      : 'text-zinc-600 hover:text-zinc-400'
                  }`}
                >
                  Create account
                  {mode === 'register' && (
                    <span className="absolute left-0 right-0 -bottom-px h-[2px] bg-violet-500 rounded-full" />
                  )}
                </button>
              </div>

              <h1 className="text-xl font-semibold mb-1">
                {mode === 'login' ? 'Welcome back' : 'Create your account'}
              </h1>

              <p className="text-xs text-zinc-500 mb-6">
                {mode === 'login'
                  ? 'Sign in to continue to Codezy.'
                  : 'Save your projects and pick up where you left off.'}
              </p>

              {error && (
                <div className="flex items-start gap-2 p-3 mb-5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-mono">
                  <AlertCircle size={14} className="shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <form
                onSubmit={mode === 'login' ? handleLogin : handleRegister}
                className="space-y-1"
              >
                {mode === 'register' && (
                  <>
                    <TerminalInput
                      value={name}
                      onChange={setName}
                      placeholder="Full name"
                    />
                    <TerminalInput
                      value={username}
                      onChange={setUsername}
                      placeholder="Username"
                    />
                  </>
                )}

                <TerminalInput
                  value={email}
                  onChange={setEmail}
                  placeholder={mode === 'login' ? 'Email or username' : 'Email'}
                  type={mode === 'login' ? 'text' : 'email'}
                />

                <TerminalInput
                  value={password}
                  onChange={setPassword}
                  placeholder="Password"
                  type="password"
                />

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full h-11 flex items-center justify-center gap-2 mt-6 rounded-lg bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-sm font-medium transition-colors shadow-lg shadow-violet-600/20"
                >
                  {submitting ? (
                    <>
                      <Loader2 size={15} className="animate-spin" />
                      Please wait...
                    </>
                  ) : mode === 'login' ? (
                    'Sign in'
                  ) : (
                    'Create account'
                  )}
                </button>
              </form>

              <div className="flex items-center gap-3 my-6">
                <div className="h-px flex-1 bg-zinc-800" />
                <span className="text-[10px] font-mono text-zinc-700">or</span>
                <div className="h-px flex-1 bg-zinc-800" />
              </div>

              <button
                onClick={() => {
                  setMode(mode === 'login' ? 'register' : 'login')
                  setError('')
                }}
                className="w-full h-10 rounded-lg border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900 text-zinc-400 hover:text-white text-xs transition-colors"
              >
                {mode === 'login'
                  ? 'Create a new account'
                  : 'Already have an account? Sign in'}
              </button>

            </div>
          </div>
        </div>
      </div>
    </div>
  )
}