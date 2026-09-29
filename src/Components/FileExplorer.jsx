import React, { useState, useRef, useEffect } from 'react'
import {
  ChevronDown,
  ChevronRight,
  File,
  FileCode2,
  FileText,
  FileJson2,
  Folder,
  FolderOpen,
  Plus,
  FolderPlus,
  RefreshCw,
  MoreHorizontal,
  Trash2,
  Pencil,
  X,
  Check,
  Coffee,
  Gem,
  Hash,
  Database,
  Terminal,
  Globe,
  Palette,
  Image,
  GitBranch,
  KeyRound,
  Container,
  FileType2,
  AlertCircle,
  Loader2,
  Braces,
  Code2,
  CodeXml,
  Binary,
  Cpu,
  Blocks,
  SquareTerminal,
  Brackets,
  Atom,
  Server,
  Boxes,
  CircleDot,
  Sparkles
} from 'lucide-react'

const API_URL = 'http://localhost:5000'

const languageMeta = {
  js: { Icon: FileCode2, color: 'text-yellow-400' },
  jsx: { Icon: Braces, color: 'text-cyan-400' },
  ts: { Icon: FileType2, color: 'text-blue-400' },
  tsx: { Icon: Braces, color: 'text-blue-400' },
  py: { Icon: Code2, color: 'text-yellow-300' },
  cpp: { Icon: Code2, color: 'text-blue-500' },
  c: { Icon: Binary, color: 'text-blue-300' },
  h: { Icon: Binary, color: 'text-blue-300' },
  hpp: { Icon: Binary, color: 'text-blue-500' },
  java: { Icon: Coffee, color: 'text-orange-400' },
  go: { Icon: Blocks, color: 'text-cyan-300' },
  rs: { Icon: Cpu, color: 'text-orange-500' },
  php: { Icon: CodeXml, color: 'text-indigo-400' },
  rb: { Icon: Gem, color: 'text-red-400' },
  swift: { Icon: Code2, color: 'text-orange-400' },
  kt: { Icon: Code2, color: 'text-purple-400' },
  kts: { Icon: Code2, color: 'text-purple-400' },
  cs: { Icon: Hash, color: 'text-purple-300' },
  dart: { Icon: Atom, color: 'text-cyan-400' },
  scala: { Icon: Code2, color: 'text-red-500' },
  sql: { Icon: Database, color: 'text-blue-300' },
  sh: { Icon: SquareTerminal, color: 'text-zinc-300' },
  bash: { Icon: Terminal, color: 'text-zinc-300' },
  lua: { Icon: Code2, color: 'text-blue-400' },
  r: { Icon: CircleDot, color: 'text-blue-400' },
  vue: { Icon: Blocks, color: 'text-emerald-400' },
  svelte: { Icon: Sparkles, color: 'text-orange-500' },
  html: { Icon: Globe, color: 'text-orange-400' },
  css: { Icon: Palette, color: 'text-blue-400' },
  scss: { Icon: Palette, color: 'text-pink-400' },
  sass: { Icon: Palette, color: 'text-pink-400' },
  less: { Icon: Palette, color: 'text-indigo-400' },
  json: { Icon: FileJson2, color: 'text-yellow-400' },
  xml: { Icon: CodeXml, color: 'text-orange-300' },
  yaml: { Icon: FileText, color: 'text-red-300' },
  yml: { Icon: FileText, color: 'text-red-300' },
  toml: { Icon: FileText, color: 'text-zinc-300' },
  md: { Icon: FileText, color: 'text-blue-300' },
  txt: { Icon: FileText, color: 'text-zinc-400' },
  svg: { Icon: Image, color: 'text-orange-400' },
  git: { Icon: GitBranch, color: 'text-orange-500' },
  env: { Icon: KeyRound, color: 'text-yellow-300' },
  docker: { Icon: Container, color: 'text-blue-400' }
}

const FileBadge = ({ fileType }) => {
  const meta = languageMeta[fileType]

  if (meta) {
    const { Icon, color } = meta

    return (
      <div className="w-5 flex justify-center shrink-0">
        <Icon size={14} className={color} />
      </div>
    )
  }

  return (
    <div className="w-5 flex justify-center shrink-0">
      <File size={14} className="text-zinc-500" />
    </div>
  )
}

const IndentGuides = ({ level }) => {
  if (level === 0) {
    return null
  }

  return (
    <div className="absolute left-0 top-0 h-full flex pointer-events-none">
      {Array.from({ length: level }).map((_, i) => (
        <div
          key={i}
          className="h-full border-l border-zinc-800/70"
          style={{
            marginLeft: i === 0 ? '19px' : '14px'
          }}
        />
      ))}
    </div>
  )
}

const getFileExtension = name => {
  if (!name || !name.includes('.')) {
    return ''
  }

  return name
    .split('.')
    .pop()
    .toLowerCase()
}

const getLanguageFromExtension = extension => {
  const map = {
    js: 'javascript',
    jsx: 'javascript',
    ts: 'typescript',
    tsx: 'typescript',
    py: 'python',
    cpp: 'cpp',
    c: 'c',
    h: 'c',
    hpp: 'cpp',
    java: 'java',
    go: 'go',
    rs: 'rust',
    php: 'php',
    rb: 'ruby',
    swift: 'swift',
    kt: 'kotlin',
    kts: 'kotlin',
    cs: 'csharp',
    dart: 'dart',
    scala: 'scala',
    sql: 'sql',
    sh: 'shell',
    bash: 'shell',
    lua: 'lua',
    r: 'r',
    vue: 'vue',
    svelte: 'svelte',
    html: 'html',
    css: 'css',
    scss: 'scss',
    sass: 'sass',
    less: 'less',
    json: 'json',
    xml: 'xml',
    yaml: 'yaml',
    yml: 'yaml',
    md: 'markdown'
  }

  return map[extension] || ''
}

const treeNodeFromItem = item => ({
  id: item._id,
  name: item.name,
  type: item.type,
  open: false,
  path: item.path,
  content: item.content || '',
  language: item.language || '',
  extension:
    item.extension ||
    getFileExtension(item.name),
  parent: item.parent || null,
  backendFile: item
})

const buildTree = items => {
  const tree = []
  const folders = new Map()

  const sortedItems = [...items].sort((a, b) => {
    if (a.type !== b.type) {
      return a.type === 'folder' ? -1 : 1
    }

    return a.name.localeCompare(b.name)
  })

  sortedItems.forEach(item => {
    if (item.type === 'folder') {
      const node = {
        id: item._id,
        name: item.name,
        type: item.type,
        open: true,
        path: item.path,
        content: item.content || '',
        language: item.language || '',
        extension:
          item.extension ||
          getFileExtension(item.name),
        parent: item.parent || null,
        backendFile: item,
        children: []
      }

      folders.set(String(item._id), node)
    }
  })

  sortedItems.forEach(item => {
    if (item.type === 'folder') {
      return
    }

    const node = treeNodeFromItem(item)

    if (item.parent) {
      const parentFolder = folders.get(
        String(item.parent)
      )

      if (parentFolder) {
        parentFolder.children.push(node)
        return
      }
    }

    tree.push(node)
  })

  sortedItems
    .filter(item => item.type === 'folder')
    .forEach(item => {
      const folder = folders.get(
        String(item._id)
      )

      if (!item.parent) {
        tree.push(folder)
        return
      }

      const parentFolder = folders.get(
        String(item.parent)
      )

      if (parentFolder) {
        parentFolder.children.push(folder)
      } else {
        tree.push(folder)
      }
    })

  const sortTree = nodes => {
    nodes.sort((a, b) => {
      if (a.type !== b.type) {
        return a.type === 'folder' ? -1 : 1
      }

      return a.name.localeCompare(b.name)
    })

    nodes.forEach(node => {
      if (node.children) {
        sortTree(node.children)
      }
    })
  }

  sortTree(tree)

  return tree
}

export const FileExplorer = ({
  projectId,
  token,
  onFileSelect,
  onClose
}) => {
  const [files, setFiles] = useState([])
  const [selectedFile, setSelectedFile] = useState(null)
  const [selectedFolderId, setSelectedFolderId] = useState(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [createBox, setCreateBox] = useState(null)
  const [newName, setNewName] = useState('')
  const [renamingId, setRenamingId] = useState(null)
  const [renameValue, setRenameValue] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const menuRef = useRef(null)

  const apiRequest = async (
    url,
    options = {}
  ) => {
    const headers = {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }

    if (token) {
      headers.Authorization = `Bearer ${token}`
    }

    const response = await fetch(
      `${API_URL}${url}`,
      {
        ...options,
        headers
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
        'Something went wrong'
      )
    }

    return data
  }

  const loadFiles = async () => {
    if (!projectId || !token) {
      setFiles([])
      return
    }

    try {
      setLoading(true)
      setError('')

      const response = await apiRequest(
        `/api/files/project/${projectId}`
      )

      const tree = buildTree(
        response.files || []
      )

      setFiles(tree)
    } catch (error) {
      console.error(
        'Failed to load files:',
        error
      )

      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadFiles()
  }, [projectId, token])

  useEffect(() => {
    if (!menuOpen) {
      return
    }

    const handleClickOutside = e => {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target)
      ) {
        setMenuOpen(false)
      }
    }

    const handleEscape = e => {
      if (e.key === 'Escape') {
        setMenuOpen(false)
      }
    }

    document.addEventListener(
      'mousedown',
      handleClickOutside
    )

    document.addEventListener(
      'keydown',
      handleEscape
    )

    return () => {
      document.removeEventListener(
        'mousedown',
        handleClickOutside
      )

      document.removeEventListener(
        'keydown',
        handleEscape
      )
    }
  }, [menuOpen])

  const updateTree = (
    items,
    id,
    updater
  ) => {
    return items.map(item => {
      if (
        String(item.id) ===
        String(id)
      ) {
        return updater(item)
      }

      if (item.children) {
        return {
          ...item,
          children: updateTree(
            item.children,
            id,
            updater
          )
        }
      }

      return item
    })
  }

  const findItem = (
    items,
    id
  ) => {
    for (const item of items) {
      if (
        String(item.id) ===
        String(id)
      ) {
        return item
      }

      if (item.children) {
        const found = findItem(
          item.children,
          id
        )

        if (found) {
          return found
        }
      }
    }

    return null
  }

  const getFolderPath = folderId => {
    if (!folderId) {
      return ''
    }

    const folder = findItem(
      files,
      folderId
    )

    return folder?.path || ''
  }

  const toggleFolder = id => {
    setFiles(current =>
      updateTree(
        current,
        id,
        item => ({
          ...item,
          open: !item.open
        })
      )
    )
  }

  const selectFolder = id => {
    setSelectedFolderId(id)
    setSelectedFile(null)
    toggleFolder(id)
  }

  const openCreateBox = type => {
    setCreateBox(type)
    setNewName('')
    setMenuOpen(false)
  }

  const insertIntoTree = (
    items,
    targetFolderId,
    newItem
  ) => {
    if (targetFolderId === null) {
      return [...items, newItem]
    }

    return items.map(item => {
      if (
        String(item.id) ===
          String(targetFolderId) &&
        item.type === 'folder'
      ) {
        return {
          ...item,
          open: true,
          children: [
            ...(item.children || []),
            newItem
          ]
        }
      }

      if (item.children) {
        return {
          ...item,
          children: insertIntoTree(
            item.children,
            targetFolderId,
            newItem
          )
        }
      }

      return item
    })
  }

  const createItem = async () => {
    const name = newName.trim()

    if (!name) {
      return
    }

    if (!projectId || !token) {
      setError(
        'Please login and open a project first'
      )
      return
    }

    try {
      setError('')

      const parentPath =
        getFolderPath(
          selectedFolderId
        )

      const path = parentPath
        ? `${parentPath}/${name}`
        : name

      const extension =
        createBox === 'file'
          ? getFileExtension(name)
          : ''

      const language =
        createBox === 'file'
          ? getLanguageFromExtension(
              extension
            )
          : ''

      const response =
        await apiRequest(
          `/api/files/${projectId}`,
          {
            method: 'POST',
            body: JSON.stringify({
              name,
              path,
              type: createBox,
              content: '',
              language,
              extension,
              parent:
                selectedFolderId || null
            })
          }
        )

      if (!response.file) {
        throw new Error(
          'File was created but no file data was returned'
        )
      }

      const createdFile =
        response.file

      const newItem = {
        id: createdFile._id,
        name: createdFile.name,
        type: createdFile.type,
        open: false,
        path: createdFile.path,
        content:
          createdFile.content || '',
        language:
          createdFile.language || '',
        extension:
          createdFile.extension ||
          extension,
        parent:
          createdFile.parent || null,
        backendFile:
          createdFile,
        ...(createdFile.type ===
        'folder'
          ? { children: [] }
          : {})
      }

      setFiles(current =>
        insertIntoTree(
          current,
          selectedFolderId,
          newItem
        )
      )

      setCreateBox(null)
      setNewName('')

      if (
        createdFile.type === 'file'
      ) {
        setSelectedFile(
          createdFile._id
        )

        setSelectedFolderId(null)

        onFileSelect?.({
          ...createdFile,
          __isNewFile: true
        })
      } else {
        setSelectedFolderId(
          createdFile._id
        )
        setSelectedFile(null)
      }
    } catch (error) {
      console.error(
        'Create item error:',
        error
      )

      setError(
        error.message ||
        'Failed to create item'
      )
    }
  }

  const handleInputKeyDown = e => {
    if (e.key === 'Enter') {
      createItem()
    }

    if (e.key === 'Escape') {
      setCreateBox(null)
      setNewName('')
    }
  }

  const removeFromTree = (
    items,
    id
  ) => {
    return items
      .filter(
        item =>
          String(item.id) !==
          String(id)
      )
      .map(item => ({
        ...item,
        children: item.children
          ? removeFromTree(
              item.children,
              id
            )
          : item.children
      }))
  }

  const deleteItem = async id => {
    const item = findItem(
      files,
      id
    )

    if (
      !item ||
      !projectId ||
      !token
    ) {
      return
    }

    try {
      setError('')

      await apiRequest(
        `/api/files/${projectId}/${id}`,
        {
          method: 'DELETE'
        }
      )

      setFiles(current =>
        removeFromTree(
          current,
          id
        )
      )

      if (
        String(selectedFile) ===
        String(id)
      ) {
        setSelectedFile(null)
      }

      if (
        String(selectedFolderId) ===
        String(id)
      ) {
        setSelectedFolderId(null)
      }
    } catch (error) {
      console.error(
        'Delete item error:',
        error
      )

      setError(error.message)
    }
  }

  const startRename = (
    id,
    currentName
  ) => {
    setRenamingId(id)
    setRenameValue(currentName)
  }

  const commitRename = async () => {
    const name =
      renameValue.trim()

    if (!name) {
      setRenamingId(null)
      return
    }

    const item = findItem(
      files,
      renamingId
    )

    if (
      !item ||
      !projectId ||
      !token
    ) {
      setRenamingId(null)
      return
    }

    if (name === item.name) {
      setRenamingId(null)
      return
    }

    try {
      setError('')

      const response =
        await apiRequest(
          `/api/files/${projectId}/${renamingId}/rename`,
          {
            method: 'PATCH',
            body: JSON.stringify({
              name
            })
          }
        )

      const updatedFile =
        response.file

      setFiles(current =>
        updateTree(
          current,
          renamingId,
          currentItem => ({
            ...currentItem,
            name:
              updatedFile?.name ||
              name,
            path:
              updatedFile?.path ||
              currentItem.path,
            extension:
              currentItem.type === 'file'
                ? getFileExtension(
                    name
                  )
                : '',
            backendFile:
              updatedFile
          })
        )
      )

      if (
        String(selectedFile) ===
        String(renamingId)
      ) {
        onFileSelect?.(
          updatedFile
        )
      }

      await loadFiles()

      setRenamingId(null)
      setRenameValue('')
    } catch (error) {
      console.error(
        'Rename error:',
        error
      )

      setError(
        error.message ||
        'Failed to rename item'
      )

      setRenamingId(null)
    }
  }

  const handleRenameKeyDown = e => {
    if (e.key === 'Enter') {
      commitRename()
    }

    if (e.key === 'Escape') {
      setRenamingId(null)
      setRenameValue('')
    }
  }

  const handleFileClick = async item => {
    if (
      item.type === 'folder' ||
      renamingId
    ) {
      return
    }

    setSelectedFile(item.id)
    setSelectedFolderId(null)

    if (!projectId || !token) {
      onFileSelect?.(item)
      return
    }

    try {
      setError('')

      const response =
        await apiRequest(
          `/api/files/${projectId}/${item.id}`
        )

      if (response.file) {
        onFileSelect?.(
          response.file
        )
      }
    } catch (error) {
      console.error(
        'Open file error:',
        error
      )

      setError(error.message)
    }
  }

  const resetExplorer = async () => {
    setSelectedFile(null)
    setSelectedFolderId(null)
    setCreateBox(null)
    setNewName('')
    setRenamingId(null)
    setRenameValue('')
    setMenuOpen(false)

    await loadFiles()
  }

  const renderItem = (
    item,
    level = 0
  ) => {
    const isRenaming =
      String(renamingId) ===
      String(item.id)

    if (item.type === 'folder') {
      const isSelected =
        String(selectedFolderId) ===
          String(item.id) &&
        !selectedFile

      return (
        <div
          key={item.id}
          className="relative"
        >
          <IndentGuides
            level={level}
          />

          <div
            onClick={() =>
              !isRenaming &&
              selectFolder(item.id)
            }
            className={`group relative flex items-center gap-1.5 h-7 px-2 cursor-pointer text-[13px] rounded-md mx-1 transition-colors duration-100 ${
              isSelected
                ? 'bg-violet-500/10 text-white'
                : 'text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-200'
            }`}
            style={{
              paddingLeft: `${
                8 + level * 14
              }px`
            }}
          >
            {isSelected && (
              <span className="absolute left-0 top-1 bottom-1 w-0.5 rounded-full bg-violet-500" />
            )}

            <span className="text-zinc-600">
              {item.open ? (
                <ChevronDown size={13} />
              ) : (
                <ChevronRight size={13} />
              )}
            </span>

            {item.open ? (
              <FolderOpen
                size={15}
                className="text-amber-400 shrink-0"
              />
            ) : (
              <Folder
                size={15}
                className="text-amber-400/90 shrink-0"
              />
            )}

            {isRenaming ? (
              <div className="flex-1 flex items-center gap-1.5 min-w-0">
                <span className="text-violet-500 font-mono text-xs select-none">
                  {'>'}
                </span>

                <input
                  autoFocus
                  value={renameValue}
                  onChange={e =>
                    setRenameValue(
                      e.target.value
                    )
                  }
                  onKeyDown={
                    handleRenameKeyDown
                  }
                  onClick={e =>
                    e.stopPropagation()
                  }
                  onBlur={
                    commitRename
                  }
                  className="flex-1 min-w-0 h-5 bg-transparent border-b border-violet-500 outline-none text-xs text-white font-mono"
                />
              </div>
            ) : (
              <span className="flex-1 truncate">
                {item.name}
              </span>
            )}

            {!isRenaming && (
              <div className="hidden group-hover:flex items-center gap-0.5">
                <button
                  onClick={e => {
                    e.stopPropagation()
                    startRename(
                      item.id,
                      item.name
                    )
                  }}
                  className="w-5 h-5 flex items-center justify-center rounded text-zinc-500 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <Pencil size={11} />
                </button>

                <button
                  onClick={e => {
                    e.stopPropagation()
                    deleteItem(
                      item.id
                    )
                  }}
                  className="w-5 h-5 flex items-center justify-center rounded text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                >
                  <Trash2 size={11} />
                </button>
              </div>
            )}
          </div>

          {item.open && (
            <div>
              {item.children &&
              item.children.length > 0 ? (
                item.children.map(
                  child =>
                    renderItem(
                      child,
                      level + 1
                    )
                )
              ) : (
                <div
                  className="text-[11px] text-zinc-700 italic h-6 flex items-center font-mono"
                  style={{
                    paddingLeft: `${
                      34 +
                      level * 14
                    }px`
                  }}
                >
                  empty
                </div>
              )}
            </div>
          )}
        </div>
      )
    }

    const isSelected =
      String(selectedFile) ===
      String(item.id)

    return (
      <div
        key={item.id}
        className="relative"
      >
        <IndentGuides
          level={level}
        />

        <div
          onClick={() =>
            handleFileClick(item)
          }
          className={`group relative flex items-center gap-2 h-7 px-2 mx-1 cursor-pointer text-[13px] rounded-md transition-colors duration-100 ${
            isSelected
              ? 'bg-violet-500/10 text-white'
              : 'text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-200'
          }`}
          style={{
            paddingLeft: `${
              22 + level * 14
            }px`
          }}
        >
          {isSelected && (
            <span className="absolute left-0 top-1 bottom-1 w-0.5 rounded-full bg-violet-500" />
          )}

          <FileBadge
            fileType={
              item.extension
            }
          />

          {isRenaming ? (
            <div className="flex-1 flex items-center gap-1.5 min-w-0">
              <span className="text-violet-500 font-mono text-xs select-none">
                {'>'}
              </span>

              <input
                autoFocus
                value={renameValue}
                onChange={e =>
                  setRenameValue(
                    e.target.value
                  )
                }
                onKeyDown={
                  handleRenameKeyDown
                }
                onClick={e =>
                  e.stopPropagation()
                }
                onBlur={
                  commitRename
                }
                className="flex-1 min-w-0 h-5 bg-transparent border-b border-violet-500 outline-none text-xs text-white font-mono"
              />
            </div>
          ) : (
            <span className="flex-1 truncate">
              {item.name}
            </span>
          )}

          {!isRenaming && (
            <div className="hidden group-hover:flex items-center gap-0.5">
              <button
                onClick={e => {
                  e.stopPropagation()
                  startRename(
                    item.id,
                    item.name
                  )
                }}
                className="w-5 h-5 flex items-center justify-center rounded text-zinc-500 hover:text-white hover:bg-white/10 transition-colors"
              >
                <Pencil size={11} />
              </button>

              <button
                onClick={e => {
                  e.stopPropagation()
                  deleteItem(
                    item.id
                  )
                }}
                className="w-5 h-5 flex items-center justify-center rounded text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
              >
                <Trash2 size={11} />
              </button>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="w-64 h-full py-1">
      <style>{`
        .codezy-explorer-scroll::-webkit-scrollbar {
          width: 8px;
        }

        .codezy-explorer-scroll::-webkit-scrollbar-track {
          background: transparent;
        }

        .codezy-explorer-scroll::-webkit-scrollbar-thumb {
          background: rgba(139,92,246,0.25);
          border-radius: 8px;
        }

        .codezy-explorer-scroll::-webkit-scrollbar-thumb:hover {
          background: rgba(139,92,246,0.45);
        }
      `}</style>

      <div className="h-full bg-zinc-900/95 backdrop-blur-sm border-r border-zinc-800 text-white flex flex-col rounded-r-lg shadow-2xl overflow-hidden">
        <div className="flex items-center gap-2 h-9 px-3 border-b border-zinc-800 bg-zinc-900/70 shrink-0">
          <span className="flex gap-1.5">
            <span className="w-2 h-2 rounded-full bg-zinc-700" />
            <span className="w-2 h-2 rounded-full bg-zinc-700" />
            <span className="w-2 h-2 rounded-full bg-zinc-700" />
          </span>

          <span className="font-mono text-[11px] text-zinc-500 ml-1">
            explorer
          </span>
        </div>

        <div className="h-10 px-3 flex items-center justify-between border-b border-zinc-800 shrink-0">
          <span className="text-[10px] font-semibold tracking-widest text-zinc-500">
            EXPLORER
          </span>

          <div className="flex items-center gap-0.5">
            <button
              onClick={() =>
                openCreateBox('file')
              }
              title="New File"
              className="w-6 h-6 flex items-center justify-center text-zinc-500 hover:text-violet-300 hover:bg-violet-500/10 rounded-md transition-colors"
            >
              <Plus size={14} />
            </button>

            <button
              onClick={() =>
                openCreateBox('folder')
              }
              title="New Folder"
              className="w-6 h-6 flex items-center justify-center text-zinc-500 hover:text-violet-300 hover:bg-violet-500/10 rounded-md transition-colors"
            >
              <FolderPlus
                size={14}
              />
            </button>

            <button
              title="Refresh"
              onClick={
                resetExplorer
              }
              className="w-6 h-6 flex items-center justify-center text-zinc-500 hover:text-violet-300 hover:bg-violet-500/10 rounded-md transition-colors"
            >
              <RefreshCw
                size={13}
              />
            </button>

            <div
              className="relative"
              ref={menuRef}
            >
              <button
                onClick={() =>
                  setMenuOpen(
                    v => !v
                  )
                }
                title="More"
                className="w-6 h-6 flex items-center justify-center text-zinc-500 hover:text-violet-300 hover:bg-violet-500/10 rounded-md transition-colors"
              >
                <MoreHorizontal
                  size={14}
                />
              </button>

              {menuOpen && (
                <div className="absolute right-0 top-8 w-44 bg-zinc-900 border border-zinc-700 rounded-lg shadow-2xl p-1 z-50">
                  <button
                    onClick={() =>
                      openCreateBox(
                        'file'
                      )
                    }
                    className="w-full flex items-center gap-2 px-2 py-2 text-xs text-zinc-300 hover:bg-white/[0.06] hover:text-white rounded-md transition-colors"
                  >
                    <Plus size={13} />
                    New File
                  </button>

                  <button
                    onClick={() =>
                      openCreateBox(
                        'folder'
                      )
                    }
                    className="w-full flex items-center gap-2 px-2 py-2 text-xs text-zinc-300 hover:bg-white/[0.06] hover:text-white rounded-md transition-colors"
                  >
                    <FolderPlus
                      size={13}
                    />
                    New Folder
                  </button>

                  <div className="h-px bg-zinc-800 my-1" />

                  <button
                    onClick={
                      resetExplorer
                    }
                    className="w-full flex items-center gap-2 px-2 py-2 text-xs text-zinc-300 hover:bg-white/[0.06] hover:text-white rounded-md transition-colors"
                  >
                    <RefreshCw
                      size={13}
                    />
                    Refresh Explorer
                  </button>
                </div>
              )}
            </div>

            <button
              onClick={onClose}
              title="Close Explorer"
              className="w-6 h-6 flex items-center justify-center text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-md transition-colors"
            >
              <X size={14} />
            </button>
          </div>
        </div>

        <div className="codezy-explorer-scroll px-2 py-2 flex-1 overflow-y-auto">
          <div
            onClick={() => {
              setSelectedFolderId(
                null
              )
              setSelectedFile(null)
            }}
            className="flex items-center gap-1.5 h-7 px-2 mb-1 text-[12px] font-mono text-zinc-500 cursor-pointer hover:text-zinc-300 transition-colors"
          >
            <ChevronDown
              size={13}
            />

            <FolderOpen
              size={15}
              className="text-violet-400"
            />

            <span className="flex-1 truncate">
              ~/codezy
            </span>
          </div>

          {loading && (
            <div className="px-3 py-4 flex items-center gap-2 text-[11px] text-zinc-500 font-mono">
              <Loader2
                size={12}
                className="animate-spin text-violet-500"
              />
              loading files...
            </div>
          )}

          {error && (
            <div className="flex items-start gap-2 mx-1 mb-2 px-2.5 py-2 bg-red-500/10 border border-red-500/20 rounded-lg text-[11px] text-red-400">
              <AlertCircle
                size={12}
                className="shrink-0 mt-0.5"
              />

              <span>
                {error}
              </span>
            </div>
          )}

          {createBox && (
            <div className="flex items-center gap-2 h-7 px-2 mb-1 mx-1">
              {createBox ===
              'folder' ? (
                <Folder
                  size={15}
                  className="text-amber-400 shrink-0"
                />
              ) : (
                <FileCode2
                  size={14}
                  className="text-zinc-400 shrink-0"
                />
              )}

              <span className="text-violet-500 font-mono text-xs select-none">
                {'>'}
              </span>

              <input
                autoFocus
                value={newName}
                onChange={e =>
                  setNewName(
                    e.target.value
                  )
                }
                onKeyDown={
                  handleInputKeyDown
                }
                onBlur={() => {
                  if (
                    newName.trim()
                  ) {
                    createItem()
                  } else {
                    setCreateBox(null)
                  }
                }}
                placeholder={
                  createBox ===
                  'folder'
                    ? 'Folder name'
                    : 'File name'
                }
                className="flex-1 min-w-0 h-6 bg-transparent border-b border-violet-500 outline-none text-xs text-white font-mono placeholder:text-zinc-600"
              />

              <button
                onMouseDown={e =>
                  e.preventDefault()
                }
                onClick={
                  createItem
                }
                className="w-5 h-5 flex items-center justify-center rounded text-zinc-500 hover:text-emerald-400 hover:bg-emerald-500/10 transition-colors"
              >
                <Check size={12} />
              </button>

              <button
                onMouseDown={e =>
                  e.preventDefault()
                }
                onClick={() => {
                  setCreateBox(null)
                  setNewName('')
                }}
                className="w-5 h-5 flex items-center justify-center rounded text-zinc-500 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X size={12} />
              </button>
            </div>
          )}

          <div>
            {files.map(item =>
              renderItem(item)
            )}
          </div>

          {!loading &&
            files.length === 0 &&
            !error && (
              <div className="px-3 py-6 flex flex-col items-center gap-2 text-center">
                <FolderOpen
                  size={22}
                  className="text-zinc-700"
                />

                <p className="text-[11px] text-zinc-600">
                  No files in this project
                </p>
              </div>
            )}
        </div>
      </div>
    </div>
  )
}