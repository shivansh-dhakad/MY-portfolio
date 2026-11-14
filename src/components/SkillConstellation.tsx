import { useState, useMemo, useEffect } from 'react'
import {
  SKILLS_DATA,
  SKILL_DOMAINS,
  type SkillItem,
  type SkillDomain,
  type ProjectItem,
} from '../data/portfolioData'
import { IconTerminal, IconClose, IconSearch } from './Icons'

interface SkillConstellationProps {
  skills?: SkillItem[]
  projects: ProjectItem[]
  selectedSkill: string | null
  onSelectSkill: (skill: string | null) => void
}

interface GNode {
  id: string
  name: string
  domain: SkillDomain
  color: string
  x: number
  y: number
  r: number
  w: number // pill width (hubs only)
  ox: number // outward direction, used to place the label away from the graph
  oy: number
  isHub: boolean
  count: number
}
interface GEdge {
  source: string
  target: string
  color: string
}

// Set to true to always draw every technology name (can get crowded).
const ALWAYS_SHOW_LABELS = false

const CX = 470
const CY = 270
const DEG = Math.PI / 180
// Core language angles (degrees). Chosen to leave gaps where the hub-to-hub lines pass.
const CORE_ANGLES = [-143, -117, -62, -36, 14, 75, 105, 166]

const DOMAIN_COLOR: Record<SkillDomain, string> = {
  'Languages & Core': '#38bdf8',
  'Data Analysis': '#10b981',
  'Machine Learning': '#a855f7',
  'Deep Learning': '#f59e0b',
  'Generative AI': '#06b6d4',
  'Agentic AI & Backend': '#ec4899',
}

// Database category names differ slightly from the display domains
const DOMAIN_ALIASES: Record<string, SkillDomain> = {
  programming: 'Languages & Core',
  'web development and backend': 'Agentic AI & Backend',
  'web & backend': 'Agentic AI & Backend',
}

function normalizeDomain(d: string): SkillDomain {
  const hit = SKILL_DOMAINS.find((x) => x.toLowerCase() === d.toLowerCase())
  return hit ?? DOMAIN_ALIASES[d.toLowerCase()] ?? (d.trim() || 'Languages & Core')
}

// Colours for domains created in the admin dashboard
const EXTRA_COLORS = ['#f472b6', '#facc15', '#34d399', '#fb7185', '#818cf8', '#2dd4bf']

const hubWidth = (name: string) => Math.round(name.length * 7.3 + 32)

export default function SkillConstellation({
  skills,
  projects,
  selectedSkill,
  onSelectSkill,
}: SkillConstellationProps) {
  const allSkills = skills && skills.length > 0 ? skills : SKILLS_DATA
  // Known domains first (fixed order), then any category added in the dashboard
  const domains = useMemo(() => {
    const present = new Set(allSkills.map((s) => normalizeDomain(s.domain)))
    return [
      ...SKILL_DOMAINS.filter((d) => present.has(d)),
      ...[...present].filter((d) => !SKILL_DOMAINS.includes(d)),
    ]
  }, [allSkills])
  const [activeDomain, setActiveDomain] = useState<SkillDomain | 'All'>('All')
  const [searchQuery, setSearchQuery] = useState('')
  const [hovered, setHovered] = useState<GNode | null>(null)

  // Static layout: computed only when data changes, never on hover
  const { nodes, edges } = useMemo(() => {
    const ns: GNode[] = []
    const es: GEdge[] = []

    const byDomain = (d: SkillDomain) => allSkills.filter((s) => normalizeDomain(s.domain) === d)
    const countFor = (list: SkillItem[]) => {
      const names = list.map((s) => s.name.toLowerCase())
      return projects.filter((p) => p.skills.some((s) => names.includes(s.toLowerCase()))).length
    }
    const skillCount = (name: string) =>
      projects.filter((p) => p.skills.some((s) => s.toLowerCase() === name.toLowerCase())).length

    // Centre hub + core languages
    const core = byDomain('Languages & Core')
    const coreColor = DOMAIN_COLOR['Languages & Core']
    ns.push({
      id: 'hub-core', name: 'Languages & Core', domain: 'Languages & Core', color: coreColor,
      x: CX, y: CY, r: 15, w: hubWidth('Languages & Core'), ox: 0, oy: 0, isHub: true, count: countFor(core),
    })
    core.forEach((s, i) => {
      const a =
        core.length === CORE_ANGLES.length
          ? CORE_ANGLES[i] * DEG
          : -Math.PI / 2 + ((i + 0.5) / core.length) * Math.PI * 2
      ns.push({
        id: s.id, name: s.name, domain: 'Languages & Core', color: s.color || coreColor,
        x: CX + Math.cos(a) * 150, y: CY + Math.sin(a) * 84, r: s.highlight ? 16 : 13, w: 0,
        ox: Math.cos(a), oy: Math.sin(a), isHub: false, count: skillCount(s.name),
      })
      es.push({ source: 'hub-core', target: s.id, color: coreColor })
    })

    // Satellite domain hubs: a pill with the domain name, technologies on an ellipse around it
    const sats = domains.filter((d) => d !== 'Languages & Core')
    sats.forEach((d, i) => {
      const a = -Math.PI / 2 + (i / sats.length) * Math.PI * 2
      const hx = CX + Math.cos(a) * 330
      const hy = CY + Math.sin(a) * 190
      const color = DOMAIN_COLOR[d] ?? EXTRA_COLORS[i % EXTRA_COLORS.length]
      const kids = byDomain(d)
      const hubId = `hub-${i}`
      const w = hubWidth(d)
      ns.push({
        id: hubId, name: d, domain: d, color, x: hx, y: hy, r: 15, w,
        ox: 0, oy: 0, isHub: true, count: countFor(kids),
      })
      es.push({ source: 'hub-core', target: hubId, color })
      const rx = w / 2 + 36
      const ry = 54
      kids.forEach((s, j) => {
        // start facing outward so the line coming from the centre falls in a gap
        const ka = a + (j / kids.length) * Math.PI * 2
        ns.push({
          id: s.id, name: s.name, domain: d, color: s.color || color,
          x: hx + Math.cos(ka) * rx, y: hy + Math.sin(ka) * ry, r: s.highlight ? 14 : 11, w: 0,
          ox: Math.cos(ka), oy: Math.sin(ka), isHub: false, count: skillCount(s.name),
        })
        es.push({ source: hubId, target: s.id, color })
      })
    })
    return { nodes: ns, edges: es }
  }, [allSkills, projects, domains])

  const nodeMap = useMemo(() => new Map(nodes.map((n) => [n.id, n])), [nodes])
  const q = searchQuery.trim().toLowerCase()

  const isDim = (n: GNode) => {
    const domainOk = activeDomain === 'All' || n.domain === activeDomain
    const searchOk = !q || n.name.toLowerCase().includes(q) || n.domain.toLowerCase().includes(q)
    return !(domainOk && searchOk)
  }

  const selectedProjects = useMemo(() => {
    if (!selectedSkill) return []
    return projects.filter((p) => p.skills.some((s) => s.toLowerCase() === selectedSkill.toLowerCase()))
  }, [projects, selectedSkill])

  // Esc clears the selection
  useEffect(() => {
    if (!selectedSkill) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onSelectSkill(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [selectedSkill, onSelectSkill])

  const toggle = (n: GNode) => {
    if (n.isHub) return
    const isSel = selectedSkill?.toLowerCase() === n.name.toLowerCase()
    onSelectSkill(isSel ? null : n.name)
  }

  // Which technology names are drawn: hovered, selected, or the ones in the chosen domain / search
  const showLabel = (n: GNode) => {
    if (n.isHub) return false
    if (hovered?.id === n.id) return true
    if (isDim(n)) return false
    if (ALWAYS_SHOW_LABELS) return true
    if (selectedSkill?.toLowerCase() === n.name.toLowerCase()) return true
    return activeDomain !== 'All' || Boolean(q)
  }

  return (
    <section id="skills" className="section-block" aria-labelledby="skills-heading">
      <div className="section-header">
        <div className="section-tag">
          <IconTerminal />
          <span>CONSTELLATION // CONNECTED SKILLS</span>
        </div>
        <h2 id="skills-heading" className="section-title">
          Interactive Skill Constellation
        </h2>
        <p className="section-desc">
          Core languages sit at the centre and branch into colourful domain hubs. Hover a bubble to see
          what it is, click it to highlight the projects that use it.
        </p>
      </div>

      <div className="constellation-controls">
        <div className="domain-tabs" role="tablist" aria-label="Skill domains">
          <button
            type="button" role="tab" aria-selected={activeDomain === 'All'}
            className={`domain-tab ${activeDomain === 'All' ? 'active' : ''}`}
            onClick={() => setActiveDomain('All')}
          >
            All {domains.length} Domains
          </button>
          {domains.map((domain) => (
            <button
              key={domain} type="button" role="tab" aria-selected={activeDomain === domain}
              className={`domain-tab ${activeDomain === domain ? 'active' : ''}`}
              onClick={() => setActiveDomain(domain)}
            >
              {domain}
            </button>
          ))}
        </div>

        <div className="skill-search-box">
          <IconSearch className="search-icon" />
          <input
            type="text" placeholder="Search technology..." value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="skill-search-input" aria-label="Filter skills by keyword"
          />
          {searchQuery && (
            <button type="button" className="clear-search-btn" onClick={() => setSearchQuery('')} aria-label="Clear search">
              <IconClose />
            </button>
          )}
        </div>
      </div>

      <div className="constellation-3d-wrapper">
        <div className="constellation-3d-hint" aria-hidden="true">
          <span>Hover for details</span>
          <span className="dot-sep">&bull;</span>
          <span>Click to filter projects</span>
          <span className="dot-sep">&bull;</span>
          <span>Esc to clear</span>
        </div>

        <svg
          viewBox="-80 -24 1100 580"
          className="constellation-3d-svg"
          role="group"
          aria-label="Skill constellation connecting programming languages, machine learning and AI domains"
        >
          {/* 1. lines */}
          <g>
            {edges.map((e) => {
              const s = nodeMap.get(e.source)
              const t = nodeMap.get(e.target)
              if (!s || !t) return null
              const hot = selectedSkill && t.name.toLowerCase() === selectedSkill.toLowerCase()
              const dim = isDim(s) || isDim(t)
              return (
                <line
                  key={`${e.source}-${e.target}`}
                  className={`sk-edge ${hot ? '' : 'flow'} ${dim ? 'dim' : ''}`}
                  x1={s.x} y1={s.y} x2={t.x} y2={t.y}
                  stroke={hot ? '#ffffff' : e.color}
                  strokeWidth={hot ? 2.5 : 1.2}
                  strokeOpacity={hot ? 0.95 : 0.5}
                  strokeDasharray={hot ? undefined : '4 3'}
                />
              )
            })}
          </g>

          {/* 2. bubbles and domain pills */}
          <g>
            {nodes.map((n) => {
              const isSel = !n.isHub && selectedSkill?.toLowerCase() === n.name.toLowerCase()
              return (
                <g
                  key={n.id}
                  transform={`translate(${n.x}, ${n.y})`}
                  className={`sk-node ${n.isHub ? 'sk-hub' : ''} ${isDim(n) ? 'dim' : ''}`}
                  role={n.isHub ? undefined : 'button'}
                  tabIndex={n.isHub ? undefined : 0}
                  aria-label={n.isHub ? undefined : `${n.name}, ${n.domain}`}
                  aria-pressed={n.isHub ? undefined : isSel}
                  onClick={() => toggle(n)}
                  onMouseEnter={() => setHovered(n)}
                  onMouseLeave={() => setHovered((h) => (h?.id === n.id ? null : h))}
                  onFocus={() => setHovered(n)}
                  onBlur={() => setHovered((h) => (h?.id === n.id ? null : h))}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      toggle(n)
                    }
                  }}
                >
                  {n.isHub ? (
                    <>
                      <g className="sk-body">
                        <rect
                          x={-n.w / 2} y={-15} width={n.w} height={30} rx={15}
                          fill="#121216" stroke={n.color} strokeWidth={2}
                          style={{ filter: `drop-shadow(0 0 7px ${n.color})` }}
                        />
                        <text
                          textAnchor="middle" dy={4} fill="#ffffff"
                          fontFamily="var(--font-mono)" fontSize={12} fontWeight={700}
                          style={{ pointerEvents: 'none' }}
                        >
                          {n.name}
                        </text>
                      </g>
                      <rect x={-n.w / 2 - 4} y={-19} width={n.w + 8} height={38} fill="transparent" />
                    </>
                  ) : (
                    <>
                      {isSel && (
                        <circle className="sk-halo" r={n.r + 12} fill="none" stroke={n.color} strokeWidth="2.5" />
                      )}
                      <g className="sk-body">
                        <circle
                          r={n.r}
                          fill="#181820"
                          stroke={isSel ? '#ffffff' : n.color}
                          strokeWidth={isSel ? 2.8 : 1.6}
                          style={{ filter: isSel ? `drop-shadow(0 0 7px ${n.color})` : undefined }}
                        />
                        <circle r={n.r * 0.4} fill={n.color} />
                      </g>
                      <circle className="sk-focus-ring" r={n.r + 5} />
                      {/* stable hit area: never moves or scales */}
                      <circle r={n.r + 8} fill="transparent" />
                    </>
                  )}
                </g>
              )
            })}
          </g>

          {/* 3. names, drawn last so nothing can cover them */}
          <g aria-hidden="true">
            {nodes.filter(showLabel).map((n) => {
              const isHover = hovered?.id === n.id
              const dist = n.r + 8
              const x = n.x + n.ox * dist
              const sideways = Math.abs(n.ox) > 0.35
              const anchor = sideways ? (n.ox > 0 ? 'start' : 'end') : 'middle'
              const y = n.y + n.oy * dist + (sideways ? 4 : n.oy < 0 ? -2 : 11)
              return (
                <text
                  key={`label-${n.id}`}
                  className="sk-label"
                  x={x} y={y} textAnchor={anchor}
                  fill={isHover ? n.color : '#f1f5f9'}
                  fontSize={isHover ? 12.5 : 11.5}
                  fontWeight={isHover ? 700 : 600}
                  stroke="#0a0a0c" strokeWidth={4} strokeLinejoin="round" paintOrder="stroke"
                >
                  {n.name}
                </text>
              )
            })}
          </g>
        </svg>

        {hovered && (
          <div
            className="constellation-tooltip"
            style={{ borderColor: hovered.color, boxShadow: `0 8px 24px rgba(0,0,0,.8), 0 0 16px ${hovered.color}40` }}
          >
            <div className="tooltip-head" style={{ color: hovered.color }}>{hovered.name}</div>
            <div className="tooltip-domain">{hovered.isHub ? 'Domain hub' : hovered.domain}</div>
            {hovered.count > 0 && (
              <div className="tooltip-projects">
                {hovered.isHub ? 'Touches' : 'Used in'} {hovered.count} {hovered.count === 1 ? 'project' : 'projects'}
              </div>
            )}
            {!hovered.isHub && <div className="tooltip-hint">Click to filter projects</div>}
          </div>
        )}
      </div>

      {selectedSkill && (
        <div className="skill-filter-banner" role="status" aria-live="polite">
          <div className="filter-info">
            <span className="filter-label">Active Technology Filter:</span>
            <span className="filter-tag">{selectedSkill}</span>
            <span className="filter-count">
              ({selectedProjects.length} {selectedProjects.length === 1 ? 'project' : 'projects'} found)
            </span>
          </div>
          <div className="filter-actions">
            <a href="#projects" className="filter-jump-btn">View Connected Projects &darr;</a>
            <button type="button" className="filter-clear-btn" onClick={() => onSelectSkill(null)} aria-label="Clear skill filter">
              <IconClose />
              <span>Clear Filter (Esc)</span>
            </button>
          </div>
        </div>
      )}
    </section>
  )
}