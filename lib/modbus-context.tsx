"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface SHT20Data {
  temperature: number;
  humidity: number;
  timestamp: Date;
  status: 'connected' | 'disconnected' | 'error';
}

interface ModbusConfig {
  host: string;
  port: number;
  unitId: number;
  temperatureRegister: number;
  humidityRegister: number;
  pollInterval: number;
}

interface ModbusContextType {
  sht20Data: SHT20Data;
  config: ModbusConfig;
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  historicalData: SHT20Data[];
  connect: () => Promise<void>;
  disconnect: () => void;
  updateConfig: (newConfig: Partial<ModbusConfig>) => void;
  clearError: () => void;
}

const ModbusContext = createContext<ModbusContextType | undefined>(undefined);

const defaultConfig: ModbusConfig = {
  host: '192.168.1.100', // Default Modbus TCP IP
  port: 502,             // Default Modbus TCP port
  unitId: 1,             // Modbus slave ID
  temperatureRegister: 0, // Register address for temperature
  humidityRegister: 1,    // Register address for humidity
  pollInterval: 5000      // Poll every 5 seconds
};

export function ModbusProvider({ children }: { children: ReactNode }) {
  const [sht20Data, setSht20Data] = useState<SHT20Data>({
    temperature: 24.5,
    humidity: 48.2,
    timestamp: new Date(),
    status: 'disconnected'
  });
  
  const [config, setConfig] = useState<ModbusConfig>(defaultConfig);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [historicalData, setHistoricalData] = useState<SHT20Data[]>([]);
  const [pollInterval, setPollInterval] = useState<NodeJS.Timeout | null>(null);

  // Load config from localStorage
  useEffect(() => {
    const savedConfig = localStorage.getItem('modbus-config');
    if (savedConfig) {
      try {
        const parsedConfig = JSON.parse(savedConfig);
        setConfig({ ...defaultConfig, ...parsedConfig });
      } catch (e) {
        console.error('Failed to parse saved config:', e);
      }
    }
  }, []);

  // Save config to localStorage
  useEffect(() => {
    localStorage.setItem('modbus-config', JSON.stringify(config));
  }, [config]);

  // Simulated Modbus connection function
  // In real implementation, this would use a Modbus library like 'modbus-serial' or 'node-modbus'
  const readModbusRegisters = async (): Promise<{ temperature: number; humidity: number }> => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 200));
    
    // Simulate occasional connection errors
    if (Math.random() < 0.05) {
      throw new Error('Modbus communication timeout');
    }
    
    // Simulate SHT20 data with realistic variations
    const baseTemp = 24;
    const baseHumidity = 50;
    const tempVariation = (Math.random() - 0.5) * 4; // ±2°C variation
    const humidityVariation = (Math.random() - 0.5) * 10; // ±5% variation
    
    return {
      temperature: Math.round((baseTemp + tempVariation) * 10) / 10,
      humidity: Math.round((baseHumidity + humidityVariation) * 10) / 10
    };
  };

  const connect = async () => {
    if (isConnecting || isConnected) return;
    
    setIsConnecting(true);
    setError(null);
    
    try {
      // Test connection
      await readModbusRegisters();
      
      setIsConnected(true);
      setSht20Data(prev => ({ ...prev, status: 'connected' }));
      
      // Start polling
      const interval = setInterval(async () => {
        try {
          const data = await readModbusRegisters();
          const newReading: SHT20Data = {
            temperature: data.temperature,
            humidity: data.humidity,
            timestamp: new Date(),
            status: 'connected'
          };
          
          setSht20Data(newReading);
          
          // Add to historical data (keep last 100 readings)
          setHistoricalData(prev => {
            const updated = [...prev, newReading];
            return updated.slice(-100);
          });
          
        } catch (err) {
          console.error('Modbus read error:', err);
          setError((err as Error).message);
          setSht20Data(prev => ({ ...prev, status: 'error' }));
        }
      }, config.pollInterval);
      
      setPollInterval(interval);
      
    } catch (err) {
      setError((err as Error).message);
      setSht20Data(prev => ({ ...prev, status: 'error' }));
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnect = () => {
    if (pollInterval) {
      clearInterval(pollInterval);
      setPollInterval(null);
    }
    
    setIsConnected(false);
    setSht20Data(prev => ({ ...prev, status: 'disconnected' }));
    setError(null);
  };

  const updateConfig = (newConfig: Partial<ModbusConfig>) => {
    setConfig(prev => ({ ...prev, ...newConfig }));
    
    // If connected, restart with new config
    if (isConnected) {
      disconnect();
      setTimeout(connect, 1000);
    }
  };

  const clearError = () => {
    setError(null);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (pollInterval) {
        clearInterval(pollInterval);
      }
    };
  }, [pollInterval]);

  const value: ModbusContextType = {
    sht20Data,
    config,
    isConnected,
    isConnecting,
    error,
    historicalData,
    connect,
    disconnect,
    updateConfig,
    clearError
  };

  return (
    <ModbusContext.Provider value={value}>
      {children}
    </ModbusContext.Provider>
  );
}

export function useModbus() {
  const context = useContext(ModbusContext);
  if (context === undefined) {
    throw new Error('useModbus must be used within a ModbusProvider');
  }
  return context;
}