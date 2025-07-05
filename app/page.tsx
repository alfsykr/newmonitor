"use client";

import { useState, useEffect, useMemo } from 'react';
import { Sidebar } from '@/components/sidebar';
import { Header } from '@/components/header';
import { MetricCard } from '@/components/metric-card';
import { CPUMonitoringTable } from '@/components/cpu-monitoring-table';
import { Footer } from '@/components/footer';
import { useAIDA64 } from '@/lib/aida64-context';
import { SensorProvider, useSensor } from '@/lib/firebase-sensor-context';
import { 
  Cpu, 
  Thermometer, 
  Monitor, 
  AlertTriangle,
  Home as HomeIcon,
  Droplet
} from 'lucide-react';
import { PcLab1Provider, usePcLab1 } from '@/lib/pc-lab1-context';

// Simplified greeting component
function DashboardGreeting() {
  const [greeting, setGreeting] = useState("");
  const [dateTime, setDateTime] = useState({ day: "", time: "", date: "" });

  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date();
      const hours = now.getHours();
      
      let greetingText = "";
      if (hours < 5) greetingText = "Good Night!";
      else if (hours < 12) greetingText = "Good Morning!";
      else if (hours < 18) greetingText = "Good Afternoon!";
      else greetingText = "Good Evening!";

      setGreeting(greetingText);
      setDateTime({
        day: now.toLocaleDateString('en-US', { weekday: 'long' }),
        time: now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
        date: now.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
      });
    };

    updateDateTime();
    const timer = setInterval(updateDateTime, 60000); // Update every minute
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative w-full min-h-[400px] rounded-2xl overflow-hidden flex flex-col items-center justify-center bg-gradient-to-br from-blue-600 to-purple-700">
      <div className="absolute top-6 left-8 z-20 flex items-center gap-2">
        <HomeIcon className="w-8 h-8 text-white drop-shadow-lg" />
        <span className="text-xl font-bold text-white drop-shadow-lg">Lab Room Monitoring</span>
      </div>
      
      <div className="relative z-10 flex flex-row w-full max-w-4xl justify-between items-center mt-8 px-8">
        <div className="flex flex-col items-center text-white">
          <span className="text-4xl font-bold drop-shadow-lg">{greeting}</span>
          <div className="flex flex-col items-center text-white text-center mt-2">
            <span className="text-lg font-semibold">{dateTime.day}</span>
            <span className="text-xl font-bold">{dateTime.time}</span>
            <span className="text-base">{dateTime.date}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function DashboardMetrics() {
  const { sensorHistory, isSensorConnected } = useSensor();
  const { avgSuhu: avgCpuLab1, isConnected: isPcLab1Connected } = usePcLab1();
  const { metrics } = useAIDA64();

  // Memoize calculations to prevent unnecessary re-renders
  const calculatedMetrics = useMemo(() => {
    const avgTemp = sensorHistory?.length > 0 
      ? (sensorHistory.reduce((sum, d) => sum + (d.temperature || 0), 0) / sensorHistory.length).toFixed(1)
      : '0';
    
    const avgHumidity = sensorHistory?.length > 0 
      ? (sensorHistory.reduce((sum, d) => sum + (d.humidity || 0), 0) / sensorHistory.length).toFixed(1)
      : '0';

    return {
      avgTemp,
      avgHumidity,
      avgCpuLab1: isPcLab1Connected ? avgCpuLab1.toString() : '0',
      maxCpuTemp: metrics?.maxTemp ? metrics.maxTemp.toFixed(1) : '0'
    };
  }, [sensorHistory, isPcLab1Connected, avgCpuLab1, metrics]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 mt-8">
      <MetricCard
        title="Average Temp"
        value={calculatedMetrics.avgTemp + '°C'}
        status="Temp"
        statusColor="orange"
        icon={Thermometer}
        iconColor="orange"
      />
      <MetricCard
        title="Average Humidity"
        value={calculatedMetrics.avgHumidity + '%'}
        status="Humidity"
        statusColor="blue"
        icon={Droplet}
        iconColor="blue"
      />
      <MetricCard
        title="Average CPU Lab 1"
        value={calculatedMetrics.avgCpuLab1 + '°C'}
        status="CPU Temp"
        statusColor="green"
        icon={Monitor}
        iconColor="green"
      />
      <MetricCard
        title="Max Temperature CPU"
        value={calculatedMetrics.maxCpuTemp + '°C'}
        status="CPU Max"
        statusColor="red"
        icon={AlertTriangle}
        iconColor="red"
      />
    </div>
  );
}

function HomeContent() {
  const { cpuData } = useAIDA64();

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-x-hidden overflow-y-auto">
          <div className="p-6">
            <DashboardGreeting />
            <DashboardMetrics />
            <div className="bg-background">
              <CPUMonitoringTable cpuData={cpuData} />
              <Footer />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <PcLab1Provider>
      <SensorProvider>
        <HomeContent />
      </SensorProvider>
    </PcLab1Provider>
  );
}