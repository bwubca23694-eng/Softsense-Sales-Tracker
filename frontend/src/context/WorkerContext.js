import React, { createContext, useContext, useState, useEffect } from 'react';

const WorkerContext = createContext(null);

export const WorkerProvider = ({ children }) => {
  const [worker, setWorker] = useState(null);
  const [store, setStore] = useState(null);

  useEffect(() => {
    try {
      const w = localStorage.getItem('ss_worker');
      const s = localStorage.getItem('ss_store');
      if (w) setWorker(JSON.parse(w));
      if (s) setStore(JSON.parse(s));
    } catch {}
  }, []);

  const selectWorker = (w) => { setWorker(w); localStorage.setItem('ss_worker', JSON.stringify(w)); };
  const selectStore = (s) => { setStore(s); localStorage.setItem('ss_store', JSON.stringify(s)); };
  const clearSession = () => { setWorker(null); setStore(null); localStorage.removeItem('ss_worker'); localStorage.removeItem('ss_store'); };

  return (
    <WorkerContext.Provider value={{ worker, store, selectWorker, selectStore, clearSession }}>
      {children}
    </WorkerContext.Provider>
  );
};

export const useWorker = () => useContext(WorkerContext);
