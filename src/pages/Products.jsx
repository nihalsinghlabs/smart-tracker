import {
  Package,
  PlusCircle,
  Trash2,
  CalendarDays,
} from "lucide-react";

import { getStatus } from "../utils/expiryUtils";

function Products({
  products,
  deleteProduct,
  search,
  setActivePage,
}) {

  // Calculate days remaining
  const getDaysLeft = (expiryDate) => {
    const today = new Date();
    const expiry = new Date(expiryDate);

    today.setHours(0, 0, 0, 0);
    expiry.setHours(0, 0, 0, 0);

    const difference = expiry - today;

    return Math.ceil(
      difference / (1000 * 60 * 60 * 24)
    );
  };


  // Convert days into readable text
  const getDaysText = (expiryDate) => {
    const days = getDaysLeft(expiryDate);

    if (days < 0) {
      return `${Math.abs(days)} days ago`;
    }

    if (days === 0) {
      return "Today";
    }

    if (days === 1) {
      return "1 day";
    }

    return `${days} days`;
  };


  // Filter products using search
  const filteredProducts = products.filter((product) =>
    product.name
      .toLowerCase()
      .includes(search.toLowerCase())
  );


  return (
    <div className="page-content">

      {/* PAGE HEADER */}

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


      {/* PRODUCT COUNT */}

      <div className="products-summary">

        <Package size={19} />

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
            <Package size={28} />
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
              onClick={() =>
                setActivePage("Add Product")
              }
            >
              <PlusCircle size={18} />
              Add Your First Product
            </button>

          )}

        </div>

      ) : (

        /* PRODUCTS TABLE */

        <div className="products-table-card">

          {/* TABLE HEADER */}

          <div className="products-table-header">

            <span>PRODUCT</span>
            <span>CATEGORY</span>
            <span>EXPIRY DATE</span>
            <span>DAYS LEFT</span>
            <span>STATUS</span>
            <span>ACTION</span>

          </div>


          {/* TABLE ROWS */}

          {filteredProducts.map((product) => {

            const status = getStatus(
              product.expiryDate
            );

            const daysLeft = getDaysLeft(
              product.expiryDate
            );

            let statusClass = "";

            if (status === "Safe") {
              statusClass = "safe";
            } else if (
              status === "Expiring Soon"
            ) {
              statusClass = "expiring-soon";
            } else {
              statusClass = "expired";
            }


            return (

              <div
                className="products-table-row"
                key={product.id}
              >

                {/* PRODUCT NAME */}

                <div className="table-product-name">

                  <div className="table-product-icon">
                    <Package size={18} />
                  </div>

                  <div>

                    <strong>
                      {product.name}
                    </strong>

                    <small>
                      Qty: {product.quantity}
                    </small>

                  </div>

                </div>


                {/* CATEGORY */}

                <span className="table-category">
                  {product.category}
                </span>


                {/* EXPIRY DATE */}

                <span className="table-expiry-date">

                  <CalendarDays size={15} />

                  {new Date(
                    product.expiryDate
                  ).toLocaleDateString(
                    "en-US",
                    {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    }
                  )}

                </span>


                {/* DAYS LEFT */}

                <span
                  className={`table-days ${
                    daysLeft < 0
                      ? "expired-days"
                      : daysLeft <= 7
                      ? "warning-days"
                      : "safe-days"
                  }`}
                >
                  {getDaysText(
                    product.expiryDate
                  )}
                </span>


                {/* STATUS */}

                <span
                  className={`status ${statusClass}`}
                >
                  {status}
                </span>


                {/* DELETE */}

                <button
                  className="delete-btn"
                  onClick={() =>
                    deleteProduct(product.id)
                  }
                  title="Delete Product"
                >
                  <Trash2 size={17} />
                </button>

              </div>

            );

          })}

        </div>

      )}

    </div>
  );
}

export default Products;