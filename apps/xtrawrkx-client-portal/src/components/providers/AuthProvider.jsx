"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { strapiClient } from "@/lib/strapiClient";

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [account, setAccount] = useState(null);
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentContact, setCurrentContact] = useState(null);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      if (strapiClient.isAuthenticated()) {
        const userData = await strapiClient.getCurrentUser();
        if (userData) {
          setAccount(userData.account);
          setContacts(userData.contacts);

          // Set primary contact as default current contact
          const primaryContact = userData.contacts.find(
            (c) => c.role === "PRIMARY_CONTACT"
          );
          setCurrentContact(primaryContact || userData.contacts[0]);

          setUser({
            type: "client",
            ...userData.account,
            contacts: userData.contacts,
          });
        }
      }
    } catch (error) {
      console.error("Auth check failed:", error);
      // Clear invalid session
      strapiClient.logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const data = await strapiClient.clientLogin(email, password);

      setAccount(data.account);
      setContacts(data.contacts);

      // Set primary contact as default current contact
      const primaryContact = data.contacts.find(
        (c) => c.role === "PRIMARY_CONTACT"
      );
      setCurrentContact(primaryContact || data.contacts[0]);

      setUser({
        type: "client",
        ...data.account,
        contacts: data.contacts,
      });

      return data;
    } catch (error) {
      console.error("Login failed:", error);
      throw error;
    }
  };

  const logout = () => {
    strapiClient.logout();
    setUser(null);
    setAccount(null);
    setContacts([]);
    setCurrentContact(null);
  };

  const switchContact = (contactId) => {
    const contact = contacts.find((c) => c.id === contactId);
    if (contact) {
      setCurrentContact(contact);
    }
  };

  // Check if current contact has specific permission
  const hasPermission = (permission) => {
    if (!currentContact) return false;

    const accessLevel = currentContact.portalAccessLevel;
    const role = currentContact.role;

    // Primary contact has full access
    if (role === "PRIMARY_CONTACT") return true;

    // Permission mapping based on access level
    const permissions = {
      FULL_ACCESS: ["view", "comment", "upload", "manage", "invite"],
      PROJECT_VIEW: ["view", "comment"],
      INVOICE_VIEW: ["view"],
      READ_ONLY: ["view"],
      NO_ACCESS: [],
    };

    return permissions[accessLevel]?.includes(permission) || false;
  };

  // Check if current contact can access specific section
  const canAccessSection = (section) => {
    if (!currentContact) return false;

    const accessLevel = currentContact.portalAccessLevel;
    const role = currentContact.role;

    // Primary contact can access everything
    if (role === "PRIMARY_CONTACT") return true;

    // Section access mapping
    const sectionAccess = {
      FULL_ACCESS: [
        "dashboard",
        "projects",
        "files",
        "invoices",
        "settings",
        "team",
      ],
      PROJECT_VIEW: ["dashboard", "projects", "files"],
      INVOICE_VIEW: ["dashboard", "invoices"],
      READ_ONLY: ["dashboard"],
      NO_ACCESS: [],
    };

    return sectionAccess[accessLevel]?.includes(section) || false;
  };

  const value = {
    user,
    account,
    contacts,
    currentContact,
    loading,
    login,
    logout,
    switchContact,
    hasPermission,
    canAccessSection,
    isAuthenticated: !!user,
    isPrimaryContact: currentContact?.role === "PRIMARY_CONTACT",
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};



