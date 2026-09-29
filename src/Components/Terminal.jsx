import React, { useEffect, useRef, useState, forwardRef, useImperativeHandle } from 'react'
import axios from 'axios'
import {
  Terminal as TerminalIcon,
  Plus,
  X,
  Trash2,
  Copy,
  Search,
  Maximize2,
  Minimize2,
  Square,
  Zap,
  Clock3,
  Pencil,
  Layers3,
  Keyboard,
  Minus,
  PanelBottom,
  ChevronUp,
  Wifi
} from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'

const API_URL = 'http://localhost:5000'

const initialTerminals = [
  {
    id: 1,
    name: 'Main',
    type: 'bash',
    status: 'active'
  }
]

const terminalTypes = [
  {
    name: 'bash',
    label: 'Bash',
    symbol: '$'
  },
  {
    name: 'node',
    label: 'Node',
    symbol: '>'
  },
  {
    name: 'python',
    label: 'Python',
    symbol: '>>>'
  },
  {
    name: 'cpp',
    label: 'C++',
    symbol: 'C:'
  },
  {
    name: 'java',
    label: 'Java',
    symbol: 'J:'
  }
]

const quickCommands = [
  'help',
  'status',
  'ls',
  'pwd',
  'clear',
  'vars'
]

const MIN_HEIGHT = 150
const MAX_HEIGHT = 650
const DEFAULT_HEIGHT = 288

const ScrollbarStyles = () => (
  <style>{`
    .codezy-terminal-scroll {
      scrollbar-width: thin;
      scrollbar-color: #3f3f46 transparent;
      scroll-behavior: smooth;
    }

    .codezy-terminal-scroll::-webkit-scrollbar {
      width: 6px;
    }

    .codezy-terminal-scroll::-webkit-scrollbar-track {
      background: transparent;
    }

    .codezy-terminal-scroll::-webkit-scrollbar-thumb {
      background: #3f3f46;
      border-radius: 999px;
    }

    .codezy-terminal-scroll::-webkit-scrollbar-thumb:hover {
      background: #8b5cf6;
    }

    .codezy-horizontal-scroll {
      scrollbar-width: none;
      -ms-overflow-style: none;
    }

    .codezy-horizontal-scroll::-webkit-scrollbar {
      display: none;
    }

    .codezy-terminal-grid {
      background-image:
        linear-gradient(rgba(139,92,246,0.025) 1px, transparent 1px),
        linear-gradient(90deg, rgba(139,92,246,0.025) 1px, transparent 1px);
      background-size: 24px 24px;
    }

    .codezy-terminal-handle {
      cursor: ns-resize;
    }

    .codezy-terminal-handle::before {
      content: "";
      width: 42px;
      height: 3px;
      border-radius: 999px;
      background: #3f3f46;
      transition: all 160ms ease;
    }

    .codezy-terminal-handle:hover::before {
      width: 58px;
      background: #8b5cf6;
      box-shadow: 0 0 12px rgba(139,92,246,0.45);
    }

    .codezy-terminal-handle:active::before {
      width: 68px;
      background: #a78bfa;
      box-shadow: 0 0 16px rgba(139,92,246,0.6);
    }

    .codezy-terminal-glow {
      box-shadow:
        inset 0 1px 0 rgba(255,255,255,0.025),
        inset 0 0 50px rgba(76,29,149,0.04),
        0 -15px 50px rgba(0,0,0,0.25);
    }

    @keyframes codezy-blink {
      0%, 45% {
        opacity: 1;
      }

      46%, 100% {
        opacity: 0.2;
      }
    }

    .codezy-blink {
      animation: codezy-blink 1.1s infinite;
    }

    @keyframes codezy-glitch {
      0%, 90%, 100% {
        transform: translateX(0);
      }

      92% {
        transform: translateX(-1px);
      }

      94% {
        transform: translateX(1px);
      }

      96% {
        transform: translateX(-0.5px);
      }
    }

    .codezy-glitch {
      animation: codezy-glitch 5s infinite;
    }
  `}</style>
)

const extractErrorLine = errorText => {
  if (!errorText) return null

  const patterns = [
    /line\s+(\d+)/i,
    /:(\d+):\d+/,
    /\((\d+):\d+\)/,
    /at\s+.*?:?(\d+):\d+/i
  ]

  for (const pattern of patterns) {
    const match = errorText.match(pattern)

    if (match) {
      return Number(match[1])
    }
  }

  return null
}

export const Terminal = forwardRef(({
  onClose,
  code = '',
  language = 'javascript',
  onErrorLine
}, ref) => {
  const [isOpen, setIsOpen] = useState(true)
  const [terminals, setTerminals] = useState(initialTerminals)
  const [activeTerminal, setActiveTerminal] = useState(1)
  const [terminalHeight, setTerminalHeight] = useState(DEFAULT_HEIGHT)
  const [maximized, setMaximized] = useState(false)
  const [command, setCommand] = useState('')
  const [history, setHistory] = useState([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const [searchOpen, setSearchOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [showShortcuts, setShowShortcuts] = useState(false)
  const [showTypes, setShowTypes] = useState(false)
  const [showQuick, setShowQuick] = useState(true)
  const [renaming, setRenaming] = useState(false)
  const [renameValue, setRenameValue] = useState('Main')
  const [running, setRunning] = useState(false)
  const [startTime, setStartTime] = useState(null)
  const [elapsed, setElapsed] = useState(0)
  const [resizing, setResizing] = useState(false)

  const [lines, setLines] = useState([
    {
      id: 1,
      type: 'system',
      text: 'CODEZY TERMINAL — Local Execution Engine'
    },
    {
      id: 2,
      type: 'system',
      text: 'Type "run" to execute the current editor code'
    },
    {
      id: 3,
      type: 'system',
      text: 'Type "help" for built-in commands'
    }
  ])

  const inputRef = useRef(null)
  const terminalRef = useRef(null)
  const resizeStartY = useRef(0)
  const resizeStartHeight = useRef(DEFAULT_HEIGHT)
  const nextLineId = useRef(10)
  const codeRef = useRef(code)
  const languageRef = useRef(language)
  const runningRef = useRef(false)

  useEffect(() => {
    codeRef.current = code
  }, [code])

  useEffect(() => {
    languageRef.current = language
  }, [language])

  useEffect(() => {
    runningRef.current = running
  }, [running])

  useEffect(() => {
    if (!terminalRef.current) return

    terminalRef.current.scrollTop =
      terminalRef.current.scrollHeight
  }, [lines])

  useEffect(() => {
    if (!running || !startTime) return

    const timer = setInterval(() => {
      setElapsed(Date.now() - startTime)
    }, 100)

    return () => clearInterval(timer)
  }, [running, startTime])

  useEffect(() => {
    if (!resizing) return

    const handleMouseMove = e => {
      const difference =
        resizeStartY.current - e.clientY

      const nextHeight =
        resizeStartHeight.current + difference

      setTerminalHeight(
        Math.min(
          MAX_HEIGHT,
          Math.max(MIN_HEIGHT, nextHeight)
        )
      )
    }

    const handleMouseUp = () => {
      setResizing(false)
      document.body.style.userSelect = ''
      document.body.style.cursor = ''
    }

    document.addEventListener(
      'mousemove',
      handleMouseMove
    )

    document.addEventListener(
      'mouseup',
      handleMouseUp
    )

    return () => {
      document.removeEventListener(
        'mousemove',
        handleMouseMove
      )

      document.removeEventListener(
        'mouseup',
        handleMouseUp
      )
    }
  }, [resizing])

  useEffect(() => {
    if (
      isOpen &&
      !renaming &&
      !showShortcuts &&
      !searchOpen &&
      !running
    ) {
      inputRef.current?.focus()
    }
  }, [
    isOpen,
    activeTerminal,
    renaming,
    showShortcuts,
    searchOpen,
    running
  ])

  const startResize = e => {
    if (maximized) return

    e.preventDefault()

    resizeStartY.current = e.clientY
    resizeStartHeight.current = terminalHeight

    setResizing(true)

    document.body.style.userSelect = 'none'
    document.body.style.cursor = 'ns-resize'
  }

  const resetSize = () => {
    setTerminalHeight(DEFAULT_HEIGHT)
  }

  const addLine = (type, text) => {
    setLines(current => [
      ...current,
      {
        id: nextLineId.current++,
        type,
        text
      }
    ])
  }

  const executeCode = async () => {
    setIsOpen(true)

    const currentCode = codeRef.current
    const currentLanguage = languageRef.current

    if (!currentCode.trim()) {
      addLine('error', 'No code to run')
      return
    }

    if (runningRef.current) {
      addLine(
        'warning',
        'A program is already running'
      )
      return
    }

    setRunning(true)
    setStartTime(Date.now())
    setElapsed(0)

    onErrorLine?.(null)

    addLine(
      'system',
      `Running ${currentLanguage} code...`
    )

    try {
      const response = await axios.post(
        `${API_URL}/api/run`,
        {
          language: currentLanguage,
          code: currentCode
        },
        {
          timeout: 30000
        }
      )

      const result = response.data || {}

      const stdout = result.output || ''
      const stderr = result.error || ''

      if (stdout) {
        stdout
          .trimEnd()
          .split('\n')
          .forEach(line => {
            addLine('output', line)
          })
      }

      if (stderr) {
        stderr
          .trimEnd()
          .split('\n')
          .forEach(line => {
            addLine('error', line)
          })
      }

      const lineNumber = extractErrorLine(stderr)

      if (lineNumber) {
        onErrorLine?.(lineNumber)

        addLine(
          'error',
          `Error detected on line ${lineNumber}`
        )
      } else {
        onErrorLine?.(null)
      }

      if (result.success === true && !stderr) {
        addLine(
          'success',
          '✓ Program completed successfully'
        )
      }

      if (!stdout && !stderr) {
        addLine(
          'system',
          'Program finished with no output'
        )
      }
    } catch (error) {
      const backendError =
        error.response?.data?.error ||
        error.message ||
        'Unable to connect to Codezy backend'

      addLine(
        'error',
        backendError
      )

      if (
        error.code === 'ECONNREFUSED' ||
        error.code === 'ERR_NETWORK'
      ) {
        addLine(
          'error',
          'Make sure the Codezy backend is running on port 5000.'
        )
      }

      onErrorLine?.(null)
    } finally {
      setRunning(false)
      setStartTime(null)
    }
  }

  useImperativeHandle(ref, () => ({
    runNow: executeCode
  }))

  const executeCommand = customCommand => {
    const value =
      (customCommand ?? command).trim()

    if (!value) return

    addLine('command', value)

    setCommand('')

    setHistory(current => [
      ...current,
      value
    ])

    setHistoryIndex(-1)

    if (value === 'clear') {
      setLines([])
      return
    }

    if (value === 'help') {
      addLine(
        'output',
        'CODEZY COMMAND CENTER'
      )

      addLine(
        'output',
        'help       Show terminal commands'
      )

      addLine(
        'output',
        'clear      Clear terminal'
      )

      addLine(
        'output',
        'status     Workspace status'
      )

      addLine(
        'output',
        'pwd        Current workspace'
      )

      addLine(
        'output',
        'ls         List project files'
      )

      addLine(
        'output',
        'run        Run current editor code'
      )

      addLine(
        'output',
        'sessions   Show active sessions'
      )

      addLine(
        'output',
        'reset      Clear session'
      )

      return
    }

    if (value === 'status') {
      addLine(
        'success',
        '● Workspace connected'
      )

      addLine(
        'success',
        '● Codezy local execution endpoint'
      )

      addLine(
        'success',
        '● AI service available through Groq'
      )

      addLine(
        'success',
        `● Active sessions: ${terminals.length}`
      )

      return
    }

    if (value === 'pwd') {
      addLine(
        'output',
        '/workspace/codezy'
      )

      return
    }

    if (value === 'ls') {
      addLine(
        'output',
        'src public package.json README.md'
      )

      return
    }

    if (value === 'sessions') {
      terminals.forEach(terminal => {
        addLine(
          'output',
          `${terminal.name} — ${terminal.type} — ${terminal.status}`
        )
      })

      return
    }

    if (value === 'vars') {
      addLine(
        'output',
        'Variables are managed by the executed program.'
      )

      return
    }

    if (value === 'reset') {
      setLines([
        {
          id: nextLineId.current++,
          type: 'system',
          text: 'Session reset'
        }
      ])

      return
    }

    if (value === 'run') {
      executeCode()
      return
    }

    addLine(
      'system',
      `Unknown command: ${value}`
    )

    addLine(
      'output',
      'Type "help" to see available commands.'
    )
  }

  const createTerminal = (type = 'bash') => {
    const newId =
      terminals.length === 0
        ? 1
        : Math.max(
            ...terminals.map(item => item.id)
          ) + 1

    const typeCount =
      terminals.filter(
        item => item.type === type
      ).length + 1

    const newTerminal = {
      id: newId,
      name:
        type === 'bash'
          ? `Terminal ${typeCount}`
          : `${type} ${typeCount}`,
      type,
      status: 'active'
    }

    setTerminals(current => [
      ...current,
      newTerminal
    ])

    setActiveTerminal(newId)
    setShowTypes(false)
    setIsOpen(true)

    setLines([
      {
        id: nextLineId.current++,
        type: 'system',
        text: `${type.toUpperCase()} session created`
      },
      {
        id: nextLineId.current++,
        type: 'system',
        text: 'New Codezy terminal session ready'
      }
    ])
  }

  const closeTerminal = id => {
    if (terminals.length === 1) {
      setIsOpen(false)
      onClose?.()
      return
    }

    const remaining =
      terminals.filter(
        terminal => terminal.id !== id
      )

    setTerminals(remaining)

    if (activeTerminal === id) {
      setActiveTerminal(
        remaining[remaining.length - 1].id
      )
    }
  }

  const closePanel = () => {
    setIsOpen(false)
    onClose?.()
  }

  const duplicateTerminal = () => {
    const current =
      terminals.find(
        terminal =>
          terminal.id === activeTerminal
      )

    if (!current) return

    createTerminal(current.type)
  }

  const renameTerminal = () => {
    if (!renameValue.trim()) return

    setTerminals(current =>
      current.map(terminal =>
        terminal.id === activeTerminal
          ? {
              ...terminal,
              name: renameValue.trim()
            }
          : terminal
      )
    )

    setRenaming(false)
  }

  const switchTerminal = direction => {
    const currentIndex =
      terminals.findIndex(
        terminal =>
          terminal.id === activeTerminal
      )

    if (currentIndex === -1) return

    let nextIndex =
      currentIndex + direction

    if (nextIndex < 0) {
      nextIndex = terminals.length - 1
    }

    if (nextIndex >= terminals.length) {
      nextIndex = 0
    }

    setActiveTerminal(
      terminals[nextIndex].id
    )
  }

  const setSize = size => {
    if (size === 'compact') {
      setTerminalHeight(180)
    }

    if (size === 'normal') {
      setTerminalHeight(288)
    }

    if (size === 'large') {
      setTerminalHeight(420)
    }
  }

  const clearTerminal = () => {
    setLines([])
    inputRef.current?.focus()
  }

  const stopProcess = () => {
    setRunning(false)
    setStartTime(null)

    addLine(
      'error',
      '^C Process terminated'
    )
  }

  const copyTerminal = async () => {
    const text = lines
      .map(line => line.text)
      .join('\n')

    try {
      await navigator.clipboard.writeText(text)
    } catch {
      addLine(
        'error',
        'Unable to copy terminal output'
      )
    }
  }

  const recallHistory = direction => {
    if (history.length === 0) return

    let nextIndex

    if (historyIndex === -1) {
      nextIndex =
        direction === -1
          ? history.length - 1
          : -1
    } else {
      nextIndex =
        historyIndex + direction
    }

    if (
      nextIndex < 0 ||
      nextIndex >= history.length
    ) {
      setHistoryIndex(-1)
      setCommand('')
      return
    }

    setHistoryIndex(nextIndex)
    setCommand(history[nextIndex])
  }

  const filteredLines = lines.filter(line =>
    line.text
      .toLowerCase()
      .includes(search.toLowerCase())
  )

  const currentTerminal =
    terminals.find(
      terminal =>
        terminal.id === activeTerminal
    )

  const executionTime =
    (elapsed / 1000).toFixed(1)

  return (
    <AnimatePresence initial={false}>
      {isOpen ? (
        <motion.div
          key="terminal-open"
          initial={{
            opacity: 0,
            y: '100%'
          }}
          animate={{
            opacity: 1,
            y: 0
          }}
          exit={{
            opacity: 0,
            y: '100%'
          }}
          transition={{
            duration: 0.32,
            ease: [0.22, 1, 0.36, 1]
          }}
          style={{
            height: maximized
              ? '100vh'
              : `${terminalHeight}px`
          }}
          className={`${
            maximized
              ? 'fixed inset-0 z-[100]'
              : 'relative'
          } w-full bg-zinc-950 text-white flex flex-col overflow-hidden border-t border-zinc-800 codezy-terminal-glow`}
        >
          <ScrollbarStyles />

          {!maximized && (
            <div
              onMouseDown={startResize}
              onDoubleClick={resetSize}
              title="Drag to resize terminal"
              className="absolute -top-2 left-0 right-0 h-4 z-[120] flex items-center justify-center codezy-terminal-handle"
            />
          )}

          <div className="absolute inset-0 pointer-events-none codezy-terminal-grid opacity-60" />

          <motion.div
            animate={{
              opacity: running
                ? [0.15, 0.55, 0.15]
                : 0.15
            }}
            transition={{
              duration: 1.2,
              repeat: running ? Infinity : 0
            }}
            className="absolute left-0 right-0 top-0 h-px bg-violet-500"
          />

          <div className="relative z-40 h-10 shrink-0 bg-gradient-to-b from-zinc-900 to-zinc-950 border-b border-zinc-800 flex items-center justify-between">
            <div className="flex items-center h-full min-w-0 flex-1">
              <div className="px-3 flex items-center gap-2 border-r border-zinc-800 h-full shrink-0">
                <motion.div
                  animate={
                    running
                      ? {
                          scale: [1, 1.08, 1]
                        }
                      : {}
                  }
                  transition={{
                    duration: 0.8,
                    repeat: running
                      ? Infinity
                      : 0
                  }}
                  className="relative"
                >
                  <TerminalIcon
                    size={15}
                    className="text-violet-400"
                  />

                  <span className="absolute -right-1 -top-1 w-1.5 h-1.5 bg-green-400 rounded-full" />
                </motion.div>

                <span className="text-[10px] font-bold tracking-[0.25em] text-zinc-400 codezy-glitch">
                  CODEZY
                </span>
              </div>

              <div className="flex items-center h-full min-w-0 flex-1">
                <div className="codezy-horizontal-scroll flex items-center h-full min-w-0 flex-1 overflow-x-auto">
                  <AnimatePresence initial={false}>
                    {terminals.map(terminal => (
                      <motion.div
                        key={terminal.id}
                        layout
                        initial={{
                          opacity: 0,
                          x: 15
                        }}
                        animate={{
                          opacity: 1,
                          x: 0
                        }}
                        exit={{
                          opacity: 0,
                          x: -10
                        }}
                        onClick={() =>
                          setActiveTerminal(
                            terminal.id
                          )
                        }
                        className={`group relative h-full min-w-28 px-3 flex items-center gap-2 border-r border-zinc-800 cursor-pointer transition-colors ${
                          activeTerminal ===
                          terminal.id
                            ? 'bg-zinc-950 text-white'
                            : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/60'
                        }`}
                      >
                        {activeTerminal ===
                          terminal.id && (
                          <motion.span
                            layoutId="active-terminal"
                            className="absolute left-0 right-0 top-0 h-0.5 bg-violet-500"
                          />
                        )}

                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            activeTerminal ===
                            terminal.id
                              ? 'bg-green-400'
                              : 'bg-zinc-600'
                          }`}
                        />

                        <span className="text-[10px] flex-1 truncate">
                          {terminal.name}
                        </span>

                        <button
                          onClick={e => {
                            e.stopPropagation()
                            closeTerminal(
                              terminal.id
                            )
                          }}
                          className="opacity-0 group-hover:opacity-100 text-zinc-600 hover:text-red-400"
                        >
                          <X size={11} />
                        </button>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>

                <div className="relative z-50 h-full shrink-0">
                  <button
                    onClick={() =>
                      setShowTypes(!showTypes)
                    }
                    className="w-9 h-full flex items-center justify-center text-zinc-500 hover:text-white hover:bg-zinc-800"
                  >
                    <Plus size={14} />
                  </button>

                  <AnimatePresence>
                    {showTypes && (
                      <motion.div
                        initial={{
                          opacity: 0,
                          y: -6,
                          scale: 0.97
                        }}
                        animate={{
                          opacity: 1,
                          y: 0,
                          scale: 1
                        }}
                        exit={{
                          opacity: 0,
                          y: -6,
                          scale: 0.97
                        }}
                        className="absolute left-0 top-full mt-1 w-44 bg-zinc-900 border border-zinc-700 rounded-lg shadow-2xl p-1 z-[200]"
                      >
                        <p className="px-2 py-1.5 text-[9px] text-zinc-600 uppercase tracking-widest">
                          New Session
                        </p>

                        {terminalTypes.map(type => (
                          <motion.button
                            key={type.name}
                            whileHover={{
                              x: 2
                            }}
                            whileTap={{
                              scale: 0.97
                            }}
                            onClick={() =>
                              createTerminal(
                                type.name
                              )
                            }
                            className="w-full flex items-center gap-2 px-2 py-2 text-xs text-zinc-400 hover:text-white hover:bg-zinc-800 rounded"
                          >
                            <span className="w-6 text-center text-violet-400 font-mono text-[9px]">
                              {type.symbol}
                            </span>

                            {type.label}
                          </motion.button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1 px-2 shrink-0 bg-zinc-900 h-full">
              <div className="hidden lg:flex items-center gap-1.5 px-2 text-[9px] text-zinc-600">
                <Wifi
                  size={9}
                  className="text-green-400"
                />
                LIVE
              </div>

              <button
                onClick={() =>
                  setShowQuick(!showQuick)
                }
                className="w-7 h-7 flex items-center justify-center rounded text-zinc-600 hover:text-white hover:bg-zinc-800"
              >
                <Zap size={13} />
              </button>

              <button
                onClick={() =>
                  setSearchOpen(!searchOpen)
                }
                className="w-7 h-7 flex items-center justify-center rounded text-zinc-600 hover:text-white hover:bg-zinc-800"
              >
                <Search size={13} />
              </button>

              <button
                onClick={() =>
                  setShowShortcuts(
                    !showShortcuts
                  )
                }
                className="w-7 h-7 flex items-center justify-center rounded text-zinc-600 hover:text-white hover:bg-zinc-800"
              >
                <Keyboard size={13} />
              </button>

              <button
                onClick={duplicateTerminal}
                className="w-7 h-7 flex items-center justify-center rounded text-zinc-600 hover:text-white hover:bg-zinc-800"
              >
                <Layers3 size={13} />
              </button>

              <button
                onClick={() => {
                  setRenameValue(
                    currentTerminal?.name || ''
                  )
                  setRenaming(true)
                }}
                className="w-7 h-7 flex items-center justify-center rounded text-zinc-600 hover:text-white hover:bg-zinc-800"
              >
                <Pencil size={13} />
              </button>

              <button
                onClick={() =>
                  setMaximized(!maximized)
                }
                className="w-7 h-7 flex items-center justify-center rounded text-zinc-600 hover:text-white hover:bg-zinc-800"
              >
                {maximized ? (
                  <Minimize2 size={13} />
                ) : (
                  <Maximize2 size={13} />
                )}
              </button>

              <span className="w-px h-4 bg-zinc-800 mx-0.5" />

              <button
                onClick={closePanel}
                className="w-7 h-7 flex items-center justify-center rounded text-zinc-600 hover:text-red-400 hover:bg-red-500/10"
              >
                <X size={14} />
              </button>
            </div>
          </div>

          <div className="relative z-30 h-8 shrink-0 bg-zinc-950 border-b border-zinc-900 flex items-center justify-between px-3">
            <div className="flex items-center gap-3 min-w-0">
              <span className="text-[9px] text-zinc-600">
                SESSION
              </span>

              <span className="text-[10px] text-zinc-400">
                {currentTerminal?.name}
              </span>

              <span className="text-zinc-800">
                /
              </span>

              <span className="text-[10px] text-zinc-600 truncate">
                ~/workspace/codezy
              </span>

              <span className="px-1.5 py-0.5 rounded bg-violet-500/10 text-violet-400 text-[8px] uppercase">
                {language}
              </span>
            </div>

            <div className="flex items-center gap-1">
              {running && (
                <span className="text-[9px] text-yellow-400 mr-2">
                  RUNNING {executionTime}s
                </span>
              )}

              <button
                onClick={() =>
                  setSize('compact')
                }
                className="w-6 h-6 flex items-center justify-center text-zinc-600 hover:text-white hover:bg-zinc-800 rounded"
              >
                <Minus size={11} />
              </button>

              <button
                onClick={() =>
                  setSize('normal')
                }
                className="w-6 h-6 flex items-center justify-center text-zinc-600 hover:text-white hover:bg-zinc-800 rounded"
              >
                <PanelBottom size={11} />
              </button>

              <button
                onClick={() =>
                  setSize('large')
                }
                className="w-6 h-6 flex items-center justify-center text-zinc-600 hover:text-white hover:bg-zinc-800 rounded"
              >
                <Maximize2 size={11} />
              </button>
            </div>
          </div>

          <AnimatePresence>
            {searchOpen && (
              <motion.div
                initial={{
                  height: 0,
                  opacity: 0
                }}
                animate={{
                  height: 32,
                  opacity: 1
                }}
                exit={{
                  height: 0,
                  opacity: 0
                }}
                className="shrink-0 border-b border-zinc-800 bg-zinc-900 flex items-center px-3 gap-2 overflow-hidden"
              >
                <Search
                  size={12}
                  className="text-zinc-600"
                />

                <input
                  autoFocus
                  value={search}
                  onChange={e =>
                    setSearch(e.target.value)
                  }
                  placeholder="Search terminal output..."
                  className="flex-1 bg-transparent outline-none text-[10px] text-white placeholder:text-zinc-600"
                />

                <button
                  onClick={() => {
                    setSearch('')
                    setSearchOpen(false)
                  }}
                >
                  <X
                    size={12}
                    className="text-zinc-600 hover:text-white"
                  />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {showQuick && (
              <motion.div
                initial={{
                  height: 0,
                  opacity: 0
                }}
                animate={{
                  height: 32,
                  opacity: 1
                }}
                exit={{
                  height: 0,
                  opacity: 0
                }}
                className="codezy-horizontal-scroll shrink-0 bg-zinc-900 border-b border-zinc-900 flex items-center gap-1.5 px-3 overflow-x-auto"
              >
                <span className="text-[8px] uppercase tracking-widest text-zinc-700 mr-1">
                  Quick
                </span>

                {quickCommands.map(item => (
                  <motion.button
                    key={item}
                    whileHover={{
                      y: -1
                    }}
                    whileTap={{
                      scale: 0.95
                    }}
                    onClick={() =>
                      executeCommand(item)
                    }
                    className="px-2 py-0.5 rounded border border-zinc-800 bg-zinc-900 text-[9px] font-mono text-zinc-500 hover:text-violet-400 hover:border-violet-500/40 shrink-0"
                  >
                    {item}
                  </motion.button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          <div
            ref={terminalRef}
            onClick={() =>
              inputRef.current?.focus()
            }
            className="relative codezy-terminal-scroll flex-1 min-h-0 overflow-y-auto px-4 py-3 font-mono text-[11px] leading-5 cursor-text"
          >
            <div className="relative z-10">
              <AnimatePresence initial={false}>
                {filteredLines.map(line => (
                  <motion.div
                    key={line.id}
                    initial={{
                      opacity: 0,
                      x: -5
                    }}
                    animate={{
                      opacity: 1,
                      x: 0
                    }}
                    className={
                      line.type === 'command'
                        ? 'text-zinc-200'
                        : line.type === 'error'
                        ? 'text-red-400'
                        : line.type === 'warning'
                        ? 'text-yellow-400'
                        : line.type === 'result'
                        ? 'text-cyan-300'
                        : line.type === 'success'
                        ? 'text-green-400'
                        : line.type === 'system'
                        ? 'text-violet-400'
                        : 'text-zinc-500'
                    }
                  >
                    {line.type === 'command' && (
                      <>
                        <span className="text-green-400">
                          soumyajit
                        </span>

                        <span className="text-zinc-700">
                          @
                        </span>

                        <span className="text-violet-400">
                          codezy
                        </span>

                        <span className="text-zinc-700">
                          :
                        </span>

                        <span className="text-cyan-400">
                          ~/workspace
                        </span>

                        <span className="text-zinc-600">
                          $
                        </span>

                        <span> </span>
                      </>
                    )}

                    {line.text}
                  </motion.div>
                ))}
              </AnimatePresence>

              {!running && (
                <div className="flex items-center">
                  <span className="text-green-400">
                    soumyajit
                  </span>

                  <span className="text-zinc-700">
                    @
                  </span>

                  <span className="text-violet-400">
                    codezy
                  </span>

                  <span className="text-zinc-700">
                    :
                  </span>

                  <span className="text-cyan-400">
                    ~/workspace
                  </span>

                  <span className="text-zinc-600">
                    $
                  </span>

                  <input
                    ref={inputRef}
                    value={command}
                    onChange={e =>
                      setCommand(
                        e.target.value
                      )
                    }
                    onKeyDown={e => {
                      if (
                        e.ctrlKey &&
                        e.shiftKey &&
                        e.key === 'Enter'
                      ) {
                        e.preventDefault()

                        createTerminal(
                          currentTerminal?.type ||
                            'bash'
                        )

                        return
                      }

                      if (
                        e.ctrlKey &&
                        e.shiftKey &&
                        e.key === ']'
                      ) {
                        e.preventDefault()
                        switchTerminal(1)
                        return
                      }

                      if (
                        e.ctrlKey &&
                        e.shiftKey &&
                        e.key === '['
                      ) {
                        e.preventDefault()
                        switchTerminal(-1)
                        return
                      }

                      if (
                        e.ctrlKey &&
                        e.key.toLowerCase() === 'l'
                      ) {
                        e.preventDefault()
                        clearTerminal()
                        return
                      }

                      if (e.key === 'Enter') {
                        e.preventDefault()
                        executeCommand()
                        return
                      }

                      if (
                        e.key === 'ArrowUp' &&
                        !e.ctrlKey
                      ) {
                        e.preventDefault()
                        recallHistory(-1)
                        return
                      }

                      if (
                        e.key === 'ArrowDown' &&
                        !e.ctrlKey
                      ) {
                        e.preventDefault()
                        recallHistory(1)
                        return
                      }

                      if (e.key === 'Escape') {
                        setShowShortcuts(false)
                        setShowTypes(false)
                        setSearchOpen(false)
                      }
                    }}
                    className="flex-1 min-w-0 ml-2 bg-transparent outline-none text-zinc-200 caret-violet-400"
                    autoComplete="off"
                    spellCheck="false"
                  />

                  <span className="w-1.5 h-4 bg-violet-400/80 ml-0.5 codezy-blink" />
                </div>
              )}

              {running && (
                <motion.div
                  initial={{
                    opacity: 0,
                    y: 4
                  }}
                  animate={{
                    opacity: 1,
                    y: 0
                  }}
                  className="flex items-center gap-2 text-yellow-400"
                >
                  <motion.span
                    animate={{
                      opacity: [1, 0.2, 1]
                    }}
                    transition={{
                      duration: 0.7,
                      repeat: Infinity
                    }}
                  >
                    ●
                  </motion.span>

                  Codezy execution engine running...
                </motion.div>
              )}
            </div>
          </div>

          <AnimatePresence>
            {showShortcuts && (
              <motion.div
                initial={{
                  opacity: 0,
                  y: 8,
                  scale: 0.97
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                  scale: 1
                }}
                exit={{
                  opacity: 0,
                  y: 8,
                  scale: 0.97
                }}
                className="absolute right-3 bottom-12 w-72 bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl p-3 z-[150]"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Keyboard
                      size={14}
                      className="text-violet-400"
                    />

                    <span className="text-xs font-semibold">
                      Terminal Shortcuts
                    </span>
                  </div>

                  <button
                    onClick={() =>
                      setShowShortcuts(false)
                    }
                  >
                    <X
                      size={13}
                      className="text-zinc-600 hover:text-white"
                    />
                  </button>
                </div>

                <div className="space-y-2">
                  {[
                    [
                      'Ctrl + Shift + Enter',
                      'New terminal'
                    ],
                    [
                      'Ctrl + Shift + ]',
                      'Next terminal'
                    ],
                    [
                      'Ctrl + Shift + [',
                      'Previous terminal'
                    ],
                    [
                      'Ctrl + L',
                      'Clear terminal'
                    ],
                    [
                      '↑ / ↓',
                      'Browse command history'
                    ],
                    [
                      'Enter',
                      'Run command'
                    ],
                    [
                      'Esc',
                      'Close panels'
                    ]
                  ].map(([key, action]) => (
                    <div
                      key={key}
                      className="flex items-center justify-between"
                    >
                      <span className="text-[10px] text-zinc-500">
                        {action}
                      </span>

                      <kbd className="px-1.5 py-1 rounded bg-zinc-800 border border-zinc-700 text-[9px] text-zinc-300 font-mono">
                        {key}
                      </kbd>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {renaming && (
              <motion.div
                initial={{
                  opacity: 0,
                  scale: 0.95
                }}
                animate={{
                  opacity: 1,
                  scale: 1
                }}
                exit={{
                  opacity: 0,
                  scale: 0.95
                }}
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-64 bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl p-4 z-[160]"
              >
                <div className="flex items-center gap-2 mb-3">
                  <Pencil
                    size={14}
                    className="text-violet-400"
                  />

                  <span className="text-xs font-semibold">
                    Rename Terminal
                  </span>
                </div>

                <input
                  autoFocus
                  value={renameValue}
                  onChange={e =>
                    setRenameValue(
                      e.target.value
                    )
                  }
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      renameTerminal()
                    }

                    if (e.key === 'Escape') {
                      setRenaming(false)
                    }
                  }}
                  className="w-full h-8 px-2 bg-zinc-800 border border-zinc-700 focus:border-violet-500 rounded-md outline-none text-xs text-white"
                />

                <div className="flex justify-end gap-2 mt-3">
                  <button
                    onClick={() =>
                      setRenaming(false)
                    }
                    className="px-3 py-1.5 text-[10px] text-zinc-500 hover:text-white"
                  >
                    Cancel
                  </button>

                  <button
                    onClick={renameTerminal}
                    className="px-3 py-1.5 text-[10px] bg-violet-600 hover:bg-violet-500 rounded-md"
                  >
                    Rename
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="relative z-30 h-6 shrink-0 bg-zinc-900 border-t border-zinc-800 flex items-center justify-between px-3">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5 text-[9px] text-green-400">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
                Connected
              </span>

              <span className="text-[9px] text-zinc-600">
                {terminals.length} session
                {terminals.length !== 1
                  ? 's'
                  : ''}
              </span>

              <span className="text-[9px] text-zinc-600">
                {language}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {running && (
                <button
                  onClick={stopProcess}
                  className="flex items-center gap-1 text-[9px] text-red-400 hover:text-red-300"
                >
                  <Square
                    size={8}
                    fill="currentColor"
                  />
                  Stop
                </button>
              )}

              <button
                onClick={copyTerminal}
                title="Copy"
                className="text-zinc-600 hover:text-white"
              >
                <Copy size={11} />
              </button>

              <button
                onClick={clearTerminal}
                title="Clear"
                className="text-zinc-600 hover:text-white"
              >
                <Trash2 size={11} />
              </button>

              <span className="text-zinc-800">
                |
              </span>

              <span className="flex items-center gap-1 text-[9px] text-zinc-600">
                <Clock3 size={10} />
                Codezy Runtime
              </span>
            </div>
          </div>
        </motion.div>
      ) : (
        <motion.div
          key="terminal-closed"
          initial={{
            opacity: 0,
            y: 20
          }}
          animate={{
            opacity: 1,
            y: 0
          }}
          exit={{
            opacity: 0,
            y: 20
          }}
          className="w-full h-8 bg-zinc-900 border-t border-zinc-800 flex items-center justify-between px-3 text-zinc-500"
        >
          <button
            onClick={() => setIsOpen(true)}
            className="flex items-center gap-2 h-full text-[10px] hover:text-white"
          >
            <TerminalIcon
              size={12}
              className="text-violet-400"
            />

            <span>TERMINAL</span>

            <span className="text-zinc-700">
              ({terminals.length} session
              {terminals.length !== 1
                ? 's'
                : ''}
              )
            </span>
          </button>

          <button
            onClick={() => setIsOpen(true)}
            className="w-6 h-6 flex items-center justify-center hover:text-white"
          >
            <ChevronUp size={13} />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  )
})

Terminal.displayName = 'Terminal'

export default Terminal