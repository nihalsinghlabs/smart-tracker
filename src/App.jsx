import { useEffect, useState } from "react";

import Sidebar from "./compenets/Sidebar";
import Topbar from "./compenets/Topbar";

import Dashboard from "./pages/Dashboard";
import AddProduct from "./pages/AddProduct";
import Products from "./pages/Products";
import Alerts from "./pages/Alerts";

import { getStatus } from "./utils/expiryUtils";

import "./App.css";

function App() {
  const [activePage, setActivePage] = useState("Dashboard");
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");

  // Load products from LocalStorage
  useEffect(() => {
    const savedProducts = localStorage.getItem("smartTrackerProducts");

    if (savedProducts) {
      try {
        setProducts(JSON.parse(savedProducts));
      } catch (error) {
        console.error("Error loading products:", error);
      }
    }
  }, []);

  // Save products to LocalStorage
  useEffect(() => {
    localStorage.setItem(
      "smartTrackerProducts",
      JSON.stringify(products)
    );
  }, [products]);

  // Count products requiring attention
  const alertCount = products.filter((product) => {
    const status = getStatus(product.expiryDate);

    return (
      status === "Expiring Soon" ||
      status === "Expired"
    );
  }).length;

  // Add product
  const addProduct = (product) => {
    setProducts((previousProducts) => [
      ...previousProducts,
      product,
    ]);
  };

  // Delete product
  const deleteProduct = (id) => {
    setProducts((previousProducts) =>
      previousProducts.filter(
        (product) => product.id !== id
      )
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
          <div
            key={activePage}
            className="page-transition"
          >
            {renderPage()}
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;