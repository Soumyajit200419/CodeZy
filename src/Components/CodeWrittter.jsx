// CodeWriter.jsx
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Play,
  Copy,
  Maximize2,
  Sparkles,
  RotateCcw,
  Save,
  Check,
  Bot,
  Users,
  Circle,
  Loader2,
  PenLine,
  WandSparkles,
  X,
  Send,
  ArrowRight,
  Bug,
  MessageSquare,
  FileCode2,
  LayoutTemplate,
  Trash2,
  Crown
} from 'lucide-react'
import axios from 'axios'
import Members from './Members'
import { LANGUAGES, resolveLanguage } from './languages'

const API_URL = 'http://localhost:5000'

const authHeaders = () => {
  const token = localStorage.getItem('codezy_token')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

const AVATAR_COLORS = [
  'bg-indigo-500',
  'bg-emerald-500',
  'bg-rose-500',
  'bg-sky-500',
  'bg-amber-500',
  'bg-fuchsia-500',
  'bg-teal-500'
]

const colorFor = (seed = '') => {
  let hash = 0
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) | 0
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

const initialsOf = (name = '') =>
  String(name)
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map(part => part[0]?.toUpperCase() || '')
    .join('') || '?'

const personName = user => user?.name || user?.username || user?.email || 'Unknown'

const LINE_HEIGHT = 24
const GUTTER_WIDTH = 56
const EDITOR_PADDING = 16

const cleanAIResponse = (text = '') =>
  String(text)
    .replace(/^```[a-z0-9+#.-]*\s*\n?/i, '')
    .replace(/\n?```\s*$/i, '')
    .trim()

const isCodeResponse = (text = '', action = '') => {
  const value = String(text).trim()
  if (!value) return false
  if (action === 'explain') return false
  if (action === 'build' || action === 'improve' || action === 'debug') return true

  if (value.includes('Problem:') || value.includes('Why:') || value.includes('Fix:')) {
    return false
  }

  return /(^|\n)\s*(import |from |function |const |let |var |return |#include|public class|def |fn main|package main|<\?php|class |print\(|console\.log|puts |echo )/.test(value)
}

const normalizeRunResult = (result, fallback = {}) => {
  const data = result?.data || result || {}

  return {
    success: Boolean(data.success),
    fileName: data.fileName || fallback.fileName || 'App.js',
    language: data.language || fallback.languageLabel || 'JavaScript',
    extension: data.extension || fallback.extension || 'js',
    stdout: data.stdout || '',
    stderr: data.stderr || '',
    compileOutput: data.compileOutput || '',
    errorLine: data.errorLine ?? null,
    exitCode: data.exitCode ?? null,
    executionTime: data.executionTime ?? null,
    message: data.message || (data.success ? 'Execution completed successfully.' : 'Execution failed.')
  }
}

const AI_ACTIONS = [
  { id: 'debug', label: 'Debug', description: 'Find and fix errors', icon: Bug, text: 'text-red-400' },
  { id: 'explain', label: 'Explain', description: 'Understand your code', icon: MessageSquare, text: 'text-sky-400' },
  { id: 'improve', label: 'Improve', description: 'Make your code better', icon: WandSparkles, text: 'text-indigo-400' },
  { id: 'build', label: 'Template', description: 'Generate a starter file', icon: LayoutTemplate, text: 'text-amber-400' },
  { id: 'ask', label: 'Ask AI', description: 'Ask anything about code', icon: Send, text: 'text-emerald-400' }
]

function Avatar({ user, size = 'w-6 h-6', text = 'text-[10px]', owner = false }) {
  const seed = String(user?._id || user?.email || '')
  return (
    <div className="relative shrink-0">
      <div
        title={personName(user)}
        className={`${size} ${text} ${colorFor(seed)} rounded-full ring-2 ring-zinc-950 flex items-center justify-center font-semibold text-white`}
      >
        {initialsOf(personName(user))}
      </div>
      {owner && (
        <span className="absolute -top-1.5 -right-1 w-3.5 h-3.5 rounded-full bg-amber-400 ring-2 ring-zinc-950 flex items-center justify-center">
          <Crown size={8} className="text-zinc-950" />
        </span>
      )}
    </div>
  )
}

export default function CodeWriter({
  code,
  onCodeChange,
  language = 'javascript',
  onLanguageChange,
  errorLine,
  onRun,
  onOutput,
  currentFile,
  onDeleteFile,
  projectId
}) {
  const active = useMemo(() => resolveLanguage(language), [language])
  const ActiveIcon = active.Icon || FileCode2

  const [languageInput, setLanguageInput] = useState(active.label)
  const [agentOpen, setAgentOpen] = useState(false)
  const [presenceOpen, setPresenceOpen] = useState(false)
  const [running, setRunning] = useState(false)
  const [saved, setSaved] = useState(false)
  const [copied, setCopied] = useState(false)
  const [autoWriting, setAutoWriting] = useState(false)
  const [templateLoading, setTemplateLoading] = useState(false)
  const [caret, setCaret] = useState({ line: 1, column: 1 })
  const [scrollTop, setScrollTop] = useState(0)

  const [teamData, setTeamData] = useState({ owner: null, members: [] })

  const [selectedAction, setSelectedAction] = useState('debug')
  const [aiPrompt, setAiPrompt] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState('')
  const [aiResult, setAiResult] = useState('')
  const [aiAction, setAiAction] = useState('')
  const [resultCopied, setResultCopied] = useState(false)
  const [justAdded, setJustAdded] = useState(false)

  const [localErrorLine, setLocalErrorLine] = useState(null)
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false)
  const [deletingFile, setDeletingFile] = useState(false)
  const [fileOpenedBanner, setFileOpenedBanner] = useState(null)

  const containerRef = useRef(null)
  const textareaRef = useRef(null)
  const aiInputRef = useRef(null)
  const presenceRef = useRef(null)
  const deleteRef = useRef(null)

  const typingTimer = useRef(null)
  const savedTimer = useRef(null)
  const copiedTimer = useRef(null)
  const resultCopiedTimer = useRef(null)
  const addedTimer = useRef(null)
  const fileBannerTimer = useRef(null)
  const lastFileIdRef = useRef(null)

  const mounted = useRef(true)
  const templateCache = useRef({})

  const currentCode = String(code || '')
  const lines = useMemo(() => currentCode.split('\n'), [currentCode])

  const teamList = useMemo(
    () => [teamData.owner, ...teamData.members].filter(Boolean),
    [teamData]
  )
  const memberCount = teamList.length

  const languageLabel = active.label
  const extension = active.ext
  const fileName = currentFile?.name || `App.${extension}`
  const displayedErrorLine = errorLine || localErrorLine
  const busy = running || autoWriting || templateLoading

  useEffect(() => {
    setLanguageInput(active.label)
  }, [active.label])

  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
      clearInterval(typingTimer.current)
      clearTimeout(savedTimer.current)
      clearTimeout(copiedTimer.current)
      clearTimeout(resultCopiedTimer.current)
      clearTimeout(addedTimer.current)
      clearTimeout(fileBannerTimer.current)
    }
  }, [])

  useEffect(() => {
    if (!projectId) return

    const token = localStorage.getItem('codezy_token')
    if (!token) return

    const controller = new AbortController()

    fetch(`${API_URL}/api/projects/${encodeURIComponent(projectId)}/members`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: controller.signal
    })
      .then(response => (response.ok ? response.json() : null))
      .then(data => {
        if (data) setTeamData({ owner: data.owner || null, members: data.members || [] })
      })
      .catch(error => {
        if (error.name !== 'AbortError') console.error('Load team error:', error)
      })

    return () => controller.abort()
  }, [projectId])

  useEffect(() => {
    if (!presenceOpen) return
    const handleClick = event => {
      if (!presenceRef.current?.contains(event.target)) setPresenceOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [presenceOpen])

  useEffect(() => {
    if (!confirmDeleteOpen) return
    const handleClick = event => {
      if (!deleteRef.current?.contains(event.target)) setConfirmDeleteOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [confirmDeleteOpen])

  useEffect(() => {
    if (!agentOpen) return
    const handleKey = event => {
      if (event.key === 'Escape') setAgentOpen(false)
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [agentOpen])

  const updateCode = useCallback(
    value => {
      if (typeof onCodeChange === 'function') onCodeChange(value)
    },
    [onCodeChange]
  )

  const autoWrite = useCallback(
    text =>
      new Promise(resolve => {
        const target = String(text || '')

        if (!target) {
          resolve()
          return
        }

        clearInterval(typingTimer.current)
        setAutoWriting(true)

        let index = 0
        const step = Math.max(1, Math.ceil(target.length / 400))

        typingTimer.current = setInterval(() => {
          if (!mounted.current) {
            clearInterval(typingTimer.current)
            resolve()
            return
          }

          index = Math.min(index + step, target.length)
          updateCode(target.slice(0, index))

          if (index >= target.length) {
            clearInterval(typingTimer.current)
            typingTimer.current = null
            setAutoWriting(false)
            resolve()
          }
        }, 12)
      }),
    [updateCode]
  )

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(currentCode)
      setCopied(true)
      clearTimeout(copiedTimer.current)
      copiedTimer.current = setTimeout(() => setCopied(false), 1500)
    } catch (error) {
      console.error('Copy failed:', error)
    }
  }

  const saveCode = () => {
    setSaved(true)
    clearTimeout(savedTimer.current)
    savedTimer.current = setTimeout(() => setSaved(false), 2000)
  }

  const updateCaret = event => {
    const textarea = event.target
    const before = textarea.value.slice(0, textarea.selectionStart)
    const split = before.split('\n')

    setCaret({
      line: split.length,
      column: split[split.length - 1].length + 1
    })
  }

  const handleEditorKeyDown = event => {
    if (event.key !== 'Tab') return

    event.preventDefault()
    const textarea = event.target
    const { selectionStart, selectionEnd, value } = textarea

    const next = `${value.slice(0, selectionStart)}  ${value.slice(selectionEnd)}`
    updateCode(next)

    requestAnimationFrame(() => {
      textarea.selectionStart = textarea.selectionEnd = selectionStart + 2
    })
  }

  const handleConfirmDelete = async () => {
    if (!currentFile || typeof onDeleteFile !== 'function') {
      setConfirmDeleteOpen(false)
      return
    }

    try {
      setDeletingFile(true)
      await onDeleteFile(currentFile)
      setConfirmDeleteOpen(false)
    } catch (error) {
      console.error('Delete file error:', error)
    } finally {
      if (mounted.current) setDeletingFile(false)
    }
  }

  const requestTemplate = async targetLanguage => {
    setTemplateLoading(true)
    setAiError('')

    try {
      const response = await axios.post(
        `${API_URL}/api/ai`,
        {
          action: 'build',
          prompt: `
Generate a minimal clean starter program for ${targetLanguage.label}.

Rules:
- Return only valid ${targetLanguage.label} code.
- Do not use markdown.
- Do not use code fences.
- Do not add an explanation.
- Do not add an introduction.
- Do not add a description.
- Do not add a "what to build next" comment.
- Do not add unnecessary comments.
- Keep the code short.
- Include the normal entry point for the language when applicable.
- The result must be directly executable or usable as a starter file.
          `.trim(),
          code: '',
          language: targetLanguage.id,
          languageLabel: targetLanguage.label
        },
        { timeout: 90000, headers: authHeaders() }
      )

      if (!response.data?.success) {
        throw new Error(response.data?.message || 'Template request failed.')
      }

      const cleaned = cleanAIResponse(response.data?.text || '')

      if (!cleaned) {
        throw new Error('Codezy AI returned an empty template.')
      }

      templateCache.current[targetLanguage.id] = cleaned
      await autoWrite(cleaned)
    } catch (error) {
      console.error('Template error:', error)
      setAiError(
        error.response?.data?.message ||
          error.message ||
          'Unable to generate a template. Check that the server is running.'
      )
    } finally {
      if (mounted.current) setTemplateLoading(false)
    }
  }

  const commitLanguage = async () => {
    const typed = languageInput.trim()
    if (!typed || busy) return

    const next = resolveLanguage(typed)
    setLanguageInput(next.label)
    setLocalErrorLine(null)

    if (typeof onLanguageChange === 'function') onLanguageChange(next.id)

    const cached = templateCache.current[next.id]

    if (cached) {
      updateCode(cached)
      return
    }

    await requestTemplate(next)
  }

  const handleLanguageKeyDown = event => {
    if (event.key === 'Enter') {
      event.preventDefault()
      commitLanguage()
    }

    if (event.key === 'Escape') {
      setLanguageInput(active.label)
      event.target.blur()
    }
  }

  const regenerateTemplate = () => {
    if (busy) return

    const cached = templateCache.current[active.id]

    if (cached && cached === currentCode) {
      delete templateCache.current[active.id]
      requestTemplate(active)
      return
    }

    if (cached) {
      clearInterval(typingTimer.current)
      setAutoWriting(false)
      setLocalErrorLine(null)
      updateCode(cached)
      return
    }

    requestTemplate(active)
  }

  useEffect(() => {
    const fileId = currentFile?._id || currentFile?.id
    if (!fileId) return
    if (lastFileIdRef.current === fileId) return

    lastFileIdRef.current = fileId

    setFileOpenedBanner({
      name: currentFile.name || fileName,
      language: active.label
    })

    clearTimeout(fileBannerTimer.current)
    fileBannerTimer.current = setTimeout(() => {
      if (mounted.current) setFileOpenedBanner(null)
    }, 2600)

    const hasContent = String(currentFile.content || '').trim().length > 0

    if (!hasContent && !currentCode.trim() && !busy) {
      requestTemplate(active)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentFile])

  const runAIAction = async (action, instruction) => {
    setAiLoading(true)
    setAiError('')
    setAiResult('')
    setAiAction(action)

    try {
      const response = await axios.post(
        `${API_URL}/api/ai`,
        {
          action,
          prompt: instruction,
          code: currentCode,
          language: active.id,
          languageLabel
        },
        { timeout: 90000, headers: authHeaders() }
      )

      if (!response.data?.success) {
        throw new Error(response.data?.message || 'Request failed.')
      }

      const text = response.data?.text || ''
      setAiResult(text)
      return text
    } catch (error) {
      console.error('AI error:', error)
      setAiError(
        error.response?.data?.message ||
          error.message ||
          'Unable to reach the AI service. Check that the server is running.'
      )
      return ''
    } finally {
      if (mounted.current) setAiLoading(false)
    }
  }

  const askAI = async () => {
    if (aiLoading) return

    if (selectedAction === 'ask' && !aiPrompt.trim()) return

    if (selectedAction !== 'ask' && !currentCode.trim() && selectedAction !== 'build') {
      setAiError(`There is no code to ${selectedAction} yet.`)
      return
    }

    let instruction = aiPrompt

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
      instruction = aiPrompt.trim()
        ? `Create complete ${languageLabel} code based on this request: ${aiPrompt}`
        : `Generate a clean minimal starter program for ${languageLabel}. Return only valid code.`
    }

    if (selectedAction === 'ask') {
      instruction = aiPrompt.trim()
    }

    await runAIAction(selectedAction, instruction)
  }

  const handleAIKeyDown = event => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      askAI()
    }
  }

  const copyResult = async () => {
    if (!aiResult) return

    try {
      await navigator.clipboard.writeText(aiResult)
      setResultCopied(true)
      clearTimeout(resultCopiedTimer.current)
      resultCopiedTimer.current = setTimeout(() => setResultCopied(false), 1500)
    } catch (error) {
      console.error('Copy failed:', error)
    }
  }

  const applyAIResult = async () => {
    const cleaned = cleanAIResponse(aiResult)

    if (!cleaned || !isCodeResponse(cleaned, aiAction)) return

    await autoWrite(cleaned)
    setJustAdded(true)

    clearTimeout(addedTimer.current)
    addedTimer.current = setTimeout(() => {
      if (mounted.current) setJustAdded(false)
    }, 1500)
  }

  const runCode = async () => {
    if (running || autoWriting) return

    setRunning(true)
    setLocalErrorLine(null)

    const runData = {
      code: currentCode,
      language: active.id,
      languageLabel,
      fileName,
      extension
    }

    const emit = payload => {
      const normalized = normalizeRunResult(payload, runData)
      if (normalized.errorLine) setLocalErrorLine(normalized.errorLine)
      if (typeof onOutput === 'function') onOutput(normalized)
    }

    if (!currentCode.trim()) {
      emit({
        success: false,
        stderr: 'No code to execute.',
        message: 'Write some code before running.'
      })
      setRunning(false)
      return
    }

    try {
      if (typeof onRun === 'function') {
        const result = await onRun(runData)
        if (result !== undefined) emit(result)
        return
      }

      const response = await axios.post(`${API_URL}/api/run`, runData, {
        timeout: 30000,
        headers: authHeaders()
      })
      emit(response.data)
    } catch (error) {
      console.error('Run error:', error)
      const data = error.response?.data || {}

      emit({
        success: false,
        stdout: data.stdout || '',
        stderr: data.stderr || error.message || 'Unable to execute code.',
        compileOutput: data.compileOutput || '',
        errorLine: data.errorLine ?? null,
        exitCode: data.exitCode ?? null,
        executionTime: data.executionTime ?? null,
        message: data.message || error.message || 'Unable to execute code.'
      })
    } finally {
      if (mounted.current) setRunning(false)
    }
  }

  const focusAI = () => {
    setAgentOpen(true)
    setTimeout(() => aiInputRef.current?.focus(), 100)
  }

  const selectAction = actionId => {
    setSelectedAction(actionId)
    setAiResult('')
    setAiError('')
    setAiPrompt('')
  }

  const toggleFullscreen = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen?.()
    } else {
      containerRef.current?.requestFullscreen?.()
    }
  }

  const activeActionMeta = AI_ACTIONS.find(a => a.id === selectedAction)

  const iconBtn =
    'w-8 h-8 flex items-center justify-center rounded-md text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 active:bg-zinc-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed'

  const primaryBtn =
    'flex items-center justify-center gap-2 rounded-md bg-indigo-500 hover:bg-indigo-400 active:bg-indigo-600 text-white text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed'

  return (
    <div
      ref={containerRef}
      className="w-full h-full bg-zinc-950 text-zinc-100 overflow-hidden flex flex-col relative font-sans"
    >
      <div className="relative z-40 h-14 shrink-0 border-b border-zinc-800 bg-zinc-950 flex items-center justify-between px-4 gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex items-center gap-2 shrink-0 min-w-0 h-9 bg-zinc-900 border border-zinc-800 rounded-md pl-2.5 pr-1">
            <ActiveIcon size={14} className={active.color || 'text-indigo-400'} />

            <div className="text-[13px] font-medium text-zinc-100 truncate max-w-[160px]">
              {fileName}
            </div>

            <div className="relative" ref={deleteRef}>
              <button
                onClick={() => currentFile && setConfirmDeleteOpen(value => !value)}
                disabled={!currentFile || deletingFile}
                title={currentFile ? 'Remove this file' : 'No file open'}
                className="w-7 h-7 flex items-center justify-center rounded text-zinc-500 hover:text-red-400 hover:bg-zinc-800 transition-colors disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent"
              >
                <Trash2 size={13} />
              </button>

              {confirmDeleteOpen && currentFile && (
                <div className="absolute left-0 top-11 w-64 rounded-lg border border-zinc-800 bg-zinc-900 shadow-xl shadow-black/50 z-50 p-4">
                  <p className="text-[13px] text-zinc-300 mb-4 leading-5">
                    Remove <span className="text-white font-medium">{currentFile.name}</span>? This can't be undone.
                  </p>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleConfirmDelete}
                      disabled={deletingFile}
                      className="flex-1 h-8 rounded-md bg-red-500 hover:bg-red-400 disabled:opacity-50 text-white text-xs font-medium transition-colors flex items-center justify-center gap-1.5"
                    >
                      {deletingFile ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                      Remove
                    </button>

                    <button
                      onClick={() => setConfirmDeleteOpen(false)}
                      disabled={deletingFile}
                      className="flex-1 h-8 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <div className="relative">
              <ActiveIcon
                size={13}
                className={`absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none ${active.color || 'text-indigo-400'}`}
              />

              <input
                value={languageInput}
                onChange={event => setLanguageInput(event.target.value)}
                onKeyDown={handleLanguageKeyDown}
                list="codezy-language-options"
                spellCheck={false}
                autoComplete="off"
                disabled={busy}
                placeholder="e.g. Python, Rust, Kotlin…"
                aria-label="Language"
                className="w-48 h-9 pl-8 pr-3 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 focus:border-indigo-500 rounded-md text-xs text-zinc-200 placeholder:text-zinc-600 outline-none transition-colors disabled:opacity-50"
              />

              <datalist id="codezy-language-options">
                {LANGUAGES.map(item => (
                  <option key={item.id} value={item.label} />
                ))}
              </datalist>
            </div>

            <button
              onClick={commitLanguage}
              disabled={busy || !languageInput.trim()}
              title="Generate starter template"
              className="h-9 flex items-center gap-1.5 px-3 rounded-md bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed text-zinc-200 text-xs font-medium transition-colors"
            >
              {templateLoading ? <Loader2 size={13} className="animate-spin" /> : <ArrowRight size={13} />}
              <span className="hidden sm:inline">Submit</span>
            </button>
          </div>

          {fileOpenedBanner && (
            <div className="hidden lg:flex items-center gap-1.5 px-2.5 h-7 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs">
              <Check size={12} />
              Opened {fileOpenedBanner.name}
            </div>
          )}

          {displayedErrorLine && (
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 h-7 rounded-md bg-red-500/10 border border-red-500/25 text-red-400 text-xs">
              <Circle size={6} fill="currentColor" />
              Error on line {displayedErrorLine}
            </div>
          )}

          {(autoWriting || templateLoading) && (
            <div className="hidden lg:flex items-center gap-1.5 px-2.5 h-7 rounded-md bg-indigo-500/10 border border-indigo-500/25 text-indigo-300 text-xs">
              <Sparkles size={12} />
              {templateLoading ? 'Generating template' : 'Writing to editor'}
            </div>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <div className="relative" ref={presenceRef}>
            <button
              onClick={() => setPresenceOpen(value => !value)}
              className="hidden md:flex items-center gap-2.5 h-9 pl-2.5 pr-3 rounded-md bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 transition-colors"
              title="Project members"
            >
              <Users size={14} className="text-zinc-400" />

              <div className="flex -space-x-2">
                {teamList.slice(0, 4).map((item, index) => (
                  <Avatar
                    key={item._id || index}
                    user={item}
                    size="w-6 h-6"
                    text="text-[9px]"
                    owner={index === 0 && item === teamData.owner}
                  />
                ))}

                {memberCount > 4 && (
                  <div className="w-6 h-6 rounded-full bg-zinc-800 ring-2 ring-zinc-950 flex items-center justify-center text-[9px] font-semibold text-zinc-300">
                    +{memberCount - 4}
                  </div>
                )}
              </div>

              <span className="text-xs text-zinc-300 font-medium">{memberCount}</span>
            </button>

            {presenceOpen && (
              <div className="absolute right-0 top-11 w-[340px] rounded-lg border border-zinc-800 bg-zinc-900 shadow-xl shadow-black/50 z-50 overflow-hidden">
                <Members projectId={projectId} onLoaded={setTeamData} />
              </div>
            )}
          </div>

          <div className="w-px h-5 bg-zinc-800 mx-1.5" />

          <button onClick={copyCode} className={iconBtn} title="Copy code">
            {copied ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
          </button>

          <button onClick={regenerateTemplate} disabled={busy} className={iconBtn} title="Restore starter template">
            <RotateCcw size={16} />
          </button>

          <button onClick={saveCode} className={iconBtn} title="Save">
            {saved ? <Check size={16} className="text-emerald-400" /> : <Save size={16} />}
          </button>

          <button onClick={focusAI} className={`${iconBtn} !text-indigo-400 hover:!text-indigo-300`} title="AI assistant">
            <PenLine size={16} />
          </button>

          <button onClick={toggleFullscreen} className={iconBtn} title="Fullscreen">
            <Maximize2 size={16} />
          </button>

          <div className="w-px h-5 bg-zinc-800 mx-1.5" />

          <button onClick={runCode} disabled={busy} className={`${primaryBtn} h-9 pl-3.5 pr-4`}>
            {running ? <Loader2 size={14} className="animate-spin" /> : <Play size={13} fill="currentColor" />}
            {running ? 'Running' : 'Run'}
          </button>
        </div>
      </div>

      <div className="relative z-10 flex-1 min-h-0 overflow-hidden">
        <div className="absolute inset-0 flex">
          <div
            className="shrink-0 bg-zinc-950 border-r border-zinc-800 text-right select-none overflow-hidden"
            style={{ width: GUTTER_WIDTH }}
          >
            <div style={{ paddingTop: EDITOR_PADDING, transform: `translateY(-${scrollTop}px)` }}>
              {lines.map((_, index) => {
                const lineNumber = index + 1
                const isError = displayedErrorLine === lineNumber
                const isCurrent = caret.line === lineNumber

                return (
                  <div
                    key={lineNumber}
                    style={{ height: LINE_HEIGHT }}
                    className={`pr-4 text-xs leading-6 font-mono ${
                      isError
                        ? 'text-red-400 bg-red-500/10 font-semibold'
                        : isCurrent
                        ? 'text-zinc-200'
                        : 'text-zinc-600'
                    }`}
                  >
                    {lineNumber}
                  </div>
                )
              })}
            </div>
          </div>

          <div className="flex-1 min-w-0 relative">
            <div className="absolute inset-0 overflow-hidden pointer-events-none" style={{ paddingTop: EDITOR_PADDING }}>
              <div style={{ transform: `translateY(-${scrollTop}px)` }}>
                {lines.map((_, index) => {
                  const lineNumber = index + 1
                  const isError = displayedErrorLine === lineNumber
                  const isCurrent = caret.line === lineNumber

                  return (
                    <div
                      key={lineNumber}
                      style={{ height: LINE_HEIGHT }}
                      className={
                        isError
                          ? 'bg-red-500/10 border-l-2 border-red-500'
                          : isCurrent
                          ? 'bg-zinc-900 border-l-2 border-indigo-500'
                          : undefined
                      }
                    />
                  )
                })}
              </div>
            </div>

            <textarea
              ref={textareaRef}
              value={currentCode}
              onChange={event => updateCode(event.target.value)}
              onScroll={event => setScrollTop(event.currentTarget.scrollTop)}
              onClick={updateCaret}
              onKeyUp={updateCaret}
              onKeyDown={handleEditorKeyDown}
              spellCheck={false}
              autoCapitalize="off"
              autoCorrect="off"
              placeholder={`Type a language above and press Submit to generate a ${languageLabel} starter template…`}
              className="absolute inset-0 w-full h-full resize-none outline-none bg-transparent text-zinc-200 font-mono text-sm leading-6 p-4 whitespace-pre overflow-auto caret-indigo-400 selection:bg-indigo-500/30 placeholder:text-zinc-700"
              style={{ tabSize: 2 }}
            />

            {(aiLoading || templateLoading) && (
              <div className="absolute left-4 bottom-4 flex items-center gap-2 px-3 h-9 rounded-md border border-zinc-800 bg-zinc-900 text-xs text-zinc-300 pointer-events-none shadow-lg shadow-black/40">
                <Loader2 size={13} className="animate-spin text-indigo-400" />
                {templateLoading ? 'Generating your template…' : 'Codezy AI is thinking…'}
              </div>
            )}
          </div>
        </div>

        {!agentOpen && (
          <button
            onClick={focusAI}
            className="absolute bottom-6 right-6 w-11 h-11 rounded-lg bg-indigo-500 hover:bg-indigo-400 active:bg-indigo-600 shadow-lg shadow-black/50 flex items-center justify-center transition-colors z-20"
            title="Open AI assistant"
          >
            <Bot size={19} />
          </button>
        )}

        {agentOpen && (
          <>
            <div className="absolute inset-0 z-20 bg-black/70" onClick={() => setAgentOpen(false)} />

            <div
              onClick={event => event.stopPropagation()}
              className="absolute inset-4 z-30 rounded-xl border border-zinc-800 bg-zinc-950 shadow-2xl shadow-black/70 overflow-hidden flex flex-col"
            >
              <div className="h-14 shrink-0 px-5 border-b border-zinc-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-md bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                    <Bot size={16} className="text-indigo-400" />
                  </div>

                  <div>
                    <h1 className="text-sm font-semibold tracking-tight leading-4">Codezy AI</h1>
                    <p className="text-[11px] text-zinc-500 leading-4 mt-0.5">Your coding copilot</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="hidden sm:flex items-center gap-2 px-2.5 h-7 rounded-md bg-zinc-900 border border-zinc-800 text-xs text-zinc-400">
                    <ActiveIcon size={12} className={active.color || 'text-indigo-400'} />
                    {fileName}
                  </div>

                  <button onClick={() => setAgentOpen(false)} title="Close" className={iconBtn}>
                    <X size={17} />
                  </button>
                </div>
              </div>

              <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-[240px_minmax(0,1fr)]">
                <aside className="border-r border-zinc-800 p-3 overflow-y-auto">
                  <div className="text-[11px] uppercase tracking-widest text-zinc-600 font-semibold mb-2 px-2">
                    Tools
                  </div>

                  <div className="space-y-0.5">
                    {AI_ACTIONS.map(action => {
                      const Icon = action.icon
                      const isActive = selectedAction === action.id

                      return (
                        <button
                          key={action.id}
                          onClick={() => selectAction(action.id)}
                          className={`w-full flex items-center gap-3 px-2.5 py-2 rounded-md text-left transition-colors ${
                            isActive ? 'bg-zinc-800' : 'hover:bg-zinc-900'
                          }`}
                        >
                          <Icon size={15} className={isActive ? action.text : 'text-zinc-500'} />

                          <div className="min-w-0">
                            <div className={`text-[13px] font-medium ${isActive ? 'text-zinc-100' : 'text-zinc-300'}`}>
                              {action.label}
                            </div>
                            <div className="text-[11px] text-zinc-500 mt-0.5">{action.description}</div>
                          </div>
                        </button>
                      )
                    })}
                  </div>

                  <div className="mt-5 p-3 rounded-md bg-zinc-900 border border-zinc-800">
                    <div className="flex items-center gap-2 text-xs text-zinc-300">
                      <ActiveIcon size={13} className={active.color || 'text-indigo-400'} />
                      Current file
                    </div>

                    <div className="mt-2 text-xs font-mono text-zinc-400 break-all">{fileName}</div>
                    <div className="mt-1 text-[11px] text-zinc-600">{languageLabel}</div>
                  </div>
                </aside>

                <main className="min-w-0 min-h-0 flex flex-col">
                  <div className="flex-1 min-h-0 grid grid-cols-1 xl:grid-cols-2">
                    <div className="border-b xl:border-b-0 xl:border-r border-zinc-800 flex flex-col min-h-0">
                      <div className="h-10 shrink-0 px-4 border-b border-zinc-800 flex items-center justify-between">
                        <span className="text-xs font-medium text-zinc-300">Your Code</span>
                        <span className="text-[11px] text-zinc-600">{languageLabel}</span>
                      </div>

                      <textarea
                        value={currentCode}
                        readOnly
                        className="flex-1 min-h-[220px] w-full resize-none outline-none bg-transparent p-4 font-mono text-xs leading-6 text-zinc-400"
                      />
                    </div>

                    <div className="flex flex-col min-h-0">
                      <div className="h-10 shrink-0 px-4 border-b border-zinc-800 flex items-center justify-between">
                        <span className="text-xs font-medium text-zinc-300 flex items-center gap-2">
                          <Sparkles size={12} className="text-indigo-400" />
                          AI Response
                        </span>

                        {aiResult && (
                          <button
                            onClick={copyResult}
                            className="w-7 h-7 flex items-center justify-center rounded hover:bg-zinc-800 text-zinc-500 hover:text-white transition-colors"
                            title="Copy"
                          >
                            {resultCopied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                          </button>
                        )}
                      </div>

                      <div className="flex-1 min-h-[220px] overflow-y-auto p-5">
                        {aiLoading && (
                          <div className="h-full flex items-center justify-center">
                            <div className="flex flex-col items-center gap-3 text-zinc-500">
                              <Loader2 size={20} className="animate-spin text-indigo-400" />
                              <span className="text-xs">Codezy AI is thinking…</span>
                            </div>
                          </div>
                        )}

                        {!aiLoading && aiError && (
                          <div className="rounded-md border border-red-500/20 bg-red-500/[0.06] p-4 text-xs text-red-300 leading-5">
                            {aiError}
                          </div>
                        )}

                        {!aiLoading && !aiError && !aiResult && (
                          <div className="h-full flex flex-col items-center justify-center text-center">
                            <div className="w-12 h-12 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-4">
                              <Sparkles size={20} className="text-indigo-400" />
                            </div>

                            <h2 className="text-sm font-semibold text-zinc-100">What can I help you with?</h2>

                            <p className="max-w-xs text-xs text-zinc-500 mt-2 leading-5">
                              Debug, explain, improve or generate code with Codezy AI.
                            </p>
                          </div>
                        )}

                        {!aiLoading && aiResult && (
                          <pre className="whitespace-pre-wrap break-words font-mono text-xs leading-6 text-zinc-300">
                            {aiResult}
                          </pre>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="shrink-0 border-t border-zinc-800 p-4">
                    {selectedAction === 'ask' || selectedAction === 'build' ? (
                      <div className="flex gap-2">
                        <input
                          ref={aiInputRef}
                          value={aiPrompt}
                          onChange={e => setAiPrompt(e.target.value)}
                          onKeyDown={handleAIKeyDown}
                          placeholder={
                            selectedAction === 'build'
                              ? 'Describe what you want to build…'
                              : `Ask a question about your ${languageLabel} code…`
                          }
                          className="flex-1 h-10 px-3.5 rounded-md bg-zinc-900 border border-zinc-800 focus:border-indigo-500 outline-none text-xs text-zinc-200 placeholder:text-zinc-600 transition-colors"
                        />

                        <button
                          onClick={askAI}
                          disabled={aiLoading || (selectedAction === 'ask' && !aiPrompt.trim())}
                          className={`${primaryBtn} px-5 h-10`}
                        >
                          {aiLoading ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                          Ask
                        </button>
                      </div>
                    ) : (
                      <div className="flex justify-end">
                        <button onClick={askAI} disabled={aiLoading} className={`${primaryBtn} h-10 px-6`}>
                          {aiLoading ? <Loader2 size={14} className="animate-spin" /> : <Play size={13} fill="currentColor" />}
                          {aiLoading ? 'Processing…' : activeActionMeta?.label || 'Run AI'}
                        </button>
                      </div>
                    )}

                    {aiResult && isCodeResponse(aiResult, aiAction) && (
                      <div className="mt-3 flex justify-end">
                        <button
                          onClick={applyAIResult}
                          disabled={autoWriting}
                          className={`h-8 px-3.5 rounded-md border text-xs font-medium flex items-center gap-1.5 transition-colors disabled:opacity-50 ${
                            justAdded
                              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                              : 'bg-zinc-900 border-zinc-800 text-zinc-200 hover:bg-zinc-800'
                          }`}
                        >
                          {justAdded ? (
                            <>
                              <Check size={12} />
                              Applied to editor
                            </>
                          ) : (
                            <>
                              <WandSparkles size={12} />
                              Apply result to editor
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </main>
              </div>
            </div>
          </>
        )}
      </div>

      <div className="relative z-10 h-8 shrink-0 border-t border-zinc-800 bg-zinc-950 px-4 flex items-center justify-between text-[11px] text-zinc-500">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5 text-zinc-400">
            <Circle size={6} fill="currentColor" className="text-emerald-500" />
            Ready
          </span>
          <span>Ln {caret.line}, Col {caret.column}</span>
          <span className="hidden sm:inline">UTF-8</span>
          <span className="hidden sm:inline">LF</span>
          <span className="hidden md:inline">Spaces: 2</span>
        </div>

        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <Users size={11} />
            {memberCount} {memberCount === 1 ? 'member' : 'members'}
          </span>

          <span className="hidden sm:flex items-center gap-1.5 text-zinc-300">
            <ActiveIcon size={11} className={active.color || 'text-zinc-400'} />
            {languageLabel}
          </span>
        </div>
      </div>
    </div>
  )
}