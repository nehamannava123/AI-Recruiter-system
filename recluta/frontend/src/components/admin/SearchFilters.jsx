export default function SearchFilters({ filters, onChange, onClear }) {
  return (
    <div className="grid gap-4 lg:grid-cols-5">
      <input className="input-field" placeholder="Search by candidate name" value={filters.searchName} onChange={(event) => onChange('searchName', event.target.value)} />
      <input className="input-field" placeholder="Search by email" value={filters.searchEmail} onChange={(event) => onChange('searchEmail', event.target.value)} />
      <input className="input-field" placeholder="Search by role" value={filters.searchRole} onChange={(event) => onChange('searchRole', event.target.value)} />
      <input className="input-field" type="date" value={filters.date} onChange={(event) => onChange('date', event.target.value)} />
      <select className="input-field" value={filters.status} onChange={(event) => onChange('status', event.target.value)}>
        <option value="">All statuses</option>
        <option value="completed">Completed</option>
        <option value="pending">Pending</option>
      </select>
      <button className="btn-secondary col-span-full lg:col-span-1 lg:col-start-5" type="button" onClick={onClear}>Clear filters</button>
    </div>
  );
}
