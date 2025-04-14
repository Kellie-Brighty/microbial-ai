import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * ScrollToTop component that scrolls the window to the top whenever
 * the pathname changes in the location object.
 * This component should be included once in your app, near your router.
 */
const ScrollToTop: React.FC = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    // Scroll to top of the page when route changes
    window.scrollTo(0, 0);

    // For mobile Safari and other mobile browsers
    document.body.scrollTop = 0; // For Safari
    document.documentElement.scrollTop = 0; // For Chrome, Firefox, IE and Opera

    // Also handle any #root element scrolling
    const rootElement = document.getElementById("root");
    if (rootElement) {
      rootElement.scrollTop = 0;
    }

    // Scroll any content container elements
    const contentContainer = document.querySelector(".content-container");
    if (contentContainer) {
      contentContainer.scrollTop = 0;
    }
  }, [pathname]);

  return null;
};

export default ScrollToTop;
