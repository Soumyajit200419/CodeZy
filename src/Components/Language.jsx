import React, { useEffect, useMemo, useState } from 'react'
import { Braces, Check, Search, X } from 'lucide-react'

const languages = [
  { id: 'javascript', name: 'JavaScript', icon: 'JS' },
  { id: 'typescript', name: 'TypeScript', icon: 'TS' },
  { id: 'python', name: 'Python', icon: 'PY' },
  { id: 'java', name: 'Java', icon: 'JV' },
  { id: 'c', name: 'C', icon: 'C' },
  { id: 'cpp', name: 'C++', icon: 'C++' },
  { id: 'csharp', name: 'C#', icon: 'C#' },
  { id: 'go', name: 'Go', icon: 'GO' },
  { id: 'rust', name: 'Rust', icon: 'RS' },
  { id: 'ruby', name: 'Ruby', icon: 'RB' },
  { id: 'php', name: 'PHP', icon: 'PHP' },
  { id: 'swift', name: 'Swift', icon: 'SW' },
  { id: 'kotlin', name: 'Kotlin', icon: 'KT' },
  { id: 'scala', name: 'Scala', icon: 'SC' },
  { id: 'dart', name: 'Dart', icon: 'DA' },
  { id: 'r', name: 'R', icon: 'R' },
  { id: 'perl', name: 'Perl', icon: 'PL' },
  { id: 'lua', name: 'Lua', icon: 'LU' },
  { id: 'haskell', name: 'Haskell', icon: 'HS' },
  { id: 'elixir', name: 'Elixir', icon: 'EX' },
  { id: 'erlang', name: 'Erlang', icon: 'ER' },
  { id: 'julia', name: 'Julia', icon: 'JL' },
  { id: 'bash', name: 'Bash', icon: 'SH' },
  { id: 'powershell', name: 'PowerShell', icon: 'PS' },
  { id: 'sql', name: 'SQL', icon: 'SQL' },
  { id: 'objectivec', name: 'Objective-C', icon: 'OC' },
  { id: 'groovy', name: 'Groovy', icon: 'GR' },
  { id: 'fsharp', name: 'F#', icon: 'F#' },
  { id: 'clojure', name: 'Clojure', icon: 'CL' },
  { id: 'ocaml', name: 'OCaml', icon: 'OC' },
  { id: 'nim', name: 'Nim', icon: 'NM' },
  { id: 'zig', name: 'Zig', icon: 'ZG' },
  { id: 'crystal', name: 'Crystal', icon: 'CR' },
  { id: 'fortran', name: 'Fortran', icon: 'FT' },
  { id: 'pascal', name: 'Pascal', icon: 'PA' },
  { id: 'vb', name: 'Visual Basic', icon: 'VB' },
  { id: 'html', name: 'HTML', icon: 'HTML' },
  { id: 'css', name: 'CSS', icon: 'CSS' },
  { id: 'json', name: 'JSON', icon: '{}' }
]

export const Language = ({
  value = 'javascript',
  onChange
}) => {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')

  const selectedLanguage =
    languages.find(language => language.id === value) ||
    languages[0]

  const filteredLanguages = useMemo(() => {
    const query = search.toLowerCase().trim()

    if (!query) return languages

    return languages.filter(language =>
      language.name.toLowerCase().includes(query) ||
      language.id.toLowerCase().includes(query)
    )
  }, [search])

  useEffect(() => {
    if (!open) {
      setSearch('')
    }
  }, [open])

  const selectLanguage = language => {
    if (typeof onChange === 'function') {
      onChange(language.id)
    }

    setOpen(false)
    setSearch('')
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-9 h-9 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-md transition"
        title="Select language"
      >
        <Braces size={20} />
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
          />

          <div className="absolute left-12 top-1/2 -translate-y-1/2 w-60 bg-zinc-900 border border-zinc-700 rounded-lg shadow-xl p-2 z-50">
            <div className="flex items-center justify-between px-2 py-1.5">
              <p className="text-xs text-zinc-400">
                Select Language
              </p>

              <button
                type="button"
                onClick={() => setOpen(false)}
                className="w-6 h-6 flex items-center justify-center text-zinc-500 hover:text-white hover:bg-zinc-800 rounded transition"
              >
                <X size={15} />
              </button>
            </div>

            <div className="relative mt-1 mb-2">
              <Search
                size={15}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500"
              />

              <input
                type="text"
                placeholder="Search language..."
                value={search}
                onChange={event => setSearch(event.target.value)}
                onClick={event => event.stopPropagation()}
                className="w-full h-8 bg-zinc-800 border border-zinc-700 rounded-md pl-8 pr-2 text-xs text-white placeholder:text-zinc-500 outline-none focus:border-violet-500"
                autoFocus
              />
            </div>

            <div className="max-h-72 overflow-y-auto space-y-1 pr-1">
              {filteredLanguages.map(language => (
                <button
                  type="button"
                  key={language.id}
                  onClick={() => selectLanguage(language)}
                  className="w-full flex items-center gap-3 px-2 py-2 rounded-md text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white transition"
                >
                  <span className="w-7 h-7 shrink-0 flex items-center justify-center bg-zinc-800 rounded text-[10px] font-semibold">
                    {language.icon}
                  </span>

                  <span className="flex-1 text-left">
                    {language.name}
                  </span>

                  {selectedLanguage.id === language.id && (
                    <Check
                      size={15}
                      className="text-violet-400"
                    />
                  )}
                </button>
              ))}

              {filteredLanguages.length === 0 && (
                <p className="text-xs text-zinc-500 text-center py-3">
                  No language found
                </p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}