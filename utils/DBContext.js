// utils/DBContext.js
import React, { createContext, useContext, useEffect, useState } from 'react';
import { initDB } from './db';

const DBReadyContext = createContext(false); // ❗ this creates context

export const useDBReady = () => useContext(DBReadyContext); // ❗ hook to access it

export const DBProvider = ({ children }) => {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        await initDB();
        setIsReady(true);
        console.log("✅ DB initialized successfully");
      } catch (err) {
        console.error("❌ DB init failed", err);
      }
    };
    load();
  }, []);

  return (
    <DBReadyContext.Provider value={isReady}>
      {children}
    </DBReadyContext.Provider>
  );
};