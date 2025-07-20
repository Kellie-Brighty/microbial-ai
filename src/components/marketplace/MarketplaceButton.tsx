import React from "react";
import { Link } from "react-router-dom";
import { FaStore } from "react-icons/fa";

interface MarketplaceButtonProps {
  className?: string;
}

const MarketplaceButton: React.FC<MarketplaceButtonProps> = ({
  className = "",
}) => {
  return (
    <Link
      to="/marketplace"
      className={`flex items-center space-x-2 bg-gradient-to-r from-mint to-purple text-white px-4 py-2 rounded-md hover:opacity-90 transition-all ${className}`}
    >
      <FaStore />
      <span>Marketplace</span>
    </Link>
  );
};

export default MarketplaceButton;
