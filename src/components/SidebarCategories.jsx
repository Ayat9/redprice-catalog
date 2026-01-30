export default function SidebarCategories({ categories, activeCategoryId, onSelectCategory }) {
  return (
    <aside className="sidebar">
      <section className="sidebar-section">
        <h3 className="sidebar-title">Категории</h3>
        <ul className="sidebar-list">
          <li>
            <button
              type="button"
              className={`sidebar-item ${activeCategoryId === null || activeCategoryId === '' ? 'active' : ''}`}
              onClick={() => onSelectCategory(null)}
            >
              Все категории
            </button>
          </li>
          {categories.map((c) => (
            <li key={c.id}>
              <button
                type="button"
                className={`sidebar-item sidebar-item-category ${activeCategoryId === c.id ? 'active' : ''}`}
                onClick={() => onSelectCategory(c.id)}
              >
                {c.name}
              </button>
            </li>
          ))}
        </ul>
      </section>
    </aside>
  )
}
