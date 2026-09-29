import React, { useState } from 'react'
import { Bot, Bug, Sparkles, MessageSquare, WandSparkles, Send, Copy, Check, Play, Loader2 } from 'lucide-react'
import axios from 'axios'

const API_URL = 'http://localhost:5000'

const actions = [
  {
    id: 'debug',
    label: 'Debug',
    description: 'Find and fix errors',
    icon: Bug
  },
  {
    id: 'explain',
    label: 'Explain',
    description: 'Understand your code',
    icon: MessageSquare
  },
  {
    id: 'improve',
    label: 'Improve',
    description: 'Make your code better',
    icon: WandSparkles
  },
  {
    id: 'build',
    label: 'Generate',
    description: 'Create code from scratch',
    icon: Sparkles
  }
]

export default function AIAssistant({
  code = '',
  language = 'javascript',
  languageLabel = 'JavaScript',
  fileName = 'App.js',
  onApply
}) {
  const [selectedAction, setSelectedAction] = useState('debug')
  const [prompt, setPrompt] = useState('')
  const [result, setResult] = useState('')
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState('')

  const askAI = async () => {
    if (loading) return

    if (selectedAction === 'ask' && !prompt.trim()) return

    setLoading(true)
    setError('')
    setResult('')

    try {
      let instruction = prompt

      if (selectedAction === 'debug') {
        instruction = `Find and fix the errors in this ${languageLabel} code. Return only the complete corrected code. Do not use markdown or explanations.`
      }

      if (selectedAction === 'explain') {
        instruction = `Explain this ${languageLabel} code for a beginner. Explain what it does, how the important parts work, and any problems you notice. Do not rewrite the code.`
      }

      if (selectedAction === 'improve') {
        instruction = `Improve this ${languageLabel} code while keeping its behaviour. Return only the complete improved code. Do not use markdown or explanations.`
      }

      if (selectedAction === 'build') {
        instruction = prompt.trim()
          ? `Create complete ${languageLabel} code based on this request: ${prompt}`
          : `Generate a clean minimal starter program for ${languageLabel}. Return only valid code.`
      }

      const response = await axios.post(
        `${API_URL}/api/ai`,
        {
          action: selectedAction,
          prompt: instruction,
          code,
          language,
          languageLabel
        },
        {
          timeout: 90000
        }
      )

      if (!response.data?.success) {
        throw new Error(
          response.data?.message || 'AI request failed.'
        )
      }

      setResult(response.data.text || '')
    } catch (err) {
      setError(
        err.response?.data?.message ||
        err.message ||
        'Unable to connect to Codezy AI.'
      )
    } finally {
      setLoading(false)
    }
  }

  const copyResult = async () => {
    if (!result) return

    await navigator.clipboard.writeText(result)
    setCopied(true)

    setTimeout(() => {
      setCopied(false)
    }, 1500)
  }

  const applyResult = () => {
    if (!result || typeof onApply !== 'function') return

    const cleaned = result
      .replace(/^```[a-z0-9+#.-]*\s*\n?/i, '')
      .replace(/\n?```\s*$/i, '')
      .trim()

    onApply(cleaned)
  }

  return (
    <div className="w-full h-full min-h-0 bg-zinc-950 text-white flex flex-col">

      <div className="h-16 shrink-0 border-b border-zinc-800 px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
            <Bot size={19} className="text-violet-400" />
          </div>

          <div>
            <h1 className="text-sm font-semibold">
              Codezy AI
            </h1>
            <p className="text-[11px] text-zinc-500">
              AI coding assistant
            </p>
          </div>
        </div>

        <div className="text-xs text-zinc-500">
          {fileName} · {languageLabel}
        </div>
      </div>

      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-[230px_minmax(0,1fr)]">

        <aside className="border-r border-zinc-800 p-4 overflow-y-auto">
          <div className="text-[11px] uppercase tracking-wide text-zinc-600 font-semibold mb-3">
            AI Tools
          </div>

          <div className="space-y-1.5">
            {actions.map(action => {
              const Icon = action.icon
              const active = selectedAction === action.id

              return (
                <button
                  key={action.id}
                  onClick={() => {
                    setSelectedAction(action.id)
                    setResult('')
                    setError('')
                  }}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition ${
                    active
                      ? 'bg-violet-500/10 border border-violet-500/30'
                      : 'border border-transparent hover:bg-zinc-900'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    active
                      ? 'bg-violet-500/15'
                      : 'bg-zinc-900'
                  }`}>
                    <Icon
                      size={16}
                      className={
                        active
                          ? 'text-violet-400'
                          : 'text-zinc-500'
                      }
                    />
                  </div>

                  <div>
                    <div className="text-xs font-medium">
                      {action.label}
                    </div>

                    <div className="text-[10px] text-zinc-600 mt-0.5">
                      {action.description}
                    </div>
                  </div>
                </button>
              )
            })}

            <button
              onClick={() => {
                setSelectedAction('ask')
                setResult('')
                setError('')
              }}
              className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition ${
                selectedAction === 'ask'
                  ? 'bg-violet-500/10 border border-violet-500/30'
                  : 'border border-transparent hover:bg-zinc-900'
              }`}
            >
              <div className="w-8 h-8 rounded-lg bg-zinc-900 flex items-center justify-center">
                <Send size={15} className="text-zinc-500" />
              </div>

              <div>
                <div className="text-xs font-medium">
                  Ask AI
                </div>
                <div className="text-[10px] text-zinc-600 mt-0.5">
                  Ask anything about code
                </div>
              </div>
            </button>
          </div>
        </aside>

        <main className="min-w-0 min-h-0 flex flex-col">

          <div className="flex-1 min-h-0 grid grid-cols-1 xl:grid-cols-2">

            <div className="border-b xl:border-b-0 xl:border-r border-zinc-800 flex flex-col min-h-0">

              <div className="h-11 shrink-0 px-4 border-b border-zinc-800 flex items-center justify-between">
                <span className="text-xs text-zinc-400">
                  Your Code
                </span>

                <span className="text-[10px] text-zinc-600">
                  {languageLabel}
                </span>
              </div>

              <textarea
                value={code}
                readOnly
                className="flex-1 min-h-[220px] w-full resize-none outline-none bg-zinc-950 p-4 font-mono text-xs leading-6 text-zinc-300"
              />

            </div>

            <div className="flex flex-col min-h-0">

              <div className="h-11 shrink-0 px-4 border-b border-zinc-800 flex items-center justify-between">
                <span className="text-xs text-zinc-400">
                  AI Response
                </span>

                {result && (
                  <button
                    onClick={copyResult}
                    className="p-1.5 rounded-md hover:bg-zinc-900 text-zinc-500 hover:text-white"
                    title="Copy"
                  >
                    {copied
                      ? <Check size={14} className="text-green-400" />
                      : <Copy size={14} />
                    }
                  </button>
                )}
              </div>

              <div className="flex-1 min-h-[220px] overflow-y-auto p-5">

                {loading && (
                  <div className="h-full flex items-center justify-center">
                    <div className="flex flex-col items-center gap-3 text-zinc-500">
                      <Loader2
                        size={24}
                        className="animate-spin text-violet-400"
                      />
                      <span className="text-xs">
                        Codezy AI is thinking...
                      </span>
                    </div>
                  </div>
                )}

                {!loading && error && (
                  <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4 text-xs text-red-400">
                    {error}
                  </div>
                )}

                {!loading && !error && !result && (
                  <div className="h-full flex flex-col items-center justify-center text-center">
                    <div className="w-14 h-14 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center mb-4">
                      <Sparkles
                        size={24}
                        className="text-violet-400"
                      />
                    </div>

                    <h2 className="text-sm font-semibold text-zinc-200">
                      What can I help you with?
                    </h2>

                    <p className="max-w-sm text-xs text-zinc-600 mt-2 leading-5">
                      Debug, explain, improve or generate code using Codezy AI.
                    </p>
                  </div>
                )}

                {!loading && result && (
                  <pre className="whitespace-pre-wrap break-words font-mono text-xs leading-6 text-zinc-300">
                    {result}
                  </pre>
                )}

              </div>

            </div>

          </div>

          <div className="shrink-0 border-t border-zinc-800 p-4">

            {selectedAction === 'ask' || selectedAction === 'build' ? (
              <div className="flex gap-2">
                <input
                  value={prompt}
                  onChange={e => setPrompt(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      askAI()
                    }
                  }}
                  placeholder={
                    selectedAction === 'build'
                      ? 'Describe what you want to build...'
                      : 'Ask Codezy AI anything...'
                  }
                  className="flex-1 h-10 px-3 rounded-lg bg-zinc-900 border border-zinc-800 focus:border-violet-500/50 outline-none text-xs text-zinc-200 placeholder:text-zinc-600"
                />

                <button
                  onClick={askAI}
                  disabled={loading}
                  className="px-4 rounded-lg bg-violet-600 hover:bg-violet-500 disabled:opacity-50 flex items-center gap-2 text-xs font-medium"
                >
                  {loading
                    ? <Loader2 size={14} className="animate-spin" />
                    : <Send size={14} />
                  }
                  Ask
                </button>
              </div>
            ) : (
              <div className="flex justify-end">
                <button
                  onClick={askAI}
                  disabled={loading}
                  className="h-10 px-5 rounded-lg bg-violet-600 hover:bg-violet-500 disabled:opacity-50 flex items-center gap-2 text-xs font-semibold"
                >
                  {loading
                    ? <Loader2 size={14} className="animate-spin" />
                    : <Play size={14} />
                  }

                  {loading
                    ? 'Processing...'
                    : actions.find(a => a.id === selectedAction)?.label || 'Run AI'
                  }
                </button>
              </div>
            )}

            {result && (
              <div className="mt-2 flex justify-end">
                <button
                  onClick={applyResult}
                  className="text-[11px] text-violet-400 hover:text-violet-300"
                >
                  Apply result to editor
                </button>
              </div>
            )}

          </div>

        </main>
      </div>
    </div>
  )
}

