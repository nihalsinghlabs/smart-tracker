
import { useEffect, useState } from "react";

import Sidebar from "./compenets/Sidebar";
import Topbar from "./compenets/Topbar";
import Settings from "./pages/Settings";
import Dashboard from "./pages/Dashboard";
import AddProduct from "./pages/AddProduct";
import Products from "./pages/Products";
import Alerts from "./pages/Alerts";
import ReceiptScanner from "./pages/ReceiptScanner";

import { getStatus } from "./utils/expiryUtils";
import "./App.css";
import "./styles/theme.css";


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
    const [theme, setTheme] = useState(
    () => localStorage.getItem("smartTrackerTheme") || "light"
  );

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("smartTrackerTheme", theme);
  }, [theme]);

  const toggleTheme = () =>
    setTheme((current) => (current === "light" ? "dark" : "light"));

  // Feed pointer position into CSS variables for the 3D background parallax.
  useEffect(() => {
    const onMove = (event) => {
      const root = document.documentElement;
      root.style.setProperty("--px", (event.clientX / window.innerWidth - 0.5).toFixed(3));
      root.style.setProperty("--py", (event.clientY / window.innerHeight - 0.5).toFixed(3));
    };
    window.addEventListener("pointermove", onMove);
    return () => window.removeEventListener("pointermove", onMove);
  }, []);

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
      case "Settings":
        return (
          <Settings
            theme={theme}
            toggleTheme={toggleTheme}
            products={products}
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
      <div className="scene" aria-hidden="true">
        <div className="orb orb-a" />
        <div className="orb orb-b" />
        <div className="orb orb-c" />
        <div className="glass-sphere" />
        <div className="grid-floor" />
      </div>

      <Sidebar
        activePage={activePage}
        setActivePage={setActivePage}
        alertCount={alertCount}
      />

      <div className="main-content">
                <Topbar
          search={search}
          setSearch={setSearch}
          setActivePage={setActivePage}
          alertCount={alertCount}
          theme={theme}
          toggleTheme={toggleTheme}
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
