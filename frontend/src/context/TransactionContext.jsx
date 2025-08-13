// src/context/TransactionContext.jsx
import React, { createContext, useContext, useState, useCallback, useMemo } from "react";

const TransactionContext = createContext();

export const TransactionProvider = ({ children }) => {
  const [transaction, setTransaction] = useState({
    status: "idle", // idle | loading | success | error
    message: "",
  });

  const startTransaction = useCallback((message) => {
    setTransaction({ status: "loading", message });
  }, []);

  const endTransaction = useCallback((message) => {
    setTransaction({ status: "success", message });
    setTimeout(() => setTransaction({ status: "idle", message: "" }), 4000); // Reset after 4s
  }, []);

  const setError = useCallback((message) => {
    setTransaction({ status: "error", message });
    setTimeout(() => setTransaction({ status: "idle", message: "" }), 6000); // Reset after 6s
  }, []);

  const value = useMemo(() => ({
    transaction,
    startTransaction,
    endTransaction,
    setError,
  }), [transaction, startTransaction, endTransaction, setError]);

  return (
    <TransactionContext.Provider value={value}>
      {children}
    </TransactionContext.Provider>
  );
};

// Hook to use context
export const useTransaction = () => useContext(TransactionContext);
