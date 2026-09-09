import {
  Package,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  PlusCircle,
  ArrowRight,
} from "lucide-react";

import StatCard from "../compenets/StatCard";
import ProductTable from "../compenets/ProductTable";

import { getStatus } from "../utils/expiryUtils";

function Dashboard({
  products,
  deleteProduct,
  setActivePage,
}) {
  const totalProducts = products.length;

  const safeProducts = products.filter(
    (product) =>
      getStatus(product.expiryDate) === "Safe"
  ).length;

  const expiringProducts = products.filter(
    (product) =>
      getStatus(product.expiryDate) === "Expiring Soon"
  ).length;

  const expiredProducts = products.filter(
    (product) =>
      getStatus(product.expiryDate) === "Expired"
  ).length;

  const recentProducts = [...products]
    .slice(-5)
    .reverse();

  return (
    <div className="page-content">

      {/* Welcome Section */}

      <section className="dashboard-header">
        <div>
          <span className="dashboard-eyebrow">
            SMART INVENTORY MANAGEMENT
          </span>

          <h1>
            Good to see you again.
          </h1>

          <p>
            Here's a quick overview of your inventory
            and product expiry status.
          </p>
        </div>

        <button
          className="primary-btn"
          onClick={() =>
            setActivePage("Add Product")
          }
        >
          <PlusCircle size={18} />
          Add Product
        </button>
      </section>


      {/* Statistics */}

      <section className="stats-grid">

        <StatCard
          icon={<Package size={21} />}
          label="TOTAL PRODUCTS"
          value={totalProducts}
          description="Products in inventory"
          type="blue"
        />

        <StatCard
          icon={<CheckCircle2 size={21} />}
          label="SAFE PRODUCTS"
          value={safeProducts}
          description="Fresh and safe to use"
          type="green"
        />

        <StatCard
          icon={<AlertTriangle size={21} />}
          label="EXPIRING SOON"
          value={expiringProducts}
          description="Expiring within 7 days"
          type="yellow"
        />

        <StatCard
          icon={<XCircle size={21} />}
          label="EXPIRED"
          value={expiredProducts}
          description="Requires attention"
          type="red"
        />

      </section>


      {/* Recent Products */}

      <section className="recent-section">

        <div className="section-header">
          <div>
            <h2>Recent Inventory</h2>

            <p>
              Your most recently added products.
            </p>
          </div>

          {products.length > 0 && (
            <button
              className="text-btn"
              onClick={() =>
                setActivePage("Products")
              }
            >
              View All
              <ArrowRight size={16} />
            </button>
          )}
        </div>

        <ProductTable
          products={recentProducts}
          deleteProduct={deleteProduct}
          setActivePage={setActivePage}
        />

      </section>

    </div>
  );
}

export default Dashboard;