
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


function App() {
  const [activePage, setActivePage] = useState("Dashboard");

  const [products, setProducts] = useState(() => {
    try {
      const savedProducts = localStorage.getItem("smartTrackerProducts");
      return savedProducts ? JSON.parse(savedProducts) : [];
    } catch (error) {
      console.error("Error loading products:", error);
      return [];
    }
  });

  const [search, setSearch] = useState("");

  // Save products to LocalStorage whenever they change
  useEffect(() => {
    localStorage.setItem(
      "smartTrackerProducts",
      JSON.stringify(products)
    );
  }, [products]);


  // Count products requiring attention
  const alertCount = products.filter((product) => {
    const status = getStatus(product.expiryDate);

    return status === "Expiring Soon" || status === "Expired";
  }).length;

  // Add a single product
  const addProduct = (product) => {
    setProducts((previousProducts) => [
      ...previousProducts,
      product,
    ]);
  };

  // Import multiple products from the receipt scanner
  const importProducts = (importedProducts) => {
    const productsWithIds = importedProducts.map((product) => ({
      ...product,
      id: crypto.randomUUID(),
    }));

    setProducts((previousProducts) => [
      ...previousProducts,
      ...productsWithIds,
    ]);

    setActivePage("Products");
  };

  // Delete a product
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
