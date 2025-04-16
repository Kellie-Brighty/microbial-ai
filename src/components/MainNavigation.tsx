import React from "react";

import Header from "./Header";

const MainNavigation: React.FC = () => {
  // Don't render the navigation on the chat page
  if (location.pathname === "/chat") {
    return null;
  }

  return <Header onAuthModalOpen={() => {}} />;
};

export default MainNavigation;
