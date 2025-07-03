"use client";

import { useState, useEffect, useRef } from 'react';
import { Sidebar } from '@/components/sidebar';
import { Header } from '@/components/header';
import { MetricCard } from '@/components/metric-card';
import { Footer } from '@/components/footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, LineChart, Line, XAxis, YAxis, CartesianGrid, Area, AreaChart } from 'recharts';
import { Thermometer, Droplets, Wind, Gauge, TrendingUp, Activity } from 'lucide-react';
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

// Temperature status colors
const getTemperatureColor = (temp: number) => {
  if (temp < 20) return '#3B82F6'; // Blue - Cold
  if (temp < 25) return '#10B981'; // Green - Normal
  if (temp < 30) return '#F59E0B'; // Yellow - Warm
  return '#EF4444'; // Red - Hot
};

// Humidity status colors
const getHumidityColor = (humidity: number) => {
  if (humidity < 30) return '#EF4444'; // Red - Too dry
  if (humidity < 60) return '#10B981'; // Green - Normal
  if (humidity < 80) return '#F59E0B'; // Yellow - High
  return '#3B82F6'; // Blue - Very high
};

function LabMonitoringContent() {
  const { sensorData, sensorHistory, isSensorConnected } = useSensor();
  const [chartData, setChartData] = useState<any[]>([]);
  const [monitoringData, setMonitoringData] = useState<any[]>([]);
  const [metrics, setMetrics] = useState({
    currentTemp: 0,
    currentHumidity: 0
  });

  // Move all useScrollReveal calls to the top level
  const [pageTitleRef, isPageTitleVisible] = useScrollReveal();
  const [metricsCardsRef, isMetricsCardsVisible] = useScrollReveal();
  const [donutChartsRef, isDonutChartsVisible] = useScrollReveal();
  const [lineChartRef, isLineChartVisible] = useScrollReveal();
  const [monitoringTableRef, isMonitoringTableVisible] = useScrollReveal();

  // Tabel utama hanya 10 data terbaru
  const pagedMonitoringData = monitoringData.slice(0, 10);

  // Add PcLab1 context
  const { avgSuhu: avgCpuLab1, isConnected: isPcLab1Connected } = usePcLab1();
  
  // Calculate average temperature and humidity from monitoringData
  const avgTemp = monitoringData.length > 0 ? (monitoringData.reduce((sum, d) => sum + d.temperature, 0) / monitoringData.length).toFixed(1) : '-';
  const avgHumidity = monitoringData.length > 0 ? (monitoringData.reduce((sum, d) => sum + d.humidity, 0) / monitoringData.length).toFixed(1) : '-';

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Normal': return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'Caution': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'Warning': return 'bg-red-500/10 text-red-500 border-red-500/20';
      default: return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    }
  };

  // Prepare donut chart data
  const temperatureDonutData = [
    {
      name: 'Current',
      value: metrics.currentTemp,
      color: getTemperatureColor(metrics.currentTemp)
    },
    {
      name: 'Remaining',
      value: Math.max(0, 50 - metrics.currentTemp),
      color: '#E5E7EB'
    }
  ];

  const humidityDonutData = [
    {
      name: 'Current',
      value: metrics.currentHumidity,
      color: getHumidityColor(metrics.currentHumidity)
    },
    {
      name: 'Remaining',
      value: Math.max(0, 100 - metrics.currentHumidity),
      color: '#E5E7EB'
    }
  ];

  // Custom label for donut charts
  const renderCustomLabel = (entry: any, value: number, unit: string) => {
    return (
      <text
        x="50%"
        y="50%"
        textAnchor="middle"
        dominantBaseline="middle"
        className="fill-current text-2xl font-bold"
      >
        <tspan x="50%" dy="-0.3em" className="text-3xl font-bold">
          {value.toFixed(1)}
        </tspan>
        <tspan x="50%" dy="1.2em" className="text-lg">
          {unit}
        </tspan>
      </text>
    );
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
                <motion.div
                  ref={pageTitleRef}
                  initial={{ opacity: 0, y: 40 }}
                  animate={isPageTitleVisible ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.7, ease: [0.4, 0, 0.2, 1] }}
                  className="mb-8"
                >
                  <h1 className="text-3xl font-bold tracking-tight">Temperature Monitoring</h1>
                  <p className="text-muted-foreground mt-2">
                    Real-time monitoring of laboratory environment using ESP32 (Firebase)
                  </p>
                </motion.div>

                {/* Metrics Cards */}
                <motion.div
                  ref={metricsCardsRef}
                  initial={{ opacity: 0, y: 40 }}
                  animate={isMetricsCardsVisible ? { opacity: 1, y: 0 } : {}}
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

                {/* Donut Charts Section */}
                <motion.div
                  ref={donutChartsRef}
                  initial={{ opacity: 0, y: 40 }}
                  animate={isDonutChartsVisible ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.7, delay: 0.2, ease: [0.4, 0, 0.2, 1] }}
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
                >
                  {/* Temperature Donut Chart */}
                  <Card className="border-0 bg-card/50 backdrop-blur-sm">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg font-semibold flex items-center gap-2">
                        <Thermometer className="w-5 h-5 text-orange-500" />
                        Temperature
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-48 relative">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={temperatureDonutData}
                              cx="50%"
                              cy="50%"
                              innerRadius={60}
                              outerRadius={80}
                              startAngle={90}
                              endAngle={450}
                              dataKey="value"
                              stroke="none"
                            >
                              {temperatureDonutData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                          </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="text-center">
                            <div className="text-3xl font-bold text-foreground">
                              {metrics.currentTemp.toFixed(1)}
                            </div>
                            <div className="text-lg text-muted-foreground">°C</div>
                          </div>
                        </div>
                      </div>
                      <div className="mt-4 text-center">
                        <Badge 
                          variant="secondary" 
                          className={`text-xs ${
                            metrics.currentTemp > 30 ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                            metrics.currentTemp > 25 ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' :
                            'bg-green-500/10 text-green-500 border-green-500/20'
                          }`}
                        >
                          {metrics.currentTemp > 30 ? 'Hot' : 
                           metrics.currentTemp > 25 ? 'Warm' : 'Normal'}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Humidity Donut Chart */}
                  <Card className="border-0 bg-card/50 backdrop-blur-sm">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg font-semibold flex items-center gap-2">
                        <Droplets className="w-5 h-5 text-blue-500" />
                        Humidity
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-48 relative">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={humidityDonutData}
                              cx="50%"
                              cy="50%"
                              innerRadius={60}
                              outerRadius={80}
                              startAngle={90}
                              endAngle={450}
                              dataKey="value"
                              stroke="none"
                            >
                              {humidityDonutData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                          </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="text-center">
                            <div className="text-3xl font-bold text-foreground">
                              {metrics.currentHumidity.toFixed(1)}
                            </div>
                            <div className="text-lg text-muted-foreground">%</div>
                          </div>
                        </div>
                      </div>
                      <div className="mt-4 text-center">
                        <Badge 
                          variant="secondary" 
                          className={`text-xs ${
                            metrics.currentHumidity > 80 ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' :
                            metrics.currentHumidity > 60 ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' :
                            metrics.currentHumidity < 30 ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                            'bg-green-500/10 text-green-500 border-green-500/20'
                          }`}
                        >
                          {metrics.currentHumidity > 80 ? 'Very High' : 
                           metrics.currentHumidity > 60 ? 'High' : 
                           metrics.currentHumidity < 30 ? 'Low' : 'Normal'}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Average Temperature Card */}
                  <Card className="border-0 bg-card/50 backdrop-blur-sm">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg font-semibold flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-green-500" />
                        Avg Temperature
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-center">
                        <div className="text-4xl font-bold text-foreground mb-2">
                          {avgTemp}°C
                        </div>
                        <div className="text-sm text-muted-foreground mb-4">
                          Based on {monitoringData.length} readings
                        </div>
                        <Badge variant="secondary" className="bg-green-500/10 text-green-500 border-green-500/20">
                          Historical Average
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Average Humidity Card */}
                  <Card className="border-0 bg-card/50 backdrop-blur-sm">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg font-semibold flex items-center gap-2">
                        <Activity className="w-5 h-5 text-blue-500" />
                        Avg Humidity
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-center">
                        <div className="text-4xl font-bold text-foreground mb-2">
                          {avgHumidity}%
                        </div>
                        <div className="text-sm text-muted-foreground mb-4">
                          Based on {monitoringData.length} readings
                        </div>
                        <Badge variant="secondary" className="bg-blue-500/10 text-blue-500 border-blue-500/20">
                          Historical Average
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>

                {/* Line Chart for Historical Data */}
                {chartData.length > 0 && (
                  <motion.div
                    ref={lineChartRef}
                    initial={{ opacity: 0, y: 40 }}
                    animate={isLineChartVisible ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.7, delay: 0.3, ease: [0.4, 0, 0.2, 1] }}
                    className="mb-8"
                  >
                    <Card className="border-0 bg-card/50 backdrop-blur-sm">
                      <CardHeader>
                        <CardTitle className="text-lg font-semibold">Historical Data Trends</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="h-80">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                              <XAxis 
                                dataKey="time" 
                                axisLine={false}
                                tickLine={false}
                                className="text-xs fill-muted-foreground"
                              />
                              <YAxis 
                                axisLine={false}
                                tickLine={false}
                                className="text-xs fill-muted-foreground"
                              />
                              <Tooltip 
                                contentStyle={{
                                  backgroundColor: 'hsl(var(--card))',
                                  border: '1px solid hsl(var(--border))',
                                  borderRadius: '8px',
                                  fontSize: '12px',
                                }}
                                labelStyle={{ color: 'hsl(var(--foreground))' }}
                              />
                              <Line
                                type="monotone"
                                dataKey="temperature"
                                stroke="#F97316"
                                strokeWidth={3}
                                dot={{ fill: '#F97316', strokeWidth: 2, r: 4 }}
                                name="Temperature (°C)"
                              />
                              <Line
                                type="monotone"
                                dataKey="humidity"
                                stroke="#3B82F6"
                                strokeWidth={3}
                                dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
                                name="Humidity (%)"
                              />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}

                {/* 1-Minute Monitoring Table */}
                <motion.div
                  ref={monitoringTableRef}
                  initial={{ opacity: 0, y: 40 }}
                  animate={isMonitoringTableVisible ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.7, delay: 0.4, ease: [0.4, 0, 0.2, 1] }}
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