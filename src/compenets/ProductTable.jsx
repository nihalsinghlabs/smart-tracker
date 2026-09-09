import {
  Apple,
  Pill,
  CalendarDays,
  Trash2,
} from "lucide-react";

import {
  getDaysRemaining,
  getStatus,
  formatDate,
} from "../utils/expiryUtils";

import EmptyState from "./EmptyState";

function ProductTable({
  products,
  deleteProduct,
  setActivePage,
}) {
  if (products.length === 0) {
    return (
      <EmptyState
        setActivePage={setActivePage}
      />
    );
  }

  return (
    <div className="products-card">
      <div className="table-header">
        <span>PRODUCT</span>
        <span>CATEGORY</span>
        <span>EXPIRY DATE</span>
        <span>DAYS LEFT</span>
        <span>STATUS</span>
        <span>ACTION</span>
      </div>

      {products.map((product) => {
        const days = getDaysRemaining(product.expiryDate);
        const status = getStatus(product.expiryDate);

        return (
          <div className="product-row" key={product.id}>

            <div className="product-name">
              <div className="product-icon">
                {product.category === "Medicine" ? (
                  <Pill size={18} />
                ) : (
                  <Apple size={18} />
                )}
              </div>

              <strong>{product.name}</strong>
            </div>

            <span className="category">
              {product.category}
            </span>

            <span className="expiry-date">
              <CalendarDays size={15} />
              {formatDate(product.expiryDate)}
            </span>

            <span
              className={`days ${
                days < 0
                  ? "expired-days"
                  : days <= 7
                  ? "warning-days"
                  : "safe-days"
              }`}
            >
              {days < 0
                ? `${Math.abs(days)} days ago`
                : days === 0
                ? "Today"
                : `${days} days`}
            </span>

            <span
              className={`status ${status
                .toLowerCase()
                .replace(" ", "-")}`}
            >
              {status}
            </span>

            <button
              className="delete-btn"
              onClick={() => deleteProduct(product.id)}
            >
              <Trash2 size={17} />
            </button>

          </div>
        );
      })}
    </div>
  );
}

export default ProductTable;