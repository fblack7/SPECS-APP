import { useState, useMemo, useCallback, useRef } from 'react'
import Fuse from 'fuse.js'
import { allSpecs, CATEGORIES, MANUALS } from '../../data/specs'

// Fuse.js configuration for fuzzy search
const fuse = new Fuse(allSpecs, {
  keys: [
    { name: 'system',      weight: 0.25 },
    { name: 'component',   weight: 0.30 },
    { name: 'part_number', weight: 0.20 },
    { name: 'category',    weight: 0.10 },
    { name: 'value',       weight: 0.08 },
    { name: 'notes',       weight: 0.05 },
    { name: '_searchText', weight: 0.02 },
  ],
  threshold: 0.35,
  includeScore: true,
  includeMatches: true,
  minMatchCharLength: 2,
  ignoreLocation: true,
})

const CAT_COLORS = {
  'Torque Values':          '#C9982A',
  'Component Weights':      '#2E75B6',
  'Clearances & Tolerances':'#1E5631',
  'Brake Specifications':   '#8B0000',
  'Brake Mount Torques':    '#7B2D00',
  'Component Dimensions':   '#4B0082',
  'Gear Case Oil Levels':   '#005073',
  'Part Numbers':           '#3D3D3D',
  'Component Measurements': '#1A5276',
  'Operating Specs':        '#1A6B3C',
}

function highlight(text, matches, key) {
  if (!text || !matches) return text
  const match = matches.find(m => m.key === key)
  if (!match || !match.indices?.length) return text
  const str = String(text)
  const parts = []
  let last = 0
  for (const [start, end] of match.indices) {
    if (start > last) parts.push(str.slice(last, start))
    parts.push(<mark key={start}>{str.slice(start, end + 1)}</mark>)
    last = end + 1
  }
  if (last < str.length) parts.push(str.slice(last))
  return parts
}

function SpecRow({ item, matches }) {
  const catColor = CAT_COLORS[item.category] || '#666'
  return (
    <tr className="spec-row">
      <td>
        <span className="cat-badge" style={{ '--cat-color': catColor }}>
          {item.category}
        </span>
      </td>
      <td className="manual-cell">
        <span className={`manual-tag manual-${item.manual.replace(/\W/g, '')}`}>{item.manual}</span>
      </td>
      <td className="system-cell">{highlight(item.system, matches, 'system')}</td>
      <td className="component-cell">{highlight(item.component, matches, 'component')}</td>
      <td className="pn-cell">
        {item.part_number && <code className="part-number">{highlight(item.part_number, matches, 'part_number')}</code>}
      </td>
      <td className="value-cell">
        <span className="value-primary">{item.value}</span>
      </td>
      <td className="value-cell metric">
        {item.value_metric && <span className="value-metric">{item.value_metric}</span>}
      </td>
      <td className="notes-cell">
        {item.condition && <span className="condition-tag">{item.condition}</span>}
        {item.notes && <span className="notes-text">{item.notes}</span>}
      </td>
    </tr>
  )
}

export default function Dashboard() {
  const [query, setQuery]       = useState('')
  const [category, setCategory] = useState('All')
  const [manual, setManual]     = useState('All')
  const [page, setPage]         = useState(1)
  const inputRef = useRef()
  const PER_PAGE = 50

  const results = useMemo(() => {
    let items = []
    let matchMap = {}

    if (query.trim().length >= 2) {
      const fuseResults = fuse.search(query.trim())
      items = fuseResults.map(r => r.item)
      fuseResults.forEach(r => { matchMap[r.item.id] = r.matches })
    } else {
      items = [...allSpecs]
    }

    if (category !== 'All') items = items.filter(s => s.category === category)
    if (manual !== 'All')   items = items.filter(s => s.manual === manual)

    return { items, matchMap }
  }, [query, category, manual])

  const pageCount = Math.ceil(results.items.length / PER_PAGE)
  const paginated = results.items.slice((page - 1) * PER_PAGE, page * PER_PAGE)

  const handleSearch = useCallback(e => {
    setQuery(e.target.value)
    setPage(1)
  }, [])

  const handleCat = useCallback(e => {
    setCategory(e.target.value)
    setPage(1)
  }, [])

  const handleManual = useCallback(e => {
    setManual(e.target.value)
    setPage(1)
  }, [])

  const clearAll = useCallback(() => {
    setQuery(''); setCategory('All'); setManual('All'); setPage(1)
    inputRef.current?.focus()
  }, [])

  const active = query || category !== 'All' || manual !== 'All'

  return (
    <div className="dashboard">
      {/* ── Search bar ─────────────────────────────────────────── */}
      <div className="search-section">
        <div className="search-hero">
          <h1 className="search-title">Specification Search</h1>
          <p className="search-sub">
            {allSpecs.length.toLocaleString()} records across {CATEGORIES.length} categories — P&H 4100XPB &amp; 4100C
          </p>
        </div>

        <div className="search-bar-wrap">
          <div className="search-input-wrap">
            <svg className="search-icon" width="20" height="20" viewBox="0 0 20 20" fill="none">
              <circle cx="8.5" cy="8.5" r="5.5" stroke="#C9982A" strokeWidth="1.8"/>
              <path d="M13 13L17 17" stroke="#C9982A" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
            <input
              ref={inputRef}
              className="search-input"
              type="text"
              value={query}
              onChange={handleSearch}
              placeholder='Search specs… e.g. "crowd brake mounting torque" or "R41571F1"'
              spellCheck={false}
              autoFocus
            />
            {active && (
              <button className="search-clear" onClick={clearAll} title="Clear all filters">✕</button>
            )}
          </div>

          <div className="filters-row">
            <select className="filter-select" value={category} onChange={handleCat}>
              <option value="All">All Categories</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <select className="filter-select" value={manual} onChange={handleManual}>
              <option value="All">All Manuals</option>
              {MANUALS.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
            <span className="result-count">
              {results.items.length.toLocaleString()} result{results.items.length !== 1 ? 's' : ''}
              {query && <span className="fuzzy-label"> · fuzzy match</span>}
            </span>
          </div>
        </div>

        {/* Quick category pills */}
        <div className="cat-pills">
          <button
            className={`cat-pill ${category === 'All' ? 'active' : ''}`}
            onClick={() => { setCategory('All'); setPage(1) }}
          >All</button>
          {CATEGORIES.map(c => (
            <button
              key={c}
              className={`cat-pill ${category === c ? 'active' : ''}`}
              style={{ '--pill-color': CAT_COLORS[c] }}
              onClick={() => { setCategory(c === category ? 'All' : c); setPage(1) }}
            >{c}</button>
          ))}
        </div>
      </div>

      {/* ── Results table ──────────────────────────────────────── */}
      <div className="results-section">
        {paginated.length === 0 ? (
          <div className="empty-state">
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
              <circle cx="22" cy="22" r="14" stroke="#C9982A" strokeWidth="2" opacity="0.4"/>
              <path d="M32 32L42 42" stroke="#C9982A" strokeWidth="2" strokeLinecap="round" opacity="0.4"/>
              <path d="M22 16v12M16 22h12" stroke="#C9982A" strokeWidth="2" strokeLinecap="round" opacity="0.3"/>
            </svg>
            <p>No specifications found.</p>
            <button className="clear-btn" onClick={clearAll}>Clear filters</button>
          </div>
        ) : (
          <>
            <div className="table-wrap">
              <table className="spec-table">
                <thead>
                  <tr>
                    <th>Category</th>
                    <th>Manual</th>
                    <th>System</th>
                    <th>Component / Description</th>
                    <th>Part No.</th>
                    <th>Value (Imperial)</th>
                    <th>Value (Metric)</th>
                    <th>Condition / Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.map(item => (
                    <SpecRow
                      key={item.id}
                      item={item}
                      matches={results.matchMap[item.id]}
                    />
                  ))}
                </tbody>
              </table>
            </div>

            {pageCount > 1 && (
              <div className="pagination">
                <button
                  className="page-btn"
                  disabled={page === 1}
                  onClick={() => setPage(p => p - 1)}
                >← Prev</button>
                <span className="page-info">Page {page} of {pageCount}</span>
                <button
                  className="page-btn"
                  disabled={page === pageCount}
                  onClick={() => setPage(p => p + 1)}
                >Next →</button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
