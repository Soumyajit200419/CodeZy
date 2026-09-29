import React, { useEffect, useRef, useState } from 'react'
import { Play, FolderPlus, X } from 'lucide-react'
import { SideBar } from './SideBar'
import { FileExplorer } from './FileExplorer'
import NavBar from './NavBar'
import CodeWrittter from './CodeWrittter'
import { Terminal } from './Terminal'
import { Account } from './Account'

const API_URL = 'http://localhost:5000'

const EXTENSION_LANGUAGE_MAP = {
  js: 'javascript',
  jsx: 'javascript',
  ts: 'typescript',
  tsx: 'typescript',
  py: 'python',
  cpp: 'cpp',
  c: 'c',
  java: 'java',
  go: 'go',
  rs: 'rust',
  php: 'php',
  rb: 'ruby'
}

export const All = () => {
  const [activePanel, setActivePanel] = useState('explorer')
  const [showTerminal, setShowTerminal] = useState(true)
  const [showRunDebug, setShowRunDebug] = useState(false)
  const [showAccountPage, setShowAccountPage] = useState(false)
  const [code, setCode] = useState(
    `console.log("Hello from Codezy")`
  )
  const [language, setLanguage] = useState('javascript')
  const [errorLine, setErrorLine] = useState(null)
  const [token, setToken] = useState(() =>
    localStorage.getItem('codezy_token')
  )
  const [projectId, setProjectId] = useState(() =>
    localStorage.getItem('codezy_project_id')
  )
  const [user, setUser] = useState(null)
  const [currentFile, setCurrentFile] = useState(null)
  const [isSaving, setIsSaving] = useState(false)
  const [showProjectModal, setShowProjectModal] = useState(false)
  const [projectName, setProjectName] = useState('')
  const [projectDescription, setProjectDescription] = useState('')
  const [isCreatingProject, setIsCreatingProject] = useState(false)
  const [projectError, setProjectError] = useState('')

  const terminalRef = useRef(null)
  const saveTimerRef = useRef(null)

  useEffect(() => {
    const savedToken = localStorage.getItem('codezy_token')
    const savedProjectId = localStorage.getItem('codezy_project_id')

    setToken(savedToken || null)
    setProjectId(savedProjectId || null)
  }, [])

  const apiRequest = async (url, options = {}) => {
    const headers = {
      ...(options.body
        ? {
            'Content-Type': 'application/json'
          }
        : {}),
      ...(options.headers || {})
    }

    const currentToken =
      token || localStorage.getItem('codezy_token')

    if (currentToken) {
      headers.Authorization = `Bearer ${currentToken}`
    }

    const response = await fetch(`${API_URL}${url}`, {
      ...options,
      headers
    })

    let data = {}

    try {
      data = await response.json()
    } catch {
      data = {}
    }

    if (!response.ok) {
      if (response.status === 401) {
        localStorage.removeItem('codezy_token')
        localStorage.removeItem('codezy_project_id')

        setToken(null)
        setUser(null)
        setProjectId(null)
        setCurrentFile(null)
      }

      throw new Error(
        data.message ||
          data.error ||
          'Something went wrong'
      )
    }

    return data
  }

  useEffect(() => {
    const loadUser = async () => {
      const savedToken =
        localStorage.getItem('codezy_token')

      if (!savedToken) {
        setUser(null)
        setToken(null)
        return
      }

      try {
        const response = await fetch(
          `${API_URL}/api/auth/me`,
          {
            headers: {
              Authorization: `Bearer ${savedToken}`
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
          localStorage.removeItem('codezy_token')
          localStorage.removeItem('codezy_project_id')

          setToken(null)
          setUser(null)
          setProjectId(null)
          setCurrentFile(null)

          return
        }

        setToken(savedToken)

        if (data.user) {
          setUser(data.user)
        }
      } catch (error) {
        console.error(
          'Failed to load user:',
          error
        )
      }
    }

    loadUser()
  }, [])

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current)
      }
    }
  }, [])

  useEffect(() => {
    const handleProjectJoined = event => {
      const joinedProjectId =
        event.detail?.id ||
        event.detail?._id

      if (!joinedProjectId) {
        return
      }

      localStorage.setItem(
        'codezy_project_id',
        joinedProjectId
      )

      setProjectId(joinedProjectId)
      setCurrentFile(null)
      setCode(
        `console.log("Hello from Codezy")`
      )
      setLanguage('javascript')
      setErrorLine(null)
      setActivePanel('explorer')
    }

    window.addEventListener(
      'codezy-project-joined',
      handleProjectJoined
    )

    return () => {
      window.removeEventListener(
        'codezy-project-joined',
        handleProjectJoined
      )
    }
  }, [])

  useEffect(() => {
    const loadProjects = async () => {
      const currentToken =
        token ||
        localStorage.getItem('codezy_token')

      if (!currentToken) {
        return
      }

      try {
        const response = await apiRequest(
          '/api/projects'
        )

        const projects = response.projects || []

        if (projects.length === 0) {
          setProjectId(null)

          localStorage.removeItem(
            'codezy_project_id'
          )

          setShowProjectModal(true)
          return
        }

        const savedProjectId =
          localStorage.getItem(
            'codezy_project_id'
          )

        const savedProject = projects.find(
          project =>
            String(project._id) ===
            String(savedProjectId)
        )

        const selectedProject =
          savedProject || projects[0]

        const selectedProjectId =
          selectedProject._id

        localStorage.setItem(
          'codezy_project_id',
          selectedProjectId
        )

        setProjectId(selectedProjectId)
      } catch (error) {
        console.error(
          'Failed to load projects:',
          error
        )
      }
    }

    if (token) {
      loadProjects()
    }
  }, [token])

  const createProject = async () => {
    const name = projectName.trim()

    if (!name) {
      setProjectError(
        'Please enter a project name'
      )
      return
    }

    if (!token) {
      setProjectError(
        'Please login first'
      )
      return
    }

    try {
      setIsCreatingProject(true)
      setProjectError('')

      const response = await apiRequest(
        '/api/projects',
        {
          method: 'POST',
          body: JSON.stringify({
            name,
            description:
              projectDescription.trim(),
            visibility: 'private',
            defaultLanguage: language,
            template: 'blank'
          })
        }
      )

      if (!response.project) {
        throw new Error(
          'Project was created but no project data was returned'
        )
      }

      const newProject =
        response.project

      const newProjectId =
        newProject._id

      if (!newProjectId) {
        throw new Error(
          'Project ID was not returned by the server'
        )
      }

      localStorage.setItem(
        'codezy_project_id',
        newProjectId
      )

      setProjectId(newProjectId)
      setProjectName('')
      setProjectDescription('')
      setProjectError('')
      setShowProjectModal(false)
      setCurrentFile(null)

      setCode(
        `console.log("Hello from Codezy")`
      )

      setLanguage(
        newProject.defaultLanguage ||
          'javascript'
      )

      setErrorLine(null)
    } catch (error) {
      console.error(
        'Failed to create project:',
        error
      )

      setProjectError(
        error.message ||
          'Failed to create project'
      )
    } finally {
      setIsCreatingProject(false)
    }
  }

  const handleExplorerClick = () => {
    setActivePanel(
      activePanel === 'explorer'
        ? null
        : 'explorer'
    )
  }

  const handleTerminalClick = () => {
    setShowTerminal(!showTerminal)
    setShowRunDebug(false)
  }

  const handleRunDebugClick = () => {
    setShowRunDebug(!showRunDebug)
    setShowTerminal(false)
  }

  const handleUserClick = () => {
    setShowAccountPage(true)
  }

  const handleRun = () => {
    if (!token || !projectId) {
      setShowProjectModal(true)
      return
    }

    setShowTerminal(true)
    setShowRunDebug(false)

    setTimeout(() => {
      terminalRef.current?.runNow()
    }, 0)
  }

  const handleFileSelect = async (
    file,
    isNewFile = false
  ) => {
    if (!file || file.type === 'folder') {
      return
    }

    const fileId =
      file._id || file.id

    if (!fileId) {
      return
    }

    if (!projectId || !token) {
      setCurrentFile({
        ...file,
        __isNewFile:
          isNewFile ||
          file.__isNewFile ||
          false
      })

      setCode(file.content || '')

      if (file.language) {
        setLanguage(file.language)
      }

      return
    }

    try {
      const response = await apiRequest(
        `/api/files/${projectId}/${fileId}`
      )

      if (!response.file) {
        return
      }

      const openedFile =
        response.file

      setCurrentFile({
        ...openedFile,
        __isNewFile:
          isNewFile ||
          file.__isNewFile ||
          false
      })

      setCode(
        openedFile.content || ''
      )

      if (openedFile.language) {
        setLanguage(
          openedFile.language
        )
      } else {
        setLanguage('javascript')
      }

      setErrorLine(null)
    } catch (error) {
      console.error(
        'Failed to load file:',
        error
      )
    }
  }

  const saveFile = async (
    file,
    newCode,
    newLanguage
  ) => {
    if (
      !file ||
      !projectId ||
      !token
    ) {
      return
    }

    const fileId =
      file._id || file.id

    if (!fileId) {
      return
    }

    try {
      setIsSaving(true)

      const response = await apiRequest(
        `/api/files/${projectId}/${fileId}`,
        {
          method: 'PUT',
          body: JSON.stringify({
            content: newCode,
            language: newLanguage,
            extension:
              file.extension || ''
          })
        }
      )

      if (response.file) {
        setCurrentFile({
          ...response.file,
          __isNewFile: false
        })
      }
    } catch (error) {
      console.error(
        'Failed to save file:',
        error
      )
    } finally {
      setIsSaving(false)
    }
  }

  const handleCodeChange = newCode => {
    setCode(newCode)

    if (
      !currentFile ||
      !projectId ||
      !token
    ) {
      return
    }

    if (saveTimerRef.current) {
      clearTimeout(
        saveTimerRef.current
      )
    }

    saveTimerRef.current =
      setTimeout(() => {
        saveFile(
          currentFile,
          newCode,
          language
        )
      }, 800)
  }

  const handleLanguageChange =
    newLanguage => {
      setLanguage(newLanguage)

      if (
        !currentFile ||
        !projectId ||
        !token
      ) {
        return
      }

      if (saveTimerRef.current) {
        clearTimeout(
          saveTimerRef.current
        )
      }

      saveTimerRef.current =
        setTimeout(() => {
          saveFile(
            currentFile,
            code,
            newLanguage
          )
        }, 300)
    }

  const handleDeleteFile = async file => {
    const fileId =
      file?._id || file?.id

    if (
      !fileId ||
      !projectId ||
      !token
    ) {
      return
    }

    try {
      if (saveTimerRef.current) {
        clearTimeout(
          saveTimerRef.current
        )
      }

      await apiRequest(
        `/api/files/${projectId}/${fileId}`,
        {
          method: 'DELETE'
        }
      )

      setCurrentFile(null)

      setCode(
        `console.log("Hello from Codezy")`
      )

      setLanguage('javascript')
      setErrorLine(null)
    } catch (error) {
      console.error(
        'Failed to delete file:',
        error
      )
    }
  }

  const handleCreateFile = async name => {
    const trimmedName =
      String(name || '').trim()

    if (!trimmedName) {
      return
    }

    if (!projectId || !token) {
      setShowProjectModal(true)

      throw new Error(
        'Please create or open a project first'
      )
    }

    const extension =
      trimmedName.includes('.')
        ? trimmedName
            .split('.')
            .pop()
            .toLowerCase()
        : ''

    const response = await apiRequest(
      `/api/files/${projectId}`,
      {
        method: 'POST',
        body: JSON.stringify({
          name: trimmedName,
          path: trimmedName,
          type: 'file',
          content: '',
          language:
            EXTENSION_LANGUAGE_MAP[
              extension
            ] || '',
          extension,
          parent: null
        })
      }
    )

    if (response.file) {
      await handleFileSelect(
        {
          ...response.file,
          __isNewFile: true
        },
        true
      )
    }
  }

  const handleLoginSuccess = (
    newToken,
    newUser
  ) => {
    if (newToken) {
      localStorage.setItem(
        'codezy_token',
        newToken
      )

      setToken(newToken)
      setUser(newUser || null)

      const savedProjectId =
        localStorage.getItem(
          'codezy_project_id'
        )

      setProjectId(
        savedProjectId || null
      )
    } else {
      localStorage.removeItem(
        'codezy_token'
      )

      localStorage.removeItem(
        'codezy_project_id'
      )

      setToken(null)
      setUser(null)
      setProjectId(null)
      setCurrentFile(null)

      setCode(
        `console.log("Hello from Codezy")`
      )

      setLanguage('javascript')
      setErrorLine(null)
    }

    setShowAccountPage(false)
  }

  const handleAccountClose = () => {
    setShowAccountPage(false)
  }

  if (showAccountPage) {
    return (
      <Account
        onClose={handleAccountClose}
        onLoginSuccess={
          handleLoginSuccess
        }
      />
    )
  }

  return (
    <div className="w-full h-screen bg-zinc-100 overflow-hidden">
      <div className="w-full h-full flex overflow-hidden">
        <div className="h-full flex shrink-0">
          <SideBar
            projectId={projectId}
            onExplorerClick={
              handleExplorerClick
            }
            onRunDebugClick={
              handleRunDebugClick
            }
            onTerminalClick={
              handleTerminalClick
            }
            onSettingsClick={() => {}}
            onUserClick={
              handleUserClick
            }
          />

          <div
            className={`h-full shrink-0 overflow-hidden transition-all duration-300 ${
              activePanel
                ? 'w-64'
                : 'w-0'
            }`}
          >
            {activePanel ===
              'explorer' && (
              <FileExplorer
                projectId={projectId}
                token={token}
                onFileSelect={
                  handleFileSelect
                }
                onClose={() =>
                  setActivePanel(null)
                }
              />
            )}
          </div>
        </div>

        <div className="flex-1 min-w-0 h-full bg-zinc-100 py-1 mx-1 overflow-hidden flex flex-col">
          <NavBar
            currentFile={currentFile}
            onFileSelect={
              handleFileSelect
            }
            onCreateFile={
              handleCreateFile
            }
          />

          <div className="flex-1 min-h-0 overflow-hidden">
            <CodeWrittter
              code={code}
              onCodeChange={
                handleCodeChange
              }
              language={language}
              onLanguageChange={
                handleLanguageChange
              }
              errorLine={errorLine}
              onRun={handleRun}
              currentFile={currentFile}
              onDeleteFile={
                handleDeleteFile
              }
              projectId={projectId}
            />
          </div>

          {showTerminal && (
            <Terminal
              ref={terminalRef}
              code={code}
              language={language}
              onErrorLine={
                setErrorLine
              }
              onClose={() =>
                setShowTerminal(false)
              }
            />
          )}

          {showRunDebug && (
            <div className="h-72 shrink-0 bg-zinc-950 text-white border-t border-zinc-800 rounded-b-md overflow-hidden">
              <div className="h-10 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between px-4">
                <div className="flex items-center gap-2">
                  <Play
                    size={14}
                    className="text-green-400"
                  />

                  <span className="text-xs font-semibold">
                    Run & Debug
                  </span>

                  <span className="text-[9px] text-zinc-600">
                    Codezy Debugger
                  </span>
                </div>

                <button
                  onClick={() =>
                    setShowRunDebug(false)
                  }
                  className="w-7 h-7 flex items-center justify-center text-zinc-500 hover:text-white hover:bg-zinc-800 rounded-md"
                >
                  <X size={14} />
                </button>
              </div>

              <div className="p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleRun}
                    className="h-8 px-4 bg-green-600 hover:bg-green-500 rounded-md text-xs flex items-center gap-2"
                  >
                    <Play
                      size={13}
                      fill="currentColor"
                    />

                    Start Debugging
                  </button>

                  <button className="h-8 px-4 bg-zinc-800 hover:bg-zinc-700 rounded-md text-xs">
                    Configure
                  </button>

                  {isSaving && (
                    <span className="text-[10px] text-zinc-500">
                      Saving...
                    </span>
                  )}
                </div>

                <div className="border border-zinc-800 rounded-lg p-4">
                  <p className="text-[10px] uppercase tracking-widest text-zinc-600 mb-3">
                    Debug Console
                  </p>

                  <div className="space-y-2 font-mono text-[11px]">
                    <p className="text-zinc-500">
                      Ready to start debugging...
                    </p>

                    <p className="text-zinc-600">
                      File:{' '}
                      <span className="text-zinc-400">
                        {currentFile?.name ||
                          'No file selected'}
                      </span>
                    </p>

                    <p className="text-zinc-600">
                      Environment:{' '}
                      <span className="text-violet-400">
                        {language}
                      </span>
                    </p>

                    {errorLine && (
                      <p className="text-red-400">
                        Error line:{' '}
                        {errorLine}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {showProjectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="w-[400px] bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl overflow-hidden">
            <div className="h-12 px-4 border-b border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FolderPlus
                  size={16}
                  className="text-violet-400"
                />

                <span className="text-sm font-semibold text-white">
                  Create Project
                </span>
              </div>

              <button
                onClick={() => {
                  if (!projectId) {
                    return
                  }

                  setShowProjectModal(false)
                }}
                className="w-7 h-7 flex items-center justify-center rounded-md text-zinc-500 hover:text-white hover:bg-zinc-800"
              >
                <X size={15} />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label className="block text-[11px] text-zinc-400 mb-2">
                  Project Name
                </label>

                <input
                  value={projectName}
                  onChange={event => {
                    setProjectName(
                      event.target.value
                    )
                    setProjectError('')
                  }}
                  onKeyDown={event => {
                    if (
                      event.key === 'Enter'
                    ) {
                      createProject()
                    }
                  }}
                  placeholder="My Codezy Project"
                  autoFocus
                  className="w-full h-10 px-3 bg-zinc-950 border border-zinc-800 rounded-md text-sm text-white outline-none focus:border-violet-500 placeholder:text-zinc-600"
                />
              </div>

              <div>
                <label className="block text-[11px] text-zinc-400 mb-2">
                  Description
                </label>

                <textarea
                  value={projectDescription}
                  onChange={event =>
                    setProjectDescription(
                      event.target.value
                    )
                  }
                  placeholder="Optional project description"
                  rows={3}
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-md text-sm text-white outline-none focus:border-violet-500 placeholder:text-zinc-600 resize-none"
                />
              </div>

              {projectError && (
                <div className="px-3 py-2 rounded-md bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
                  {projectError}
                </div>
              )}

              <button
                onClick={createProject}
                disabled={
                  isCreatingProject ||
                  !projectName.trim()
                }
                className="w-full h-10 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-md text-sm font-medium text-white transition"
              >
                {isCreatingProject
                  ? 'Creating Project...'
                  : 'Create Project'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}