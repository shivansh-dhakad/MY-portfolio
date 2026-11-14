import { useEffect, useState } from 'react'
import { client, run } from './api'
import CrudTable, { type Row } from './CrudTable'

export default function SkillsAdmin() {
  const [cats, setCats] = useState<Row[] | null>(null)
  const loadCats = async () => setCats(await run<Row[]>(client().from('skill_categories').select('*').order('sort_order')))
  useEffect(() => { void loadCats().catch(() => setCats([])) }, [])

  return (
    <>
      <h1 className="ad-h1">Skills</h1>
      <p className="ad-muted">Categories become the domains of the public skill constellation; skills become its bubbles. Link skills to projects from each project’s edit page.</p>
      <CrudTable
        title="Categories (domains)"
        table="skill_categories"
        fields={[{ key: 'name', label: 'Name', required: true }, { key: 'sort_order', label: 'Order', type: 'number' }]}
        defaults={{ name: '', sort_order: 1 }}
        label={(r) => r.name}
        addLabel="Add a category"
        onChange={() => void loadCats()}
      />
      {cats && (
        <CrudTable
          key={cats.map((c) => c.id + c.name).join('|')}
          title="Technologies"
          table="skills"
          note="Deleting a category keeps its skills but leaves them uncategorised."
          fields={[
            { key: 'name', label: 'Name', required: true },
            { key: 'category_id', label: 'Category', type: 'select', options: [{ value: '', label: '— none —' }, ...cats.map((c) => ({ value: c.id, label: c.name }))] },
            { key: 'sort_order', label: 'Order', type: 'number' },
          ]}
          defaults={{ name: '', category_id: '', sort_order: 1 }}
          label={(r) => r.name}
          addLabel="Add a technology"
        />
      )}
    </>
  )
}
