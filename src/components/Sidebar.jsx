import { categories } from '../data/categories'

export default function Sidebar({ activeCategory, onSelectCategory }) {
  return (
    <aside className="sidebar">
      <h3 className="sidebar-title">Каталог</h3>
      <ul className="sidebar-list">
        {categories.map((cat) => (
          <li key={cat.id}>
            <button
              type="button"
              className={`sidebar-item ${activeCategory === cat.id ? 'active' : ''}`}
              onClick={() => onSelectCategory(cat.id)}
            >
              {cat.name}
            </button>
          </li>
        ))}
      </ul>
    </aside>
  )
}
