import { useEffect, useRef, useState } from 'react'
import { client, errMsg, run } from './api'
import CrudTable, { type Row } from './CrudTable'
import { Notice, useTask } from './ui'

interface SkillDraft {
  key: string
  id: string | null
  name: string
  categoryId: string
  sortOrder: number
  deleted: boolean
}

function toDraft(row: Row): SkillDraft {
  return {
    key: row.id,
    id: row.id,
    name: row.name,
    categoryId: row.category_id ?? '',
    sortOrder: Number(row.sort_order) || 0,
    deleted: false,
  }
}

function SkillsEditor({ domains }: { domains: Row[] }) {
  const [skills, setSkills] = useState<SkillDraft[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [dirty, setDirty] = useState(false)
  const nextId = useRef(0)
  const { busy, notice, task } = useTask()
  const domainKey = domains.map((domain) => String(domain.id)).sort().join('|')

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setLoadError('')
    run<Row[]>(client().from('skills').select('*').order('sort_order'))
      .then((rows) => {
        if (cancelled) return
        setSkills(rows.map(toDraft))
        setDirty(false)
      })
      .catch((error: unknown) => {
        if (!cancelled) setLoadError(errMsg(error))
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [domainKey])

  const update = (key: string, patch: Partial<SkillDraft>) => {
    setSkills((current) => current.map((skill) => (skill.key === key ? { ...skill, ...patch } : skill)))
    setDirty(true)
  }

  const addSkill = (categoryId: string) => {
    const sortOrder =
      skills.reduce((max, skill) => (skill.categoryId === categoryId && !skill.deleted ? Math.max(max, skill.sortOrder) : max), 0) + 1
    const key = `new-${++nextId.current}`
    setSkills((current) => [...current, { key, id: null, name: '', categoryId, sortOrder, deleted: false }])
    setDirty(true)
  }

  const renderSkill = (skill: SkillDraft, showDomain: boolean) => (
    <div key={skill.key} className={`ad-skill-row ${showDomain ? 'unassigned' : ''}`} style={skill.deleted ? { opacity: 0.5 } : undefined}>
      {showDomain && (
        <select
          className="ad-input"
          aria-label={`Domain for ${skill.name || 'new skill'}`}
          value={skill.categoryId}
          disabled={skill.deleted}
          onChange={(event) => update(skill.key, { categoryId: event.target.value })}
        >
          <option value="">Select a domain</option>
          {domains.map((domain) => <option key={domain.id} value={domain.id}>{domain.name}</option>)}
        </select>
      )}
      <input
        className="ad-input"
        aria-label={`Skill name${skill.name ? `: ${skill.name}` : ''}`}
        placeholder="Skill name"
        value={skill.name}
        disabled={skill.deleted}
        onChange={(event) => update(skill.key, { name: event.target.value })}
      />
      <input
        className="ad-input"
        aria-label={`Order for ${skill.name || 'new skill'}`}
        type="number"
        value={skill.sortOrder}
        disabled={skill.deleted}
        onChange={(event) => update(skill.key, { sortOrder: Number(event.target.value) || 0 })}
      />
      <button
        type="button"
        className={`ad-btn ${skill.deleted ? '' : 'danger'}`}
        disabled={busy}
        onClick={() => update(skill.key, { deleted: !skill.deleted })}
      >
        {skill.deleted ? 'Undo' : 'Remove'}
      </button>
    </div>
  )

  const save = () =>
    void task(async () => {
      const active = skills.filter((skill) => !skill.deleted)
      if (active.some((skill) => !skill.name.trim())) {
        throw new Error('Enter a name for each skill, or remove empty skill rows.')
      }

      const removedIds = skills.filter((skill) => skill.deleted && skill.id).map((skill) => skill.id as string)
      if (removedIds.length > 0) {
        await run(client().from('skills').delete().in('id', removedIds))
      }

      const values = (skill: SkillDraft) => ({
        name: skill.name.trim(),
        category_id: skill.categoryId || null,
        sort_order: skill.sortOrder,
      })
      const existing = active.filter((skill): skill is SkillDraft & { id: string } => skill.id !== null)
      const newSkills = active.filter((skill) => skill.id === null)
      if (existing.length > 0) {
        await run(client().from('skills').upsert(
          existing.map((skill) => ({ id: skill.id, ...values(skill) })),
          { onConflict: 'id' },
        ))
      }
      if (newSkills.length > 0) {
        await run(client().from('skills').insert(newSkills.map(values)))
      }

      const saved = await run<Row[]>(client().from('skills').select('*').order('sort_order'))
      setSkills(saved.map(toDraft))
      setDirty(false)
      return 'All skills saved.'
    })

  const domainIds = new Set(domains.map((domain) => String(domain.id)))
  const unassigned = skills.filter((skill) => !skill.deleted && !domainIds.has(skill.categoryId))

  return (
    <section className="ad-section">
      <h2 className="ad-h2">Skills by domain</h2>
      <p className="ad-muted">Add, edit, reorder, or remove skills, then save all changes with one button.</p>
      {loading && <p className="ad-muted">Loading skills…</p>}
      {loadError && <p className="ad-notice err" role="alert">Could not load skills: {loadError}</p>}
      {!loading && !loadError && unassigned.length > 0 && (
        <section className="ad-section">
          <h3 className="ad-h2">Unassigned skills</h3>
          <p className="ad-muted">Choose a domain for each skill to include it in the constellation.</p>
          {unassigned.map((skill) => renderSkill(skill, true))}
        </section>
      )}
      {!loading && !loadError && domains.map((domain) => {
        const group = skills.filter((skill) => skill.categoryId === domain.id)
        return (
          <section key={domain.id} className="ad-section">
            <h3 className="ad-h2">{domain.name}</h3>
            {group.length === 0 && <p className="ad-muted">No skills in this domain yet.</p>}
            {group.map((skill) => renderSkill(skill, false))}
            <button type="button" className="ad-btn" disabled={busy} onClick={() => addSkill(String(domain.id))}>
              + Add skill
            </button>
          </section>
        )
      })}
      <div className="ad-savebar">
        <button type="button" className="ad-btn primary" disabled={!dirty || busy || loading || Boolean(loadError)} onClick={save}>
          {busy ? 'Saving…' : 'Save all skills'}
        </button>
        {dirty && <span className="ad-muted">Unsaved changes</span>}
        <Notice n={notice} />
      </div>
    </section>
  )
}

export default function SkillsAdmin() {
  const [cats, setCats] = useState<Row[] | null>(null)
  const loadCats = async () => setCats(await run<Row[]>(client().from('skill_categories').select('*').order('sort_order')))
  useEffect(() => { void loadCats().catch(() => setCats([])) }, [])

  return (
    <>
      <h1 className="ad-h1">Skills</h1>
      <p className="ad-muted">Create domains, then add and manage each domain’s skills below it. Link skills to projects from each project’s edit page.</p>
      <CrudTable
        title="Domains"
        table="skill_categories"
        note="Deleting a domain permanently deletes its skills and their project links."
        fields={[{ key: 'name', label: 'Name', required: true }, { key: 'sort_order', label: 'Order', type: 'number' }]}
        defaults={{ name: '', sort_order: 1 }}
        label={(row) => row.name}
        addLabel="Add a domain"
        deleteWarning="All skills in this domain and their project links will also be permanently deleted."
        onChange={() => void loadCats()}
      />
      {cats === null && <p className="ad-muted">Loading domains…</p>}
      {cats && <SkillsEditor key={cats.map((category) => category.id).sort().join('|')} domains={cats} />}
    </>
  )
}
