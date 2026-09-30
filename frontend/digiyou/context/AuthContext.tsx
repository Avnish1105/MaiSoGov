"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export interface User {
  id: string;
  name: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (user: User) => void;
  register: (user: User) => void;
  logout: () => void;
  refetchUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

async function getCurrentUser(): Promise<User | null> {
  try {
    const res = await fetch(`${API_URL}/auth/me`, {
      method: "GET",
      credentials: "include",
    });

    if (!res.ok) {
      return null;
    }

    const data = await res.json();
    return { id: data.id, name: data.name };
  } catch (err) {
    console.error("Failed to verify session:", err);
    return null;
  }
}

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let active = true;

    const restoreSession = async () => {
      const currentUser = await getCurrentUser();
      if (active) {
        setUser(currentUser);
        setLoading(false);
      }
    };

    void restoreSession();
    return () => {
      active = false;
    };
  }, []);

  const login = (newUser: User) => {
    setUser(newUser);
    setLoading(false);
  };

  const register = (newUser: User) => {
    setUser(newUser);
    setLoading(false);
  };

  const logout = () => {
    void fetch(`${API_URL}/auth/logout`, {
      method: "POST",
      credentials: "include",
    }).catch((err) => console.error("Failed to end session:", err));
    setUser(null);
  };

  const refetchUser = async () => {
    setUser(await getCurrentUser());
    setLoading(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        refetchUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
