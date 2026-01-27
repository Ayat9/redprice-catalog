import { Link } from 'react-router-dom'
import './SupplierCard.css'

function SupplierCard({ supplier }) {
  return (
    <Link to={`/supplier/${supplier.id}`} className="supplier-card">
      <div className="supplier-card-image">
        {supplier.logo ? (
          <img src={supplier.logo} alt={supplier.name} />
        ) : (
          <div className="supplier-card-placeholder">
            {supplier.name.charAt(0).toUpperCase()}
          </div>
        )}
      </div>
      <div className="supplier-card-content">
        <h3 className="supplier-card-name">{supplier.name}</h3>
        <p className="supplier-card-address">{supplier.address}</p>
        <p className="supplier-card-products">
          Товаров: {supplier.products?.length || 0}
        </p>
      </div>
    </Link>
  )
}

export default SupplierCard
