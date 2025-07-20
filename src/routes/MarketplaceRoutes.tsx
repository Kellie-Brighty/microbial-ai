import React from "react";
import { Route, Routes } from "react-router-dom";
import MarketplacePage from "../pages/marketplace/MarketplacePage";
import ProductListingPage from "../pages/marketplace/ProductListingPage";
import ServiceListingPage from "../pages/marketplace/ServiceListingPage";
import ProductDetailPage from "../pages/marketplace/ProductDetailPage";
import CartPage from "../pages/marketplace/CartPage";
// import { useAuth } from "../context/AuthContext";

const MarketplaceRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<MarketplacePage />} />
      <Route path="/products" element={<ProductListingPage />} />
      <Route path="/services" element={<ServiceListingPage />} />
      <Route path="/product/:productId" element={<ProductDetailPage />} />
      <Route path="/cart" element={<CartPage />} />
    </Routes>
  );
};

export default MarketplaceRoutes;
