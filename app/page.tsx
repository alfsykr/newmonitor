"use client";

import { useState, useEffect, useRef, useMemo } from 'react';
import { Sidebar } from '@/components/sidebar';
import { Header } from '@/components/header';
import { MetricCard } from '@/components/metric-card';
import { TemperatureChart } from '@/components/temperature-chart';
import { TemperatureScale } from '@/components/temperature-scale';
import { CPUMonitoringTable } from '@/components/cpu-monitoring-table';
import { Footer } from '@/components/footer';
import { useAIDA64 } from '@/lib/aida64-context';
import { useModbus } from '@/lib/modbus-context';
import { SensorProvider, useSensor } from '@/lib/firebase-sensor-context';
import { 
  Cpu, 
  Thermometer, 
  Monitor, 
  AlertTriangle,
  Home as HomeIcon,
  Droplet
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import Image from 'next/image';
import { PcLab1Provider, usePcLab1 } from '@/lib/pc-lab1-context';

// Custom hook for scroll reveal
function useScrollReveal(threshold = 0.15) {
  const ref = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new window.IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [threshold]);

  return [ref, isVisible] as const;
}

function DashboardGreetingAndDate() {
  const [mounted, setMounted] = useState(false);
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    setMounted(true);
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);
  if (!mounted) return (
    <>
      <span className="text-4xl font-bold text-white drop-shadow-lg h-12">&nbsp;</span>
      <div className="flex flex-col items-end text-white text-right mt-2 h-16">&nbsp;</div>
    </>
  );
  const hours = now.getHours();
  let greeting = "";
  if (hours < 5) greeting = "Good Night!";
  else if (hours < 12) greeting = "Good Morning!";
  else if (hours < 18) greeting = "Good Afternoon!";
  else greeting = "Good Evening!";
  const day = now.toLocaleDateString('en-US', { weekday: 'long' });
  const time = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
  const date = now.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  return (
    <>
      <span className="text-4xl font-bold text-white drop-shadow-lg">{greeting}</span>
      <div className="flex flex-col items-end text-white text-right mt-2">
        <span className="text-lg font-semibold">{day}</span>
        <span className="text-xl font-bold">{time}</span>
        <span className="text-base">{date}</span>
      </div>
    </>
  );
}

function DashboardLogo() {
  // Placeholder logo, bisa diganti file logo asli
  return (
    <div className="absolute top-6 left-8 z-20 flex items-center gap-2">
      <HomeIcon className="w-8 h-8 text-white drop-shadow-lg" />
      <span className="text-xl font-bold text-white drop-shadow-lg">Lab Room Monitoring</span>
    </div>
  );
}

function DashboardTop() {
  const { metrics } = useAIDA64();
  const { sensorData, isSensorConnected } = useSensor();

  return (
    <div className="relative w-full min-h-[480px] rounded-2xl overflow-hidden flex flex-col items-center justify-center">
      {/* Background image + gradient overlay */}
      <div className="absolute inset-0 z-0">
        <img
          src="/lab-bg.jpg"
          alt="Lab Background"
          className="w-full h-full object-cover absolute inset-0 z-0"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-blue-800 via-blue-600 to-blue-400 opacity-80" />
        <div className="absolute inset-0 bg-blue-900/40" />
      </div>
      {/* Main content dengan z-index lebih tinggi */}
      <div className="relative z-10 flex flex-row w-full max-w-4xl justify-between items-center mt-8 px-8">
        {/* Left: Average CPU Temp */}
        <div className="flex flex-col items-center text-white">
          <Thermometer className="w-8 h-8 mb-2 opacity-80" strokeWidth={2.2} />
          <span className="text-4xl font-extrabold drop-shadow-md tracking-tight">
            {metrics.avgTemp ? metrics.avgTemp.toFixed(1) : "-"}
            <span className="text-xl align-top">°C</span>
          </span>
          <span className="mt-1 text-base font-semibold tracking-wide opacity-80">AVERAGE CPU TEMP</span>
        </div>
        {/* Center: Inside Temp Circle */}
        <div className="flex flex-col items-center">
          <div className="relative flex items-center justify-center" style={{ width: 220, height: 220 }}>
            <svg width="220" height="220">
              <defs>
                <linearGradient id="tempGradient" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#6EE7B7" />
                  <stop offset="100%" stopColor="#3B82F6" />
                </linearGradient>
              </defs>
              <circle cx="110" cy="110" r="100" stroke="#e5e7eb" strokeWidth="4" fill="none" opacity="0.3" />
              <circle cx="110" cy="110" r="100" stroke="url(#tempGradient)" strokeWidth="6" fill="none" />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <HomeIcon className="w-8 h-8 text-white mb-2 opacity-90 drop-shadow" strokeWidth={2.2} />
              <span className="text-6xl font-extrabold text-white drop-shadow-md tracking-tight mb-1" style={{letterSpacing: '-2px'}}>
                {sensorData?.temperature ? sensorData.temperature.toFixed(1) : "-"}
                <span className="text-2xl align-top">°C</span>
              </span>
              <span className="text-lg font-semibold text-white tracking-wide opacity-90 mt-1">INSIDE TEMP</span>
            </div>
          </div>
        </div>
        {/* Right: Humidity */}
        <div className="flex flex-col items-center text-white">
          <Droplet className="w-8 h-8 mb-2 opacity-80" strokeWidth={2.2} />
          <span className="text-4xl font-extrabold drop-shadow-md tracking-tight">
            {sensorData?.humidity ? sensorData.humidity.toFixed(1) : "-"}
            <span className="text-xl align-top">%</span>
          </span>
          <span className="mt-1 text-base font-semibold tracking-wide opacity-80">HUMIDITY</span>
        </div>
      </div>
    </div>
  );
}

function DashboardCustomCards() {
  const { sensorHistory, isSensorConnected } = useSensor();
  const { avgSuhu: avgCpuLab1, isConnected: isPcLab1Connected } = usePcLab1();
  // Calculate average temp/humidity from sensorHistory (last 100), memoized
  const avgTemp = useMemo(() => {
    if (!sensorHistory || sensorHistory.length === 0) return '-';
    return (sensorHistory.reduce((sum, d) => sum + d.temperature, 0) / sensorHistory.length).toFixed(1);
  }, [sensorHistory]);
  const avgHumidity = useMemo(() => {
    if (!sensorHistory || sensorHistory.length === 0) return '-';
    return (sensorHistory.reduce((sum, d) => sum + d.humidity, 0) / sensorHistory.length).toFixed(1);
  }, [sensorHistory]);
  // Max CPU Temp from AIDA64
  const { metrics } = useAIDA64();
  const maxCpuTemp = metrics?.maxTemp ? metrics.maxTemp.toFixed(1) : '-';
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 mt-8">
      <MetricCard
        title="Average Temp"
        value={avgTemp + '°C'}
        status="Temp"
        statusColor="orange"
        icon={Thermometer}
        iconColor="orange"
      />
      <MetricCard
        title="Average Humidity"
        value={avgHumidity + '%'}
        status="Humidity"
        statusColor="blue"
        icon={Droplet}
        iconColor="blue"
      />
      <MetricCard
        title="Average CPU Lab 1"
        value={isPcLab1Connected ? avgCpuLab1 + '°C' : '-'}
        status="CPU Temp"
        statusColor="green"
        icon={Monitor}
        iconColor="green"
      />
      <MetricCard
        title="Max Temperature CPU"
        value={maxCpuTemp + '°C'}
        status="CPU Max"
        statusColor="red"
        icon={AlertTriangle}
        iconColor="red"
      />
    </div>
  );
}

function HomeContent() {
  const { cpuData, metrics, isConnected } = useAIDA64();
  const { sensorData, isSensorConnected } = useSensor();
  const [localMetrics, setLocalMetrics] = useState({
    cpuCount: 7,
    roomTemp: 24.5,
    totalComputers: 1,
    maxCpuTemp: 78.2,
  });

  // Update local metrics based on AIDA64 data
  useEffect(() => {
    if (cpuData.length > 0) {
      // Get CPU temperatures (exclude HDD)
      const cpuTemps = cpuData.filter(cpu => !cpu.name.includes('HDD')).map(cpu => cpu.temperature);
      const maxCpuTemp = Math.max(...cpuTemps);
      setLocalMetrics(prev => ({
        ...prev,
        cpuCount: cpuData.length,
        maxCpuTemp: maxCpuTemp,
      }));
    }
  }, [cpuData]);

  // Update room temperature from sensor Firebase
  useEffect(() => {
    if (isSensorConnected && sensorData) {
      setLocalMetrics(prev => ({
        ...prev,
        roomTemp: sensorData.temperature,
      }));
    }
  }, [isSensorConnected, sensorData]);

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        {/* Hapus bg-background dari main, biarkan DashboardTop yang mengatur */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key="home-page"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -24 }}
              transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
            >
              <div className="p-6">
                {/* Dashboard Top Section */}
                <DashboardTop />
                {/* Custom Metrics Cards */}
                <DashboardCustomCards />
                {/* Rest of content dengan background yang sesuai tema */}
                <div className="bg-background">
                  {/* Charts and Tables */}
                  {/* REMOVE: TemperatureChart and TemperatureScale section */}
                  {/* CPU Monitoring Table */}
                  {(() => {
                    const [ref, isVisible] = useScrollReveal();
                    return (
                      <motion.div
                        ref={ref}
                        initial={{ opacity: 0, y: 40 }}
                        animate={isVisible ? { opacity: 1, y: 0 } : {}}
                        transition={{ duration: 0.7, delay: 0.3, ease: [0.4, 0, 0.2, 1] }}
                      >
                        <div className="grid grid-cols-1 gap-6">
                          <CPUMonitoringTable cpuData={cpuData} />
                        </div>
                      </motion.div>
                    );
                  })()}
                  <Footer />
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
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