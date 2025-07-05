"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import Papa from 'papaparse';

interface CPUData {
  id: string;
  name: string;
  temperature: number;
  maxTemp: number;
  cores: number;
  usage: number;
  status: string;
}

interface Metrics {
  totalCPUs: number;
  avgTemp: number;
  maxTemp: number;
  dataSource: string;
}

interface AIDA64ContextType {
  cpuData: CPUData[];
  metrics: Metrics;
  isConnected: boolean;
  autoRefresh: boolean;
  lastUpdate: Date;
  uploadedCsvContent: string | null;
  setCpuData: (data: CPUData[]) => void;
  setMetrics: (metrics: Metrics) => void;
  setIsConnected: (connected: boolean) => void;
  setAutoRefresh: (refresh: boolean) => void;
  setLastUpdate: (date: Date) => void;
  setUploadedCsvContent: (content: string | null) => void;
  processAidaData: (csvContent: string) => void;
  simulateDataVariation: (csvContent: string) => void;
}

const AIDA64Context = createContext<AIDA64ContextType | undefined>(undefined);

// Generate mock data for fallback
const generateIndividualCPUData = (): CPUData[] => {
  const cpus = ['CPU', 'CPU Package', 'CPU IA Cores', 'CPU GT Cores', 'HDD1'];
  
  return cpus.map((cpu, index) => {
    const baseTemp = cpu.includes('HDD') ? 35 : 65;
    const temp = baseTemp + Math.random() * 15 - 7.5;
    const roundedTemp = Math.round(temp * 10) / 10;
    const cores = cpu.includes('Package') ? 8 : cpu.includes('IA') ? 4 : cpu.includes('GT') ? 4 : cpu.includes('HDD') ? 0 : 1;
    const usage = cpu.includes('HDD') ? 0 : Math.floor(Math.random() * 100);
    
    return {
      id: cpu.toLowerCase().replace(/[^a-z0-9]/g, '-'),
      name: cpu,
      temperature: roundedTemp,
      maxTemp: Math.round((roundedTemp + Math.random() * 5) * 10) / 10,
      cores,
      usage,
      status: roundedTemp > 80 ? 'Critical' : roundedTemp > 70 ? 'Warning' : 'Normal'
    };
  });
};

export function AIDA64Provider({ children }: { children: ReactNode }) {
  const [cpuData, setCpuData] = useState<CPUData[]>([]);
  const [metrics, setMetrics] = useState<Metrics>({
    totalCPUs: 5,
    avgTemp: 0,
    maxTemp: 0,
    dataSource: 'Mock Data'
  });
  const [isConnected, setIsConnected] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [uploadedCsvContent, setUploadedCsvContent] = useState<string | null>(null);

  // Load data from localStorage on mount
  useEffect(() => {
    const savedCsvContent = localStorage.getItem('aida64-csv-content');
    const savedAutoRefresh = localStorage.getItem('aida64-auto-refresh');
    
    if (savedCsvContent) {
      setUploadedCsvContent(savedCsvContent);
      processAidaData(savedCsvContent);
      if (savedAutoRefresh === 'true') {
        setAutoRefresh(true);
      }
    } else {
      // Initialize with mock data
      const initialData = generateIndividualCPUData();
      setCpuData(initialData);
      
      const tempValues = initialData.map(cpu => cpu.temperature);
      const avgTemp = tempValues.reduce((sum, t) => sum + t, 0) / tempValues.length;
      const maxTemp = Math.max(...tempValues);
      
      setMetrics({
        totalCPUs: 5,
        avgTemp: Math.round(avgTemp * 10) / 10,
        maxTemp: Math.round(maxTemp * 10) / 10,
        dataSource: 'Mock Data'
      });
    }
  }, []);

  // Save to localStorage when data changes
  useEffect(() => {
    if (uploadedCsvContent) {
      localStorage.setItem('aida64-csv-content', uploadedCsvContent);
    }
  }, [uploadedCsvContent]);

  useEffect(() => {
    localStorage.setItem('aida64-auto-refresh', autoRefresh.toString());
  }, [autoRefresh]);

  // AIDA64 CSV Parser Function
  const processAidaData = (csvContent: string) => {
    try {
      const result = Papa.parse(csvContent, {
        header: false,
        skipEmptyLines: true,
        dynamicTyping: true
      });

      const rows = result.data;
      
      let headerIndex = -1;
      let dataStartIndex = -1;
      
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i] as any[];
        if (row && row.length > 0 && typeof row[0] === 'string') {
          if (row[0].includes('Date') || row.join(',').includes('Date,Time,UpTime,CPU')) {
            headerIndex = i;
            dataStartIndex = i + 2;
            break;
          }
        }
      }

      if (headerIndex === -1) {
        throw new Error('Header tidak ditemukan dalam file');
      }

      const headers = rows[headerIndex] as string[];
      const tempColumns = headers.slice(3);

      const allTemperatureData: number[] = [];
      const sensorData: any[] = [];
      
      for (let i = dataStartIndex; i < rows.length; i++) {
        const row = rows[i] as any[];
        if (row && row.length >= 4) {
          tempColumns.forEach((sensorName, colIndex) => {
            const tempValue = row[3 + colIndex];
            if (typeof tempValue === 'number' && tempValue > 0) {
              allTemperatureData.push(tempValue);
              
              let sensor = sensorData.find(s => s.name === sensorName);
              if (!sensor) {
                sensor = {
                  id: sensorName.toLowerCase().replace(/[^a-z0-9]/g, '-'),
                  name: sensorName,
                  temperatures: [],
                  cores: sensorName.includes('Package') ? 8 : sensorName.includes('IA') ? 4 : sensorName.includes('GT') ? 4 : sensorName.includes('HDD') ? 0 : 1,
                  usage: sensorName.includes('HDD') ? 0 : Math.floor(Math.random() * 100)
                };
                sensorData.push(sensor);
              }
              sensor.temperatures.push(tempValue);
            }
          });
        }
      }

      if (allTemperatureData.length === 0) {
        throw new Error('Tidak ada data temperatur yang valid ditemukan');
      }

      const processedCpuData = sensorData.map(sensor => {
        const avgTemp = sensor.temperatures.reduce((sum: number, temp: number) => sum + temp, 0) / sensor.temperatures.length;
        const maxTemp = Math.max(...sensor.temperatures);
        const roundedAvgTemp = Math.round(avgTemp * 10) / 10;
        
        return {
          ...sensor,
          temperature: roundedAvgTemp,
          maxTemp: Math.round(maxTemp * 10) / 10,
          status: roundedAvgTemp > 80 ? 'Critical' : roundedAvgTemp > 70 ? 'Warning' : 'Normal'
        };
      });

      const totalTemp = allTemperatureData.reduce((sum, temp) => sum + temp, 0);
      const avgTemp = Math.round((totalTemp / allTemperatureData.length) * 10) / 10;
      const maxTemp = Math.round(Math.max(...allTemperatureData) * 10) / 10;

      setCpuData(processedCpuData);
      setMetrics({
        totalCPUs: 5,
        avgTemp,
        maxTemp,
        dataSource: 'AIDA64 CSV'
      });
      setIsConnected(true);
      setLastUpdate(new Date());

    } catch (error) {
      console.error('Error processing data:', error);
      alert(`Error: ${(error as Error).message}`);
      
      const mockData = generateIndividualCPUData();
      setCpuData(mockData);
      
      const tempValues = mockData.map(cpu => cpu.temperature);
      const avgTemp = tempValues.reduce((sum, t) => sum + t, 0) / tempValues.length;
      const maxTemp = Math.max(...tempValues);
      
      setMetrics({
        totalCPUs: 5,
        avgTemp: Math.round(avgTemp * 10) / 10,
        maxTemp: Math.round(maxTemp * 10) / 10,
        dataSource: 'Mock Data'
      });
    }
  };

  // Simulate data variation for uploaded CSV
  const simulateDataVariation = (csvContent: string) => {
    try {
      const result = Papa.parse(csvContent, {
        header: false,
        skipEmptyLines: true,
        dynamicTyping: true
      });

      const rows = result.data;
      let headerIndex = -1;
      
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i] as any[];
        if (row && row.length > 0 && typeof row[0] === 'string') {
          if (row[0].includes('Date') || row.join(',').includes('Date,Time,UpTime,CPU')) {
            headerIndex = i;
            break;
          }
        }
      }

      if (headerIndex === -1) return;

      const headers = rows[headerIndex] as string[];
      const tempColumns = headers.slice(3);

      const sensorData: any[] = [];
      
      tempColumns.forEach((sensorName) => {
        const baseTemp = sensorName.includes('HDD') ? 35 : sensorName.includes('CPU') ? 50 : 45;
        const variation = (Math.random() - 0.5) * 6;
        const currentTemp = Math.max(25, baseTemp + variation);
        const roundedTemp = Math.round(currentTemp * 10) / 10;
        
        sensorData.push({
          id: sensorName.toLowerCase().replace(/[^a-z0-9]/g, '-'),
          name: sensorName,
          temperature: roundedTemp,
          maxTemp: Math.round((roundedTemp + Math.random() * 3) * 10) / 10,
          cores: sensorName.includes('Package') ? 8 : sensorName.includes('IA') ? 4 : sensorName.includes('GT') ? 4 : sensorName.includes('HDD') ? 0 : 1,
          usage: sensorName.includes('HDD') ? 0 : Math.floor(Math.random() * 100),
          status: roundedTemp > 80 ? 'Critical' : roundedTemp > 70 ? 'Warning' : 'Normal'
        });
      });

      const tempValues = sensorData.map(sensor => sensor.temperature);
      const avgTemp = tempValues.reduce((sum, t) => sum + t, 0) / tempValues.length;
      const maxTemp = Math.max(...tempValues);

      setCpuData(sensorData);
      setMetrics({
        totalCPUs: 5,
        avgTemp: Math.round(avgTemp * 10) / 10,
        maxTemp: Math.round(maxTemp * 10) / 10,
        dataSource: 'AIDA64 CSV (Live)'
      });
      setLastUpdate(new Date());

    } catch (error) {
      console.error('Error simulating data variation:', error);
    }
  };

  // Auto-refresh effect
  useEffect(() => {
    if (!autoRefresh || !uploadedCsvContent) return;

    const interval = setInterval(() => {
      simulateDataVariation(uploadedCsvContent);
    }, 30000); // Update every 30 seconds instead of 5

    return () => clearInterval(interval);
  }, [autoRefresh, uploadedCsvContent]);

  const value: AIDA64ContextType = {
    cpuData,
    metrics,
    isConnected,
    autoRefresh,
    lastUpdate,
    uploadedCsvContent,
    setCpuData,
    setMetrics,
    setIsConnected,
    setAutoRefresh,
    setLastUpdate,
    setUploadedCsvContent,
    processAidaData,
    simulateDataVariation,
  };

  return (
    <AIDA64Context.Provider value={value}>
      {children}
    </AIDA64Context.Provider>
  );
}

export function useAIDA64() {
  const context = useContext(AIDA64Context);
  if (context === undefined) {
    throw new Error('useAIDA64 must be used within an AIDA64Provider');
  }
  return context;
}