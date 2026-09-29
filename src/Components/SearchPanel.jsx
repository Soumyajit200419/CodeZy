import React, { useState } from 'react'
import {
  Search,
  Replace,
  ChevronDown,
  FileCode2,
  X
} from 'lucide-react'

export const SearchPanel = ({ onClose }) => {
  const [search, setSearch] = useState('')
  const [replace, setReplace] = useState('')
  const [showReplace, setShowReplace] = useState(false)
  const [caseSensitive, setCaseSensitive] = useState(false)
  const [wholeWord, setWholeWord] = useState(false)
  const [regex, setRegex] = useState(false)

  const results = [
    {
      file: 'App.jsx',
      path: 'src/App.jsx',
      matches: [
        { line: 12, text: 'const App = () => {' },
        { line: 28, text: '<CodeWrittter onRun={handleRun} />' }
      ]
    },
    {
      file: 'CodeWrittter.jsx',
      path: 'src/components/CodeWrittter.jsx',
      matches: [
        { line: 8, text: 'export default function CodeWrittter({ onRun }) {' }
      ]
    },
    {
      file: 'NavBar.jsx',
      path: 'src/components/NavBar.jsx',
      matches: [
        { line: 4, text: 'const [activeFile, setActiveFile] = useState' }
      ]
    }
  ]

  const filteredResults = search.trim()
    ? results
        .map((item) => ({
          ...item,
          matches: item.matches.filter((match) =>
            match.text.toLowerCase().includes(search.toLowerCase())
          )
        }))
        .filter((item) => item.matches.length > 0)
    : []

  return (
    <div className="w-64 h-full bg-zinc-900 my-1 text-white border-r border-zinc-800 flex flex-col shrink-0 overflow-hidden">

      <div className="h-12 w-full px-3 flex items-center justify-between border-b border-zinc-800 shrink-0">
        <span className="text-xs font-semibold tracking-wide">
          SEARCH
        </span>

        <button
          onClick={onClose}
          title="Close Search"
          className="w-7 h-7 flex items-center justify-center text-zinc-500 hover:text-white hover:bg-zinc-800 rounded-md transition"
        >
          <X size={15} />
        </button>
      </div>

      <div className="w-full p-3 border-b border-zinc-800 space-y-2 shrink-0">

        <div className="w-full flex items-center gap-2">
          <div className="flex-1 min-w-0 h-8 bg-zinc-950 border border-zinc-700 focus-within:border-violet-500 rounded-md flex items-center px-2">
            <Search size={14} className="text-zinc-500 shrink-0" />

            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search"
              className="flex-1 min-w-0 bg-transparent outline-none border-none text-xs text-zinc-200 placeholder:text-zinc-600 px-2"
            />
          </div>

          <button
            onClick={() => setShowReplace(!showReplace)}
            className={`w-8 h-8 shrink-0 flex items-center justify-center rounded-md transition ${
              showReplace
                ? 'bg-violet-600 text-white'
                : 'text-zinc-500 hover:text-white hover:bg-zinc-800'
            }`}
            title="Toggle Replace"
          >
            <Replace size={15} />
          </button>
        </div>

        {showReplace && (
          <div className="w-full h-8 bg-zinc-950 border border-zinc-700 focus-within:border-violet-500 rounded-md flex items-center px-2">
            <Replace size={14} className="text-zinc-500 shrink-0" />

            <input
              type="text"
              value={replace}
              onChange={(e) => setReplace(e.target.value)}
              placeholder="Replace"
              className="flex-1 min-w-0 bg-transparent outline-none border-none text-xs text-zinc-200 placeholder:text-zinc-600 px-2"
            />
          </div>
        )}

        <div className="flex items-center gap-1 pt-1">
          <button
            onClick={() => setCaseSensitive(!caseSensitive)}
            className={`w-7 h-7 rounded text-[10px] font-bold transition ${
              caseSensitive
                ? 'bg-violet-600 text-white'
                : 'text-zinc-500 hover:text-white hover:bg-zinc-800'
            }`}
            title="Match Case"
          >
            Aa
          </button>

          <button
            onClick={() => setWholeWord(!wholeWord)}
            className={`w-7 h-7 rounded text-[10px] font-bold transition ${
              wholeWord
                ? 'bg-violet-600 text-white'
                : 'text-zinc-500 hover:text-white hover:bg-zinc-800'
            }`}
            title="Match Whole Word"
          >
            ab
          </button>

          <button
            onClick={() => setRegex(!regex)}
            className={`w-7 h-7 rounded text-[11px] font-mono transition ${
              regex
                ? 'bg-violet-600 text-white'
                : 'text-zinc-500 hover:text-white hover:bg-zinc-800'
            }`}
            title="Use Regular Expression"
          >
            .*
          </button>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto codezy-search-scroll">

        {!search.trim() ? (
          <div className="h-full flex flex-col items-center justify-center px-8 text-center">
            <Search size={28} className="text-zinc-700 mb-3" />

            <p className="text-xs text-zinc-500">
              Search across your project
            </p>

            <p className="text-[10px] text-zinc-700 mt-2 leading-relaxed">
              Type a word or phrase to search inside your project files.
            </p>
          </div>
        ) : (
          <div className="py-2">

            {filteredResults.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <p className="text-xs text-zinc-500">
                  No results found
                </p>

                <p className="text-[10px] text-zinc-700 mt-1">
                  Try a different search term
                </p>
              </div>
            ) : (
              <>
                <div className="px-3 py-2 text-[10px] text-zinc-500">
                  {filteredResults.reduce(
                    (total, item) => total + item.matches.length,
                    0
                  )}{' '}
                  results
                </div>

                {filteredResults.map((item) => (
                  <div key={item.path} className="mb-1">

                    <div className="flex items-center gap-1 px-3 py-1.5 text-zinc-300 hover:bg-zinc-800 cursor-pointer">
                      <ChevronDown
                        size={13}
                        className="text-zinc-600 shrink-0"
                      />

                      <FileCode2
                        size={14}
                        className="text-cyan-400 shrink-0"
                      />

                      <span className="text-xs truncate min-w-0">
                        {item.file}
                      </span>

                      <span className="text-[9px] text-zinc-600 ml-auto shrink-0">
                        {item.matches.length}
                      </span>
                    </div>

                    <div className="ml-7 border-l border-zinc-800">

                      {item.matches.map((match, index) => (
                        <div
                          key={index}
                          className="px-2 py-1.5 hover:bg-zinc-800 cursor-pointer"
                        >
                          <div className="flex items-center gap-2 min-w-0">

                            <span className="text-[9px] text-zinc-600 w-6 text-right shrink-0">
                              {match.line}
                            </span>

                            <span className="text-[10px] text-zinc-400 truncate font-mono min-w-0">
                              {match.text}
                            </span>

                          </div>
                        </div>
                      ))}

                    </div>
                  </div>
                ))}
              </>
            )}

          </div>
        )}

      </div>

      {showReplace && search.trim() && (
        <div className="border-t border-zinc-800 p-3 shrink-0">
          <button className="w-full h-8 bg-zinc-800 hover:bg-zinc-700 text-xs text-zinc-300 rounded-md transition">
            Replace All
          </button>
        </div>
      )}

    </div>
  )
}