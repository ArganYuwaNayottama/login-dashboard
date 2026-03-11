import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Signin from "./pages/Signin";
import Dashcustomer from "./pages/Dashcustomer";
import Dashcashier from "./pages/Dashcashier";
import Dashadmin from "./pages/Dashadmin";
import { DiscountProvider } from "./store/discountStore";


// =====================
// PROTECTED ROUTE
// =====================
function ProtectedRoute({ children, allowedRoles }) {
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");

  // Belum login → ke login
  if (!token) return <Navigate to="/login" replace />;

  // Role tidak sesuai → ke halaman sesuai rolenya
  if (allowedRoles && !allowedRoles.includes(role)) {
    if (role === "admin") return <Navigate to="/admin" replace />;
    if (role === "cashier") return <Navigate to="/cashier" replace />;
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

// =====================
// REDIRECT SETELAH LOGIN
// =====================
function HomeRedirect() {
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");

  if (!token) return <Navigate to="/login" replace />;
  if (role === "admin") return <Navigate to="/admin" replace />;
  if (role === "cashier") return <Navigate to="/cashier" replace />;
  return <Navigate to="/dashboard" replace />;
}

function App() {
  return (
    <DiscountProvider>
      <Routes>
        {/* Public */}
        <Route path="/" element={<HomeRedirect />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signin" element={<Signin />} />

        {/* Customer */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute allowedRoles={["customer"]}>
              <Dashcustomer />
            </ProtectedRoute>
          }
        />

        {/* Cashier */}
        <Route
          path="/cashier"
          element={
            <ProtectedRoute allowedRoles={["cashier"]}>
              <Dashcashier />
            </ProtectedRoute>
          }
        />

        {/* Admin */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <Dashadmin />
            </ProtectedRoute>
          }
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </DiscountProvider>
  );
}

export default App;
