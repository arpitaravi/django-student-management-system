import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import AuthContext from "./authContext.js";
import {
  getCsrfToken,
  getCurrentUser,
  loginUser,
  logoutUser,
  requestPasswordReset,
  registerUser,
  submitPasswordReset,
  verifyPasswordResetOtp,
} from "../services/authService.js";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [csrfToken, setCsrfToken] = useState("");
  const [passwordResetEmail, setPasswordResetEmail] = useState("");

  useEffect(() => {
    let active = true;

    async function restoreSession() {
      try {
        const token = await getCsrfToken();
        const currentUser = await getCurrentUser();
        if (active) {
          setCsrfToken(token);
          setUser(currentUser);
        }
      } catch (error) {
        if (active) {
          console.error("Unable to restore authentication session:", error);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    restoreSession();
    return () => {
      active = false;
    };
  }, []);

  const register = useCallback(async (userData) => {
    const token = csrfToken || await getCsrfToken();
    setCsrfToken(token);
    return registerUser(userData, token);
  }, [csrfToken]);

  const login = useCallback(async (credentials) => {
    const token = csrfToken || await getCsrfToken();
    const result = await loginUser(credentials, token);
    setCsrfToken(result.csrfToken);
    setUser(result.user);
    return result.user;
  }, [csrfToken]);

  const logout = useCallback(async () => {
    const token = csrfToken || await getCsrfToken();
    await logoutUser(token);
    setUser(null);
  }, [csrfToken]);

  const expireSession = useCallback(() => {
    setUser(null);
    setCsrfToken("");
  }, []);

  const requestPasswordResetCode = useCallback(async (email) => {
    const result = await requestPasswordReset(email);
    setPasswordResetEmail(email);
    return result;
  }, []);

  const verifyPasswordResetCode = useCallback(async (code) => {
    return verifyPasswordResetOtp(passwordResetEmail, code);
  }, [passwordResetEmail]);

  const resetPassword = useCallback(async (password, confirmPassword) => {
    const result = await submitPasswordReset(password, confirmPassword);
    setPasswordResetEmail("");
    return result;
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      register,
      login,
      logout,
      expireSession,
      passwordResetEmail,
      requestPasswordResetCode,
      verifyPasswordResetCode,
      resetPassword,
    }),
    [
      user,
      loading,
      register,
      login,
      logout,
      expireSession,
      passwordResetEmail,
      requestPasswordResetCode,
      verifyPasswordResetCode,
      resetPassword,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
