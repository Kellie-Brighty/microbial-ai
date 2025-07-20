import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext.tsx";
import { CommunityThemeProvider } from "./context/CommunityThemeContext.tsx";
import ScrollToTop from "./components/ScrollToTop.tsx";
import LandingPage from "./pages/LandingPage.tsx";
import ConferencesPage from "./pages/conferences/ConferencesPage.tsx";
import ConferenceDetailPage from "./pages/conferences/ConferenceDetailPage.tsx";
import ConferenceCreatePage from "./pages/conferences/ConferenceCreatePage.tsx";
import ConferenceQuizPage from "./pages/conferences/ConferenceQuizPage.tsx";
import ConferenceRegistrantsPage from "./pages/conferences/ConferenceRegistrantsPage.tsx";
import RegistrationVerificationPage from "./pages/conferences/RegistrationVerificationPage.tsx";
import VerificationConfirmPage from "./pages/auth/VerificationConfirmPage.tsx";
import CommunitiesPage from "./pages/community/CommunitiesPage.tsx";
import CommunityPage from "./pages/community/CommunityPage.tsx";
import { CommunityProvider } from "./context/CommunityContext.tsx";
import AdminRoutes from "./routes/AdminRoutes.tsx";
import UserDashboard from "./pages/user/UserDashboard.tsx";
import QRCodeGeneratorPage from "./pages/QRCodeGeneratorPage.tsx";
import CreditsPage from "./pages/CreditsPage.tsx";
import ViewCertificatePage from "./pages/certificates/ViewCertificatePage.tsx";
import MarketplaceRoutes from "./routes/MarketplaceRoutes.tsx";
import ArticlesPage from "./pages/articles/ArticlesPage.tsx";
import ArticleDetailPage from "./pages/articles/ArticleDetailPage.tsx";
import AuthorProfilePage from "./pages/articles/AuthorProfilePage.tsx";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Router>
      <AuthProvider>
        <CommunityThemeProvider>
          <CommunityProvider>
            <ScrollToTop />
            {/* <MainNavigation /> */}
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/chat" element={<App />} />
              <Route path="/conferences" element={<ConferencesPage />} />
              <Route
                path="/conferences/create"
                element={<ConferenceCreatePage />}
              />
              <Route
                path="/conferences/:conferenceId"
                element={<ConferenceDetailPage />}
              />
              <Route
                path="/conferences/:conferenceId/quiz"
                element={<ConferenceQuizPage />}
              />
              <Route
                path="/conferences/:conferenceId/registrants"
                element={<ConferenceRegistrantsPage />}
              />
              <Route
                path="/verify-registration/:token"
                element={<RegistrationVerificationPage />}
              />
              <Route
                path="/verify-email/:token"
                element={<VerificationConfirmPage />}
              />
              <Route path="/communities" element={<CommunitiesPage />} />
              <Route path="/communities/:id" element={<CommunityPage />} />
              <Route path="/admin/*" element={<AdminRoutes />} />
              <Route path="/dashboard" element={<UserDashboard />} />
              <Route path="/qr-generator" element={<QRCodeGeneratorPage />} />
              <Route path="/credits" element={<CreditsPage />} />
              <Route
                path="/certificates/:certificateId"
                element={<ViewCertificatePage />}
              />
              <Route path="/marketplace/*" element={<MarketplaceRoutes />} />
              <Route path="/articles" element={<ArticlesPage />} />
              <Route
                path="/articles/:articleId"
                element={<ArticleDetailPage />}
              />
              <Route
                path="/authors/:authorId"
                element={<AuthorProfilePage />}
              />
            </Routes>
          </CommunityProvider>
        </CommunityThemeProvider>
      </AuthProvider>
    </Router>
  </React.StrictMode>
);
