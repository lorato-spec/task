import { createContext, useContext, useEffect, useState } from "react";
import api, { STORAGE_KEY, getStoredAuth } from "../api";

const AuthContext = createContext(null);
const emptyAuth = {
  token: "",
  user: null
};

function getErrorMessage(error, fallbackMessage) {
  return error.response?.data?.message || fallbackMessage;
}

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(() => getStoredAuth() || emptyAuth);

  useEffect(() => {
    if (auth.token && auth.user) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(auth));
    } else {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }, [auth]);

  const login = async (credentials) => {
    try {
      const { data } = await api.post("/auth/login", credentials);
      setAuth(data);
      return data;
    } catch (error) {
      throw new Error(getErrorMessage(error, "Unable to sign in."));
    }
  };

  const register = async (payload) => {
    try {
      const { data } = await api.post("/auth/register", payload);
      setAuth(data);
      return data;
    } catch (error) {
      throw new Error(getErrorMessage(error, "Unable to create your account."));
    }
  };

  const logout = () => {
    setAuth(emptyAuth);
  };

  const value = {
    token: auth.token,
    user: auth.user,
    isAuthenticated: Boolean(auth.token),
    login,
    register,
    logout
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider.");
  }

  return context;
}
