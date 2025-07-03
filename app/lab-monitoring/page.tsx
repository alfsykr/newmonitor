"use client";

import { useState, useEffect, useRef } from 'react';
import { Sidebar } from '@/components/sidebar';
import { Header } from '@/components/header';
import { MetricCard } from '@/components/metric-card';
import { Footer } from '@/components/footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Area, AreaChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
import { Thermometer, Droplets, Wind, Gauge } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useSensor, SensorProvider } from '@/lib/firebase-sensor-context';
import { PcLab1Provider, usePcLab1 } from '@/lib/pc-lab1-context';

function isTenMinuteMark(timeStr: string) {
  if (!timeStr) return false;
  const parts = timeStr.split(":");
  if (parts.length < 2) return false;
  const minute = parseInt(parts[1], 10);
  return [0, 10, 20, 30, 40, 50].includes(minute);
}

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

function LabMonitoringContent() {
  const { sensorData, sensorHistory, isSensorConnected } = useSensor();
  const [chartData, setChartData] = useState<any[]>([]);
  const [monitoringData, setMonitoringData] = useState<any[]>([]);
  const [metrics, setMetrics] = useState({
    currentTemp: 0,
    currentHumidity: 0
  });
  // Tabel utama hanya 10 data terbaru
  const pagedMonitoringData = monitoringData.slice(0, 10);
  // Modal state
  const [showAllModal, setShowAllModal] = useState(false);
  const [allPage, setAllPage] = useState(1);
  const pageSize = 10;

  // Add PcLab1 context
  const { avgSuhu: avgCpuLab1, isConnected: isPcLab1Connected } = usePcLab1();
  // Calculate average temperature and humidity from monitoringData
  const avgTemp = monitoringData.length > 0 ? (monitoringData.reduce((sum, d) => sum + d.temperature, 0) / monitoringData.length).toFixed(1) : '-';
  const avgHumidity = monitoringData.length > 0 ? (monitoringData.reduce((sum, d) => sum + d.humidity, 0) / monitoringData.length).toFixed(1) : '-';
  // Placeholder for Max CPU Temp (AIDA64)
  const maxCpuTemp = '-'; // TODO: Replace with actual value from AIDA64 context

  // Chart/table generator dari sensorHistory
  const generateSensorChartData = () => {
    if (sensorHistory && sensorHistory.length > 0) {
      return sensorHistory.filter(item =>
        isTenMinuteMark(item.time) &&
        typeof item.temperature === 'number' &&
        typeof item.humidity === 'number' &&
        isFinite(item.temperature) &&
        isFinite(item.humidity) &&
        !isNaN(item.temperature) &&
        !isNaN(item.humidity) &&
        item.temperature > -50 && item.temperature < 100 &&
        item.humidity >= 0 && item.humidity <= 100
      ).map((item) => ({
        time: item.time,
        temperature: item.temperature,
        humidity: item.humidity,
      }));
    }
    return [];
  };
  const generateSensorMonitoringTable = () => {
    if (sensorHistory && sensorHistory.length > 0) {
      return sensorHistory.filter(item =>
        isTenMinuteMark(item.time) &&
        typeof item.temperature === 'number' &&
        typeof item.humidity === 'number' &&
        isFinite(item.temperature) &&
        isFinite(item.humidity) &&
        !isNaN(item.temperature) &&
        !isNaN(item.humidity) &&
        item.temperature > -50 && item.temperature < 100 &&
        item.humidity >= 0 && item.humidity <= 100
      ).map((item, idx) => ({
        id: idx,
        time: item.time,
        temperature: item.temperature,
        humidity: item.humidity,
        acAction: item.temperature > 25 ? 'AC ON - Cooling' : 'AC OFF - Standby',
        status: item.temperature > 26 ? 'Warning' : item.temperature > 25 ? 'Caution' : 'Normal',
      })).reverse();
    }
    return [];
  };

  // Update metrics, chart, dan table setiap data sensor berubah
  useEffect(() => {
    if (isSensorConnected && sensorData) {
      setMetrics({
        currentTemp: sensorData.temperature,
        currentHumidity: sensorData.humidity
      });
      setChartData(generateSensorChartData());
      setMonitoringData(generateSensorMonitoringTable());
    }
  }, [sensorData, sensorHistory, isSensorConnected]);

  // Modal pagination
  // Only use last 100 data for modal pagination (data terbaru di atas)
  const modalData = monitoringData.slice(0, 100);
  const allTotalPages = Math.ceil(modalData.length / pageSize);
  const allPagedData = modalData.slice((allPage - 1) * pageSize, allPage * pageSize);
  // Always show 10 pagination buttons (1-10)
  const pageNumbers = Array.from({ length: 10 }, (_, i) => i + 1);
  // Reset page saat modal dibuka
  useEffect(() => { setAllPage(1); }, [showAllModal]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Normal': return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'Caution': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'Warning': return 'bg-red-500/10 text-red-500 border-red-500/20';
      default: return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    }
  };

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-background">
          <AnimatePresence mode="wait">
            <motion.div
              key="lab-monitoring-page"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -24 }}
              transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
            >
              <div className="p-6">
                {/* Page Title */}
                {(() => {
                  const [ref, isVisible] = useScrollReveal();
                  return (
                    <motion.div
                      ref={ref}
                      initial={{ opacity: 0, y: 40 }}
                      animate={isVisible ? { opacity: 1, y: 0 } : {}}
                      transition={{ duration: 0.7, ease: [0.4, 0, 0.2, 1] }}
                      className="mb-8"
                    >
                      <h1 className="text-3xl font-bold tracking-tight">Temperature Monitoring</h1>
                      <p className="text-muted-foreground mt-2">
                        Real-time monitoring of laboratory environment using ESP32 (Firebase)
                      </p>
                    </motion.div>
                  );
                })()}
                {/* Metrics Cards */}
                {(() => {
                  const [ref, isVisible] = useScrollReveal();
                  return (
                    <motion.div
                      ref={ref}
                      initial={{ opacity: 0, y: 40 }}
                      animate={isVisible ? { opacity: 1, y: 0 } : {}}
                      transition={{ duration: 0.7, delay: 0.1, ease: [0.4, 0, 0.2, 1] }}
                      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 mb-8"
                    >
                      <MetricCard
                        title="Current Temperature"
                        value={`${metrics.currentTemp}°C`}
                        status={isSensorConnected ? 'Connected to Firebase' : 'Disconnected'}
                        statusColor={isSensorConnected ? 'green' : 'orange'}
                        icon={Thermometer}
                        iconColor="orange"
                      />
                      <MetricCard
                        title="Current Humidity"
                        value={`${metrics.currentHumidity}%`}
                        status={isSensorConnected ? 'Connected to Firebase' : 'Disconnected'}
                        statusColor={isSensorConnected ? 'green' : 'blue'}
                        icon={Droplets}
                        iconColor="blue"
                      />
                    </motion.div>
                  );
                })()}
                {/* 1-Minute Monitoring Table */}
                {(() => {
                  const [ref, isVisible] = useScrollReveal();
                  return (
                    <motion.div
                      ref={ref}
                      initial={{ opacity: 0, y: 40 }}
                      animate={isVisible ? { opacity: 1, y: 0 } : {}}
                      transition={{ duration: 0.7, delay: 0.3, ease: [0.4, 0, 0.2, 1] }}
                    >
                      <Card className="border-0 bg-card/50 backdrop-blur-sm mb-8">
                        <CardHeader>
                          <CardTitle className="text-lg font-semibold flex items-center justify-between">
                            Lab Environment Monitoring (10-Minute Intervals)
                            {isSensorConnected && (
                              <Badge variant="default" className="bg-green-500/10 text-green-500 border-green-500/20">
                                Real-time Data
                              </Badge>
                            )}
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead className="w-[100px]">Time</TableHead>
                                <TableHead>Temperature (°C)</TableHead>
                                <TableHead>Humidity (%)</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>AC Action</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {pagedMonitoringData.length === 0 ? (
                                <TableRow>
                                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                                    No data available
                                  </TableCell>
                                </TableRow>
                              ) : (
                                pagedMonitoringData.map((record) => (
                                  <TableRow key={record.id}>
                                    <TableCell className="font-mono">{record.time}</TableCell>
                                    <TableCell className="font-mono">{record.temperature}°C</TableCell>
                                    <TableCell className="font-mono">{record.humidity}%</TableCell>
                                    <TableCell>
                                      <Badge 
                                        variant="secondary" 
                                        className={`text-xs ${getStatusColor(record.status)}`}
                                      >
                                        {record.status}
                                      </Badge>
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">{record.acAction}</TableCell>
                                  </TableRow>
                                ))
                              )}
                            </TableBody>
                          </Table>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })()}
                {/* Footer */}
                <Footer />
              </div>
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}

export default function LabMonitoringPage() {
  return (
    <PcLab1Provider>
      <SensorProvider>
        <LabMonitoringContent />
      </SensorProvider>
    </PcLab1Provider>
  );
}