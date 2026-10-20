import {
  Package,
  PlusCircle,
  Trash2,
  CalendarDays,
} from "lucide-react";

import { getStatus, getDaysRemaining, formatDate } from "../utils/expiryUtils";

function Products({
  products,
  deleteProduct,
  search,
  setActivePage,
}) {
  const getDaysText = (expiryDate) => {
    const days = getDaysRemaining(expiryDate);
    if (days === null) return "Unknown";
    if (days < 0) return `${Math.abs(days)} ${Math.abs(days) === 1 ? "day" : "days"} ago`;
    if (days === 0) return "Today";
    if (days === 1) return "1 day";
    return `${days} days`;
  };

  const filteredProducts = products.filter((product) =>
    product.name
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  return (
    <div className="page-content products-page">

      {/* HEADER */}
      <div className="products-page-header">
        <div>
          <span className="dashboard-eyebrow">
            INVENTORY MANAGEMENT
          </span>

          <h1>All Products</h1>

          <p>
            Manage and track all products in your inventory.
          </p>
        </div>

        <button
          className="primary-btn"
          onClick={() => setActivePage("Add Product")}
        >
          <PlusCircle size={18} />
          Add Product
        </button>
      </div>


      {/* SUMMARY */}
      <div className="products-summary">
        <Package size={18} />

        <span>
          {products.length}{" "}
          {products.length === 1
            ? "product"
            : "products"}{" "}
          in your inventory
        </span>
      </div>


      {/* EMPTY STATE */}
      {filteredProducts.length === 0 ? (

        <div className="empty-state products-empty">

          <div className="empty-icon">
            <Package size={30} />
          </div>

          <h3>
            {products.length === 0
              ? "No products yet"
              : "No products found"}
          </h3>

          <p>
            {products.length === 0
              ? "Start building your inventory by adding your first product."
              : "Try searching for another product."}
          </p>

          {products.length === 0 && (
            <button
              className="primary-btn"
              onClick={() => setActivePage("Add Product")}
            >
              <PlusCircle size={18} />
              Add Your First Product
            </button>
          )}

        </div>

      ) : (

        <div className="products-table-card">

          {/* TABLE HEADERS */}
          <div className="products-table-header">
            <div>PRODUCT</div>
            <div>CATEGORY</div>
            <div>EXPIRY DATE</div>
            <div>DAYS LEFT</div>
            <div>STATUS</div>
            <div>ACTION</div>
          </div>


          {/* PRODUCTS */}
          {filteredProducts.map((product) => {

            const status = getStatus(product.expiryDate);

            const daysLeft = getDaysRemaining(product.expiryDate);

            let statusClass = "safe";
            if (status === "Expiring Soon") statusClass = "expiring-soon";
            if (status === "Expired") statusClass = "expired";
            if (status === "Unknown") statusClass = "unknown";

            return (
              <div
                className="products-table-row"
                key={product.id}
              >

                {/* PRODUCT */}
                <div className="table-product-name">

                  <div className="table-product-icon">
                    <Package size={18} />
                  </div>

                  <div className="product-info">
                    <strong>{product.name}</strong>

                    <small>
                      Qty: {product.quantity}
                    </small>
                    {product.expirySource === "estimated" && product.expiryDate && (
                      <span className="ai-estimate-label">AI ESTIMATE · UNVERIFIED</span>
                    )}
                  </div>

                </div>


                {/* CATEGORY */}
                <div className="table-category">
                  {product.category}
                </div>


                {/* EXPIRY DATE */}
                <div className="table-expiry-date">

                  <CalendarDays size={15} />

                  {formatDate(product.expiryDate)}

                </div>


                {/* DAYS LEFT */}
                <div
                  className={`table-days ${
                    daysLeft === null
                      ? "unknown-days"
                      : daysLeft < 0
                        ? "expired-days"
                        : daysLeft <= 7
                          ? "warning-days"
                          : "safe-days"
                  }`}
                >
                  {getDaysText(product.expiryDate)}
                </div>


                {/* STATUS */}
                <div>
                  <span className={`status ${statusClass}`}>
                    {status}
                  </span>
                </div>


                {/* DELETE */}
                <div>
                  <button
                    className="delete-btn"
                    onClick={() => deleteProduct(product.id)}
                    title="Delete Product"
                  >
                    <Trash2 size={17} />
                  </button>
                </div>

              </div>
            );
          })}

        </div>
      )}

      <aside className="expiry-disclaimer" role="note">
        <div>
          <strong>AI expiry disclaimer</strong>
          <p>AI-generated expiry dates are estimates, not verified expiry dates. Always check the product packaging for the actual expiry date. For medicines, follow the printed expiry date or consult a pharmacist.</p>
        </div>
      </aside>

    </div>
    
  );
}


export default Products;