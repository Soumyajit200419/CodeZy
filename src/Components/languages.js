// languages.js
import {
  FileCode2,
  FileType2,
  FileJson2,
  Coffee,
  Gem,
  Hash,
  Database,
  Globe,
  Palette,
  Terminal
} from 'lucide-react'

export const LANGUAGES = [
  { id: 'javascript', label: 'JavaScript', ext: 'js', aliases: ['js', 'node', 'nodejs', 'ecmascript', 'jsx'], Icon: FileCode2, color: 'text-yellow-400' },
  { id: 'typescript', label: 'TypeScript', ext: 'ts', aliases: ['ts', 'tsx'], Icon: FileType2, color: 'text-blue-400' },
  { id: 'python', label: 'Python', ext: 'py', aliases: ['py', 'python3', 'py3'], Icon: FileCode2, color: 'text-yellow-300' },
  { id: 'java', label: 'Java', ext: 'java', aliases: [], Icon: Coffee, color: 'text-orange-400' },
  { id: 'c', label: 'C', ext: 'c', aliases: ['ansic'], Icon: FileCode2, color: 'text-blue-300' },
  { id: 'cpp', label: 'C++', ext: 'cpp', aliases: ['c++', 'cplusplus', 'cc', 'cxx'], Icon: FileCode2, color: 'text-blue-500' },
  { id: 'csharp', label: 'C#', ext: 'cs', aliases: ['c#', 'cs', 'dotnet', 'net'], Icon: Hash, color: 'text-purple-300' },
  { id: 'go', label: 'Go', ext: 'go', aliases: ['golang'], Icon: FileCode2, color: 'text-cyan-300' },
  { id: 'rust', label: 'Rust', ext: 'rs', aliases: ['rs'], Icon: FileCode2, color: 'text-orange-500' },
  { id: 'ruby', label: 'Ruby', ext: 'rb', aliases: ['rb'], Icon: Gem, color: 'text-red-400' },
  { id: 'php', label: 'PHP', ext: 'php', aliases: [], Icon: FileCode2, color: 'text-indigo-400' },
  { id: 'swift', label: 'Swift', ext: 'swift', aliases: [], Icon: FileCode2, color: 'text-orange-400' },
  { id: 'kotlin', label: 'Kotlin', ext: 'kt', aliases: ['kt', 'kts'], Icon: FileCode2, color: 'text-purple-400' },
  { id: 'scala', label: 'Scala', ext: 'scala', aliases: [], Icon: FileCode2, color: 'text-red-500' },
  { id: 'dart', label: 'Dart', ext: 'dart', aliases: ['flutter'], Icon: FileCode2, color: 'text-cyan-400' },
  { id: 'r', label: 'R', ext: 'r', aliases: ['rlang'], Icon: FileCode2, color: 'text-blue-400' },
  { id: 'perl', label: 'Perl', ext: 'pl', aliases: ['pl'], Icon: FileCode2, color: 'text-indigo-300' },
  { id: 'lua', label: 'Lua', ext: 'lua', aliases: [], Icon: FileCode2, color: 'text-blue-400' },
  { id: 'haskell', label: 'Haskell', ext: 'hs', aliases: ['hs'], Icon: FileCode2, color: 'text-violet-400' },
  { id: 'elixir', label: 'Elixir', ext: 'exs', aliases: ['ex'], Icon: FileCode2, color: 'text-purple-500' },
  { id: 'erlang', label: 'Erlang', ext: 'erl', aliases: [], Icon: FileCode2, color: 'text-red-400' },
  { id: 'julia', label: 'Julia', ext: 'jl', aliases: ['jl'], Icon: FileCode2, color: 'text-purple-300' },
  { id: 'bash', label: 'Bash', ext: 'sh', aliases: ['sh', 'shell', 'zsh'], Icon: Terminal, color: 'text-zinc-300' },
  { id: 'powershell', label: 'PowerShell', ext: 'ps1', aliases: ['ps', 'ps1', 'pwsh'], Icon: Terminal, color: 'text-blue-300' },
  { id: 'sql', label: 'SQL', ext: 'sql', aliases: ['mysql', 'postgres', 'postgresql', 'sqlite'], Icon: Database, color: 'text-blue-300' },
  { id: 'objectivec', label: 'Objective-C', ext: 'm', aliases: ['objc', 'objective-c'], Icon: FileCode2, color: 'text-blue-400' },
  { id: 'groovy', label: 'Groovy', ext: 'groovy', aliases: [], Icon: FileCode2, color: 'text-emerald-400' },
  { id: 'fsharp', label: 'F#', ext: 'fs', aliases: ['f#', 'fs'], Icon: FileCode2, color: 'text-cyan-400' },
  { id: 'clojure', label: 'Clojure', ext: 'clj', aliases: ['clj'], Icon: FileCode2, color: 'text-green-400' },
  { id: 'ocaml', label: 'OCaml', ext: 'ml', aliases: ['ml'], Icon: FileCode2, color: 'text-orange-400' },
  { id: 'nim', label: 'Nim', ext: 'nim', aliases: [], Icon: FileCode2, color: 'text-yellow-400' },
  { id: 'zig', label: 'Zig', ext: 'zig', aliases: [], Icon: FileCode2, color: 'text-amber-400' },
  { id: 'crystal', label: 'Crystal', ext: 'cr', aliases: ['cr'], Icon: FileCode2, color: 'text-zinc-200' },
  { id: 'fortran', label: 'Fortran', ext: 'f90', aliases: ['f90'], Icon: FileCode2, color: 'text-purple-400' },
  { id: 'pascal', label: 'Pascal', ext: 'pas', aliases: ['delphi', 'pas'], Icon: FileCode2, color: 'text-blue-300' },
  { id: 'vb', label: 'Visual Basic', ext: 'vb', aliases: ['vbnet', 'visualbasic'], Icon: FileCode2, color: 'text-blue-500' },
  { id: 'html', label: 'HTML', ext: 'html', aliases: ['htm'], Icon: Globe, color: 'text-orange-400' },
  { id: 'css', label: 'CSS', ext: 'css', aliases: [], Icon: Palette, color: 'text-blue-400' },
  { id: 'json', label: 'JSON', ext: 'json', aliases: [], Icon: FileJson2, color: 'text-yellow-400' }
]

export const LANGUAGE_INDEX = LANGUAGES.reduce((map, item) => {
  map[item.id] = item
  item.aliases.forEach(alias => {
    map[alias] = item
  })
  map[item.label.toLowerCase()] = item
  return map
}, {})

export const normalizeKey = value =>
  String(value || '').trim().toLowerCase().replace(/[\s._-]+/g, '')

export const titleCase = value =>
  String(value || '')
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/(^|\s)\S/g, char => char.toUpperCase())

export const resolveLanguage = input => {
  const raw = String(input || '').trim()
  const key = normalizeKey(raw)

  if (!key) return LANGUAGE_INDEX.javascript
  if (LANGUAGE_INDEX[key]) return LANGUAGE_INDEX[key]

  const partial = LANGUAGES.find(
    item =>
      item.id.startsWith(key) ||
      normalizeKey(item.label).startsWith(key) ||
      item.aliases.some(alias => alias.startsWith(key))
  )

  if (partial) return partial

  return {
    id: key,
    label: titleCase(raw),
    ext: key.replace(/[^a-z0-9]/g, '').slice(0, 5) || 'txt',
    aliases: [],
    custom: true,
    Icon: FileCode2,
    color: 'text-zinc-400'
  }
}