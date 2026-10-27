import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import Navbar from "./components/Navbar.jsx";
import Home from "./pages/Home";
import Students from "./pages/Students";
import AddStudent from "./pages/AddStudent";
import MemoExample from "./pages/MemoExample";
import Dashboard from "./pages/Dashboard.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import ForgotPassword from "./pages/ForgotPassword.jsx";
import VerifyOTP from "./pages/VerifyOTP.jsx";
import ResetPassword from "./pages/ResetPassword.jsx";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<><Navbar /><Home /></>} path="/" />
          <Route element={<><Navbar /><Login /></>} path="/login" />
          <Route element={<><Navbar /><Register /></>} path="/register" />
          <Route element={<><Navbar /><ForgotPassword /></>} path="/forgot-password" />
          <Route element={<><Navbar /><VerifyOTP /></>} path="/verify-otp" />
          <Route element={<><Navbar /><ResetPassword /></>} path="/reset-password" />
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/students" element={<Students />} />
            <Route path="/add-student" element={<AddStudent />} />
            <Route path="/add-students" element={<AddStudent />} />
            <Route path="/memo-example" element={<MemoExample />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
