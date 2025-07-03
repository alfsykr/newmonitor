"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { database } from "./firebaseConfig";
import { ref, onValue, off } from "firebase/database";

interface FirebaseCPUData {
  id: string;
  laptopId: string;
  suhu: number;
  tanggal: string;
  waktu: string;
  timestamp: string;
  status: string;
}

interface FirebaseContextType {
  firebaseCPUData: FirebaseCPUData[];
  isFirebaseConnected: boolean;
  lastFirebaseUpdate: Date;
  connectedLaptops: string[];
}

const FirebaseContext = createContext<FirebaseContextType | undefined>(
  undefined
);

export function FirebaseProvider({ children }: { children: ReactNode }) {
  const [firebaseCPUData, setFirebaseCPUData] = useState<FirebaseCPUData[]>([]);
  const [isFirebaseConnected, setIsFirebaseConnected] = useState(false);
  const [lastFirebaseUpdate, setLastFirebaseUpdate] = useState(new Date());
  const [connectedLaptops, setConnectedLaptops] = useState<string[]>([]);

  useEffect(() => {
    const dataRef = ref(database, "data_suhu");

    const unsubscribe = onValue(
      dataRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.val();
          const formattedData: FirebaseCPUData[] = [];
          const laptopIds = new Set<string>();

          Object.keys(data).forEach((laptopId) => {
            laptopIds.add(laptopId);
            const laptopData = data[laptopId];

            // Ambil data terakhir dari setiap laptop
            const latestEntry = Object.keys(laptopData).reduce(
              (latest, key) => {
                const current = laptopData[key];
                const latestTime = latest
                  ? new Date(latest.timestamp)
                  : new Date(0);
                const currentTime = new Date(current.timestamp);
                return currentTime > latestTime ? current : latest;
              },
              null
            );

            if (latestEntry) {
              const temp = latestEntry.suhu;
              let status = "Normal";
              if (temp > 80) status = "Critical";
              else if (temp > 70) status = "Warning";
              else if (temp < 50) status = "Cool";

              formattedData.push({
                id: `${laptopId}-firebase`,
                laptopId,
                suhu: temp,
                tanggal: latestEntry.tanggal,
                waktu: latestEntry.waktu,
                timestamp: latestEntry.timestamp,
                status,
              });
            }
          });

          setFirebaseCPUData(formattedData);
          setConnectedLaptops(Array.from(laptopIds));
          setIsFirebaseConnected(true);
          setLastFirebaseUpdate(new Date());
        } else {
          setIsFirebaseConnected(false);
          setFirebaseCPUData([]);
          setConnectedLaptops([]);
        }
      },
      (error) => {
        console.error("Firebase connection error:", error);
        setIsFirebaseConnected(false);
      }
    );

    return () => off(dataRef, "value", unsubscribe);
  }, []);

  return (
    <FirebaseContext.Provider
      value={{
        firebaseCPUData,
        isFirebaseConnected,
        lastFirebaseUpdate,
        connectedLaptops,
      }}
    >
      {children}
    </FirebaseContext.Provider>
  );
}

export function useFirebase() {
  const context = useContext(FirebaseContext);
  if (context === undefined) {
    throw new Error("useFirebase must be used within a FirebaseProvider");
  }
  return context;
}
