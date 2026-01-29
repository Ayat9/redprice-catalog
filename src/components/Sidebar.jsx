import { useSuppliers } from '../context/SuppliersContext'

export default function Sidebar({ activeSupplier, onSelectSupplier, supplierCategories, activeCategoryId, onSelectCategory }) {
  const { suppliers } = useSuppliers()
  return (
    <aside className="sidebar">
      <section className="sidebar-section">
        <h3 className="sidebar-title">Поставщики</h3>
        <ul className="sidebar-list">
          {suppliers.map((s) => (
            <li key={s.id}>
              <button
                type="button"
                className={`sidebar-item ${activeSupplier === s.id ? 'active' : ''}`}
                onClick={() => onSelectSupplier(s.id)}
              >
                {s.name}
              </button>
            </li>
          ))}
        </ul>
      </section>
      {activeSupplier && (
        <section className="sidebar-section sidebar-section-categories">
          <h3 className="sidebar-title">Категории поставщика</h3>
          <ul className="sidebar-list">
            <li>
              <button
                type="button"
                className={`sidebar-item sidebar-item-category ${activeCategoryId === null || activeCategoryId === '' ? 'active' : ''}`}
                onClick={() => onSelectCategory(null)}
              >
                Все категории
              </button>
            </li>
            {supplierCategories.map((c) => (
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
      )}
    </aside>
  )
}
