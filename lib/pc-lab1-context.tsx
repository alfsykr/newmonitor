"use client";
import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { database } from "./firebaseConfig";
import { ref, onValue, off } from "firebase/database";

interface PcLab1Data {
  suhu: number;
  tanggal: string;
  waktu: string;
  timestamp: string;
}

interface PcLab1ContextType {
  data: PcLab1Data[];
  avgSuhu: number;
  isConnected: boolean;
}

const PcLab1Context = createContext<PcLab1ContextType | undefined>(undefined);

export function PcLab1Provider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<PcLab1Data[]>([]);
  const [avgSuhu, setAvgSuhu] = useState<number>(0);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const dataRef = ref(database, "data_suhu/pc_lab1");
    const unsubscribe = onValue(
      dataRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const dataObj = snapshot.val();
          const dataArr = Object.values(dataObj) as PcLab1Data[];
          setData(dataArr);
          setIsConnected(true);
          if (dataArr.length > 0) {
            const avg = dataArr.reduce((sum, d) => sum + (d.suhu || 0), 0) / dataArr.length;
            setAvgSuhu(Number.isFinite(avg) ? Math.round(avg * 10) / 10 : 0);
          } else {
            setAvgSuhu(0);
          }
        } else {
          setData([]);
          setAvgSuhu(0);
          setIsConnected(false);
        }
      },
      (error) => {
        setIsConnected(false);
      }
    );
    return () => off(dataRef, "value", unsubscribe);
  }, []);

  return (
    <PcLab1Context.Provider value={{ data, avgSuhu, isConnected }}>
      {children}
    </PcLab1Context.Provider>
  );
}

export function usePcLab1() {
  const context = useContext(PcLab1Context);
  if (context === undefined) {
    throw new Error("usePcLab1 must be used within a PcLab1Provider");
  }
  return context;
} 