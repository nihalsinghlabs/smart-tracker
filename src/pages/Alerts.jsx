import { BellRing } from "lucide-react";
import ProductTable from "../compenets/ProductTable";
import { getStatus } from "../utils/expiryUtils";

function Alerts({
  products,
  deleteProduct,
  setActivePage,
}) {
  const alertProducts = products.filter((product) => {
    const status = getStatus(product.expiryDate);

    return (
      status === "Expiring Soon" ||
      status === "Expired"
    );
  });

  return (
    <div className="page-content">
      <div className="page-title">
        <span className="small-label">ATTENTION REQUIRED</span>

        <h1>Expiry Alerts</h1>

        <p>
          Products that are expiring soon or have already expired.
        </p>
      </div>

      {alertProducts.length > 0 && (
        <div className="alert-summary">
          <BellRing size={20} />

          <span>
            You currently have {alertProducts.length} product
            {alertProducts.length !== 1 ? "s" : ""} requiring attention.
          </span>
        </div>
      )}

      <ProductTable
        products={alertProducts}
        deleteProduct={deleteProduct}
        setActivePage={setActivePage}
      />
    </div>
  );
}

export default Alerts;