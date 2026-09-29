import React, { useEffect, useRef, useState } from 'react'
import {
  X,
  MoreHorizontal,
  Plus,
  Check,
  Loader2,
  FileCode2,
  FileType2,
  Palette,
  Globe,
  FileJson2,
  Coffee,
  File as FileIcon
} from 'lucide-react'

const languageMeta = {
  js: { Icon: FileCode2, color: 'text-yellow-400' },
  jsx: { Icon: FileCode2, color: 'text-cyan-400' },
  ts: { Icon: FileType2, color: 'text-blue-400' },
  tsx: { Icon: FileType2, color: 'text-blue-400' },
  py: { Icon: FileCode2, color: 'text-yellow-300' },
  java: { Icon: Coffee, color: 'text-orange-400' },
  cpp: { Icon: FileCode2, color: 'text-blue-500' },
  cc: { Icon: FileCode2, color: 'text-blue-500' },
  cxx: { Icon: FileCode2, color: 'text-blue-500' },
  c: { Icon: FileCode2, color: 'text-blue-300' },
  css: { Icon: Palette, color: 'text-blue-400' },
  scss: { Icon: Palette, color: 'text-pink-400' },
  sass: { Icon: Palette, color: 'text-pink-400' },
  html: { Icon: Globe, color: 'text-orange-400' },
  htm: { Icon: Globe, color: 'text-orange-400' },
  json: { Icon: FileJson2, color: 'text-yellow-400' }
}

function NavBar({ currentFile, onFileSelect, onCreateFile }) {
  const [openFiles, setOpenFiles] = useState([])

  const [creating, setCreating] = useState(false)
  const [newFileName, setNewFileName] = useState('')
  const [creatingBusy, setCreatingBusy] = useState(false)
  const [createError, setCreateError] = useState('')

  const createRef = useRef(null)
  const createInputRef = useRef(null)

  useEffect(() => {
    if (!currentFile?._id) return

    setOpenFiles((prev) => {
      const exists = prev.some(
        (file) => String(file._id) === String(currentFile._id)
      )

      if (exists) {
        return prev.map((file) =>
          String(file._id) === String(currentFile._id)
            ? currentFile
            : file
        )
      }

      return [...prev, currentFile]
    })
  }, [currentFile])

  useEffect(() => {
    if (!creating) return

    const handleClickOutside = (e) => {
      if (createRef.current && !createRef.current.contains(e.target)) {
        setCreating(false)
        setNewFileName('')
        setCreateError('')
      }
    }

    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        setCreating(false)
        setNewFileName('')
        setCreateError('')
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)

    setTimeout(() => createInputRef.current?.focus(), 0)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [creating])

  const getIcon = (file) => {
    const extension = (
      file?.extension ||
      file?.name?.split('.').pop() ||
      ''
    ).toLowerCase()

    const meta = languageMeta[extension]

    if (meta) {
      const { Icon, color } = meta
      return <Icon size={12} className={color} />
    }

    return <FileIcon size={12} className="text-zinc-500" />
  }

  const handleClose = (e, fileId) => {
    e.stopPropagation()

    setOpenFiles((prev) => {
      const index = prev.findIndex(
        (file) => String(file._id) === String(fileId)
      )

      const updated = prev.filter(
        (file) => String(file._id) !== String(fileId)
      )

      if (
        currentFile &&
        String(currentFile._id) === String(fileId) &&
        updated.length > 0
      ) {
        const nextFile = updated[Math.max(0, index - 1)]
        onFileSelect?.(nextFile)
      }

      return updated
    })
  }

  const handleTabClick = (file) => {
    onFileSelect?.(file)
  }

  const openCreate = () => {
    setCreating(true)
    setCreateError('')
  }

  const submitCreate = async () => {
    const name = newFileName.trim()

    if (!name || creatingBusy) return

    if (typeof onCreateFile !== 'function') {
      setCreating(false)
      return
    }

    try {
      setCreatingBusy(true)
      setCreateError('')

      await onCreateFile(name)

      setCreating(false)
      setNewFileName('')
    } catch (error) {
      console.error('Create file error:', error)
      setCreateError(error.message || 'Could not create the file')
    } finally {
      setCreatingBusy(false)
    }
  }

  const handleCreateKeyDown = (e) => {
    if (e.key === 'Enter') {
      submitCreate()
    }

    if (e.key === 'Escape') {
      setCreating(false)
      setNewFileName('')
      setCreateError('')
    }
  }

  return (
    <div className="relative w-full h-11 bg-zinc-900 border-b border-zinc-800 flex items-center rounded-t-md overflow-visible">

      <div className="flex-1 h-full flex items-center overflow-x-auto scrollbar-none">

        {openFiles.map((file) => {
          const isActive =
            currentFile &&
            String(currentFile._id) === String(file._id)

          return (
            <div
              key={file._id}
              onClick={() => handleTabClick(file)}
              className={`group relative h-full min-w-36 max-w-52 flex items-center gap-2 px-3 cursor-pointer border-r border-zinc-800 transition-colors duration-150 ${
                isActive
                  ? 'bg-zinc-900 text-white'
                  : 'bg-zinc-950 text-zinc-500 hover:bg-zinc-900/70 hover:text-zinc-300'
              }`}
            >

              {isActive && (
                <div className="absolute top-0 left-0 right-0 h-[2px] bg-violet-500 shadow-[0_0_8px_rgba(139,92,246,0.8)]" />
              )}

              <div
                className={`w-5 h-5 flex-shrink-0 flex items-center justify-center rounded-md transition-colors ${
                  isActive ? 'bg-violet-500/10' : 'bg-zinc-800/80'
                }`}
              >
                {getIcon(file)}
              </div>

              <span className="text-xs flex-1 truncate">
                {file.name}
              </span>

              {isActive && (
                <span className="w-1.5 h-1.5 flex-shrink-0 rounded-full bg-violet-400 opacity-80" />
              )}

              <button
                onClick={(e) => handleClose(e, file._id)}
                className={`w-5 h-5 flex-shrink-0 flex items-center justify-center rounded-md transition-all ${
                  isActive
                    ? 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                    : 'opacity-0 group-hover:opacity-100 text-zinc-500 hover:text-white hover:bg-zinc-800'
                }`}
              >
                <X size={13} />
              </button>

            </div>
          )
        })}

        <div className="relative" ref={createRef}>
          <button
            onClick={openCreate}
            className={`w-9 h-9 ml-1 flex-shrink-0 flex items-center justify-center rounded-md transition-colors ${
              creating
                ? 'text-violet-300 bg-violet-500/10'
                : 'text-zinc-600 hover:text-violet-300 hover:bg-violet-500/10'
            }`}
            title="New file"
          >
            <Plus size={15} />
          </button>

          {creating && (
            <div className="absolute left-0 top-11 w-64 rounded-lg border border-zinc-800 bg-zinc-900 shadow-2xl z-50 p-3">
              <p className="text-[10px] font-semibold tracking-wide text-zinc-500 mb-2">
                NEW FILE
              </p>

              <div className="flex items-center gap-2 border-b border-zinc-800 focus-within:border-violet-500 transition-colors pb-2">
                <span className="text-violet-500 font-mono text-xs select-none">
                  {'>'}
                </span>

                <input
                  ref={createInputRef}
                  value={newFileName}
                  onChange={(e) => setNewFileName(e.target.value)}
                  onKeyDown={handleCreateKeyDown}
                  disabled={creatingBusy}
                  placeholder="e.g. utils.js"
                  className="flex-1 min-w-0 bg-transparent outline-none text-xs text-white font-mono placeholder:text-zinc-600 disabled:opacity-50"
                />

                <button
                  onClick={submitCreate}
                  disabled={creatingBusy || !newFileName.trim()}
                  className="w-5 h-5 flex items-center justify-center rounded text-zinc-500 hover:text-emerald-400 hover:bg-emerald-500/10 disabled:opacity-30 transition-colors"
                >
                  {creatingBusy ? (
                    <Loader2 size={12} className="animate-spin" />
                  ) : (
                    <Check size={12} />
                  )}
                </button>
              </div>

              {createError && (
                <p className="text-[10px] text-red-400 mt-2 leading-4">
                  {createError}
                </p>
              )}
            </div>
          )}
        </div>

      </div>

      <div className="h-full px-2 flex items-center border-l border-zinc-800">

        <button
          className="w-8 h-8 flex items-center justify-center text-zinc-500 hover:text-white hover:bg-zinc-900 rounded-md transition"
          title="More"
        >
          <MoreHorizontal size={17} />
        </button>

      </div>

    </div>
  )
}

export default NavBar