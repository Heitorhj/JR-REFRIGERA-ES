import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext.jsx";
import { useAuth } from "./context/useAuth.js";
import SiteHeader from "./components/SiteHeader.jsx";
import SiteFooter from "./components/SiteFooter.jsx";
import HomePage from "./pages/HomePage.jsx";
import RequestPage from "./pages/RequestPage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import AdminPage from "./pages/AdminPage.jsx";
import "./styles/tokens.css";
import "./styles/global.css";
import "./styles/layout.css";
import "./styles/pages.css";

function ProtectedRoute({ children }) {
  const { token, checkingSession } = useAuth();

  if (checkingSession) {
    return <main className="screen-message">Carregando seu espaço...</main>;
  }

  return token ? children : <Navigate to="/admin/login" replace />;
}

function AppRoutes() {
  const { pathname } = useLocation();
  const telaDeLogin = pathname === "/admin/login";

  return (
    <div className={telaDeLogin ? "app-shell app-shell--auth" : "app-shell"}>
      {!telaDeLogin && <SiteHeader />}
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/solicitar-orcamento" element={<RequestPage />} />
        <Route path="/admin/login" element={<LoginPage />} />
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <AdminPage />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      {!telaDeLogin && <SiteFooter />}
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
