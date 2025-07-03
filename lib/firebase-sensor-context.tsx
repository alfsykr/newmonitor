"use client";
import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { database } from "./firebaseConfig";
import { ref, onValue, off } from "firebase/database";

interface SensorData {
  time: string;
  temperature: number;
  humidity: number;
}

interface SensorContextType {
  sensorData: SensorData | null;
  sensorHistory: SensorData[]; // last 100 only
  isSensorConnected: boolean;
}

const SensorContext = createContext<SensorContextType | undefined>(undefined);

export function SensorProvider({ children }: { children: ReactNode }) {
  const [sensorData, setSensorData] = useState<SensorData | null>(null);
  const [sensorHistory, setSensorHistory] = useState<SensorData[]>([]); // last 100 only
  const [isSensorConnected, setIsSensorConnected] = useState(false);

  useEffect(() => {
    const dataRef = ref(database, "sensor");
    const unsubscribe = onValue(
      dataRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const dataObj = snapshot.val();
          const dataArr = Object.values(dataObj) as SensorData[];
          setSensorHistory(dataArr); // seluruh data
          const latest = dataArr[dataArr.length - 1];
          setSensorData(latest);
          setIsSensorConnected(true);
        } else {
          setSensorData(null);
          setSensorHistory([]);
          setIsSensorConnected(false);
        }
      },
      (error) => {
        setIsSensorConnected(false);
      }
    );
    return () => off(dataRef, "value", unsubscribe);
  }, []);

  return (
    <SensorContext.Provider value={{ sensorData, sensorHistory, isSensorConnected }}>
      {children}
    </SensorContext.Provider>
  );
}

export function useSensor() {
  const context = useContext(SensorContext);
  if (context === undefined) {
    throw new Error("useSensor must be used within a SensorProvider");
  }
  return context;
} 