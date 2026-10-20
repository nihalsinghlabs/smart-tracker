
import { useEffect, useState } from "react";

import Sidebar from "./compenets/Sidebar";
import Topbar from "./compenets/Topbar";

import Dashboard from "./pages/Dashboard";
import AddProduct from "./pages/AddProduct";
import Products from "./pages/Products";
import Alerts from "./pages/Alerts";
import ReceiptScanner from "./pages/ReceiptScanner";

import { getStatus } from "./utils/expiryUtils";
import "./App.css";

const STORAGE_KEY = "smartTrackerProducts";

function normalizeProduct(product) {
  const hasExpiryDate =
    typeof product.expiryDate === "string" &&
    product.expiryDate.trim() !== "";

  const validSources = ["verified", "estimated", "unknown"];

  // Preserve known source information. Do not assume an old date
  // was verified when its original source was never recorded.
  const expirySource = validSources.includes(product.expirySource)
    ? product.expirySource
    : "unknown";

  return {
    ...product,
    expiryDate: hasExpiryDate ? product.expiryDate : "",
    expirySource,
    expiryEvidence:
      typeof product.expiryEvidence === "string"
        ? product.expiryEvidence
        : hasExpiryDate
          ? "Previously saved expiry date; original source was not recorded."
          : "No expiry date has been confirmed.",
  };
}

function loadProducts() {
  try {
    const savedProducts = localStorage.getItem(STORAGE_KEY);

    if (!savedProducts) return [];

    const parsedProducts = JSON.parse(savedProducts);

    if (!Array.isArray(parsedProducts)) return [];

    return parsedProducts.map(normalizeProduct);
  } catch (error) {
    console.error("Error loading products:", error);
    return [];
  }
}

function App() {
  const [activePage, setActivePage] = useState("Dashboard");
  const [products, setProducts] = useState(loadProducts);
  const [search, setSearch] = useState("");

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
    } catch (error) {
      console.error("Error saving products:", error);
    }
  }, [products]);

  const alertCount = products.filter((product) => {
    const status = getStatus(product.expiryDate);
    return status === "Expiring Soon" || status === "Expired";
  }).length;

  const addProduct = (product) => {
    setProducts((previousProducts) => [
      ...previousProducts,
      normalizeProduct(product),
    ]);
  };

  const importProducts = (importedProducts) => {
    const productsWithIds = importedProducts.map((product) =>
      normalizeProduct({
        ...product,
        id: crypto.randomUUID(),
      })
    );

    setProducts((previousProducts) => [
      ...previousProducts,
      ...productsWithIds,
    ]);

    setActivePage("Products");
  };

  const deleteProduct = (id) => {
    setProducts((previousProducts) =>
      previousProducts.filter((product) => product.id !== id)
    );
  };

  const renderPage = () => {
    switch (activePage) {
      case "Add Product":
        return (
          <AddProduct
            addProduct={addProduct}
            setActivePage={setActivePage}
          />
        );

      case "Products":
        return (
          <Products
            products={products}
            deleteProduct={deleteProduct}
            search={search}
            setActivePage={setActivePage}
          />
        );

      case "Alerts":
        return (
          <Alerts
            products={products}
            deleteProduct={deleteProduct}
            setActivePage={setActivePage}
          />
        );

      case "Receipt Scanner":
        return (
          <ReceiptScanner
            onImport={importProducts}
            setActivePage={setActivePage}
          />
        );

      case "Dashboard":
      default:
        return (
          <Dashboard
            products={products}
            deleteProduct={deleteProduct}
            setActivePage={setActivePage}
          />
        );
    }
  };

  return (
    <div className="app-container">
      <Sidebar
        activePage={activePage}
        setActivePage={setActivePage}
        alertCount={alertCount}
      />

      <div className="main-content">
        <Topbar
          search={search}
          setSearch={setSearch}
          alertCount={alertCount}
        />

        <main className="content-area">
          <div key={activePage} className="page-transition">
            {renderPage()}
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;
