import { StrictMode, Component, ErrorInfo, ReactNode, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import "./index.css";
import App from "./App";
import LandingPage from "./pages/LandingPage";
import { AuthProvider } from "./context/AuthContext";
import { initDebugging } from "./utils/debugging";
import ConferenceDetailPage from "./pages/conferences/ConferenceDetailPage";
import ConferencesPage from "./pages/conferences/ConferencesPage";
import ConferenceCreatePage from "./pages/conferences/ConferenceCreatePage";
import ConferenceRegistrantsPage from "./pages/conferences/ConferenceRegistrantsPage";
import UserDashboard from "./pages/user/UserDashboard";
import ScrollToTop from "./components/ScrollToTop";
import { startConferenceStatusTimer } from "./utils/conferenceStatus";
import CommunitiesPage from "./pages/community/CommunitiesPage";
import CommunityPage from "./pages/community/CommunityPage";
import { CommunityProvider } from "./context/CommunityContext";
import { CommunityThemeProvider } from "./context/CommunityThemeContext";
import ViewCertificatePage from "./pages/certificates/ViewCertificatePage";
import ConferenceQuizPage from "./pages/conferences/ConferenceQuizPage";

// Initialize debugging
initDebugging();

// Start the conference status timer
startConferenceStatusTimer();

// Create a component to manage status updates in React's lifecycle
const ConferenceStatusManager = () => {
  useEffect(() => {
    // Start the conference status timer when component mounts
    const cleanupTimer = startConferenceStatusTimer();

    // Clean up the timer when component unmounts
    return () => {
      cleanupTimer();
    };
  }, []);

  return null; // This component doesn't render anything
};

// Error boundary to catch rendering errors
class ErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log the error to console
    console.error("Error caught by error boundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-100">
          <div className="bg-white p-6 rounded-lg shadow-md max-w-md w-full">
            <h2 className="text-xl font-bold text-red-600 mb-4">
              Something went wrong
            </h2>
            <div className="bg-red-50 p-3 rounded mb-4 text-sm text-red-800 font-mono overflow-auto max-h-40">
              {this.state.error?.toString()}
            </div>
            <p className="mb-4 text-gray-700">
              Please try refreshing the page. If the problem persists, check
              your browser console for more details or contact support.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="bg-mint hover:bg-purple text-white font-bold py-2 px-4 rounded transition-colors"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

try {
  const rootElement = document.getElementById("root");

  if (!rootElement) {
    throw new Error("Failed to find the root element");
  }

  createRoot(rootElement).render(
    <StrictMode>
      <ErrorBoundary>
        <AuthProvider>
          <BrowserRouter>
            <ScrollToTop />
            <ConferenceStatusManager />
            <div className="flex flex-col min-h-screen">
              <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/chat" element={<App />} />
                <Route path="/conferences" element={<ConferencesPage />} />
                <Route
                  path="/conferences/create"
                  element={<ConferenceCreatePage />}
                />
                <Route
                  path="/conferences/:id"
                  element={<ConferenceDetailPage />}
                />
                <Route
                  path="/conferences/:id/registrants"
                  element={<ConferenceRegistrantsPage />}
                />
                <Route
                  path="/conferences/:conferenceId/quizzes"
                  element={<ConferenceQuizPage />}
                />
                <Route path="/dashboard" element={<UserDashboard />} />

                {/* Community Routes */}
                <Route
                  path="/communities"
                  element={
                    <CommunityThemeProvider>
                      <div className="min-h-screen">
                        <CommunitiesPage />
                      </div>
                    </CommunityThemeProvider>
                  }
                />
                <Route
                  path="/community/:communityId"
                  element={
                    <CommunityThemeProvider>
                      <div className="min-h-screen">
                        <CommunityProvider>
                          <CommunityPage />
                        </CommunityProvider>
                      </div>
                    </CommunityThemeProvider>
                  }
                />

                <Route
                  path="/certificates/view/:id"
                  element={<ViewCertificatePage />}
                />

                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </div>
          </BrowserRouter>
        </AuthProvider>
      </ErrorBoundary>
    </StrictMode>
  );
} catch (error) {
  console.error("Failed to render the application:", error);
  document.body.innerHTML = `
    <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; padding: 1rem; font-family: sans-serif;">
      <div style="background-color: white; padding: 2rem; border-radius: 0.5rem; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); max-width: 500px; width: 100%;">
        <h2 style="font-size: 1.5rem; color: #e53e3e; margin-bottom: 1rem;">Critical Error</h2>
        <p style="margin-bottom: 1rem; color: #4a5568;">
          The application failed to initialize. This may be due to missing or invalid configuration.
        </p>
        <p style="font-family: monospace; background-color: #f7fafc; padding: 0.75rem; border-radius: 0.25rem; overflow-wrap: break-word; color: #e53e3e;">
          ${error instanceof Error ? error.message : String(error)}
        </p>
        <button 
          onclick="window.location.reload()" 
          style="background-color: #3B82F6; color: white; border: none; padding: 0.5rem 1rem; border-radius: 0.25rem; font-weight: bold; cursor: pointer; margin-top: 1rem;">
          Reload Page
        </button>
      </div>
    </div>
  `;
}
