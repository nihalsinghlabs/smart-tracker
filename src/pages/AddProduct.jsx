import { useState } from "react";
import {
  Package,
  Calendar,
  ShoppingBasket,
  Pill,
  PlusCircle,
  CheckCircle2,
} from "lucide-react";

function AddProduct({ addProduct, setActivePage }) {
  const [productName, setProductName] = useState("");
  const [category, setCategory] = useState("Grocery");
  const [expiryDate, setExpiryDate] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = (event) => {
    event.preventDefault();

    // Validation
    if (!productName.trim()) {
      setError("Please enter a product name.");
      return;
    }

    if (!expiryDate) {
      setError("Please select an expiry date.");
      return;
    }

    const newProduct = {
      id: Date.now(),
      name: productName.trim(),
      category,
      expiryDate,
      quantity: Number(quantity),
      createdAt: new Date().toISOString(),
    };

    addProduct(newProduct);

    // Reset form
    setProductName("");
    setCategory("Grocery");
    setExpiryDate("");
    setQuantity(1);
    setError("");
    setSuccess(true);

    // Go to products page after success
    setTimeout(() => {
      setActivePage("Products");
    }, 1000);
  };

  return (
    <div className="page-content">
      <div className="page-title">
        <span className="dashboard-eyebrow">
          INVENTORY MANAGEMENT
        </span>

        <h1>Add New Product</h1>

        <p>
          Add a product to your inventory and we'll help you
          keep track of its expiry date.
        </p>
      </div>

      <div className="form-layout">

        {/* FORM CARD */}

        <form
          className="form-card"
          onSubmit={handleSubmit}
        >
          <div className="form-heading">
            <Package size={22} />

            <div>
              <h2>Product Details</h2>
              <p>
                Enter the information about your product.
              </p>
            </div>
          </div>


          {/* PRODUCT NAME */}

          <div className="input-group">
            <label>Product Name</label>

            <input
              type="text"
              placeholder="Example: Fresh Milk"
              value={productName}
              onChange={(event) => {
                setProductName(event.target.value);
                setError("");
              }}
            />
          </div>


          {/* CATEGORY */}

          <div className="input-group">
            <label>Category</label>

            <div className="category-options">

              <button
                type="button"
                className={`category-option ${
                  category === "Grocery"
                    ? "selected"
                    : ""
                }`}
                onClick={() =>
                  setCategory("Grocery")
                }
              >
                <ShoppingBasket size={18} />
                Grocery
              </button>

              <button
                type="button"
                className={`category-option ${
                  category === "Medicine"
                    ? "selected"
                    : ""
                }`}
                onClick={() =>
                  setCategory("Medicine")
                }
              >
                <Pill size={18} />
                Medicine
              </button>

            </div>
          </div>


          {/* EXPIRY DATE */}

          <div className="input-group">
            <label>Expiry Date</label>

            <div className="input-with-icon">
              <Calendar size={18} />

              <input
                type="date"
                value={expiryDate}
                onChange={(event) => {
                  setExpiryDate(event.target.value);
                  setError("");
                }}
              />
            </div>
          </div>


          {/* QUANTITY */}

          <div className="input-group">
            <label>Quantity</label>

            <input
              type="number"
              min="1"
              value={quantity}
              onChange={(event) =>
                setQuantity(event.target.value)
              }
            />
          </div>


          {/* ERROR */}

          {error && (
            <div className="form-error">
              {error}
            </div>
          )}


          {/* SUCCESS */}

          {success && (
            <div className="form-success">
              <CheckCircle2 size={18} />
              Product added successfully!
            </div>
          )}


          {/* BUTTON */}

          <button
            type="submit"
            className="primary-btn submit-btn"
          >
            <PlusCircle size={18} />
            Add Product
          </button>

        </form>


        {/* RIGHT INFO PANEL */}

        <div className="info-panel">

          <div className="info-icon">
            <Package size={25} />
          </div>

          <h3>Smart Expiry Tracking</h3>

          <p>
            SmartTracker automatically monitors your
            product expiry dates and categorizes products
            as safe, expiring soon, or expired.
          </p>

          <div className="info-features">

            <div>
              <CheckCircle2 size={16} />
              Automatic expiry detection
            </div>

            <div>
              <CheckCircle2 size={16} />
              Product status tracking
            </div>

            <div>
              <CheckCircle2 size={16} />
              Expiry alerts and reminders
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}

export default AddProduct;