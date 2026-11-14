export default function StateNotice({ kind }: { kind: 'loading' | 'error' }) {
  return (
    <p className={`notice notice-${kind}`} role="status">
      {kind === 'loading' ? 'Loading the latest content…' : 'Couldn’t reach the database. Showing the saved version.'}
    </p>
  )
}
