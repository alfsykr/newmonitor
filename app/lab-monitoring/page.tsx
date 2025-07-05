"use client";

import { useState, useEffect, useRef } from 'react';
import { Sidebar } from '@/components/sidebar';
import { Header } from '@/components/header';
import { MetricCard } from '@/components/metric-card';
import { Footer } from '@/components/footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, Area, AreaChart } from 'recharts';
import { Thermometer, Droplets } from 'lucide-react';
import { useSensor, SensorProvider } from '@/lib/firebase-sensor-context';
import { PcLab1Provider } from '@/lib/pc-lab1-context';

function isTenMinuteMark(timeStr: string) {
  if (!timeStr) return false;
  const parts = timeStr.split(":");
  if (parts.length < 2) return false;
  const minute = parseInt(parts[1], 10);
  return [0, 10, 20, 30, 40, 50].includes(minute);
}

function LabMonitoringContent() {
  const { sensorData, sensorHistory, isSensorConnected } = useSensor();
  const [chartData, setChartData] = useState<any[]>([]);
  const [monitoringData, setMonitoringData] = useState<any[]>([]);

  // Generate chart data from sensor history
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

  // Generate monitoring table data
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
      })).reverse().slice(0, 10); // Only show last 10 records
    }
    return [];
  };

  // Update data when sensor data changes
  useEffect(() => {
    if (isSensorConnected && sensorData) {
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

  // Prepare data for individual charts (last 10 readings)
  const temperatureChartData = chartData.slice(-10).map(item => ({
    time: item.time,
    value: item.temperature
  }));

  const humidityChartData = chartData.slice(-10).map(item => ({
    time: item.time,
    value: item.humidity
  }));

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-background">
          <div className="p-6">
            {/* Page Title */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold tracking-tight">Temperature Monitoring</h1>
              <p className="text-muted-foreground mt-2">
                Real-time monitoring of laboratory environment using ESP32 (Firebase)
              </p>
            </div>

            {/* Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <MetricCard
                title="Current Temperature"
                value={`${sensorData?.temperature || 0}°C`}
                status={isSensorConnected ? 'Connected to Firebase' : 'Disconnected'}
                statusColor={isSensorConnected ? 'green' : 'orange'}
                icon={Thermometer}
                iconColor="orange"
              />
              <MetricCard
                title="Current Humidity"
                value={`${sensorData?.humidity || 0}%`}
                status={isSensorConnected ? 'Connected to Firebase' : 'Disconnected'}
                statusColor={isSensorConnected ? 'green' : 'blue'}
                icon={Droplets}
                iconColor="blue"
              />
            </div>

            {/* Individual Charts */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              {/* Temperature Chart */}
              <Card className="border-0 bg-card/50 backdrop-blur-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="text-xl font-semibold flex items-center gap-2">
                    <Thermometer className="w-6 h-6 text-orange-500" />
                    Temperature
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={temperatureChartData}>
                        <defs>
                          <linearGradient id="temperatureGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#F97316" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#F97316" stopOpacity={0.1}/>
                          </linearGradient>
                        </defs>
                        <XAxis 
                          dataKey="time" 
                          axisLine={false}
                          tickLine={false}
                          className="text-sm fill-muted-foreground"
                        />
                        <YAxis 
                          axisLine={false}
                          tickLine={false}
                          className="text-sm fill-muted-foreground"
                        />
                        <Tooltip 
                          contentStyle={{
                            backgroundColor: 'hsl(var(--card))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px',
                            fontSize: '14px',
                          }}
                          labelStyle={{ color: 'hsl(var(--foreground))' }}
                        />
                        <Area
                          type="monotone"
                          dataKey="value"
                          stroke="#F97316"
                          fill="url(#temperatureGradient)"
                          strokeWidth={3}
                          name="Temperature (°C)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="mt-6 text-center">
                    <div className="text-3xl font-bold text-foreground">
                      {sensorData?.temperature?.toFixed(1) || '0.0'}°C
                    </div>
                    <Badge 
                      variant="secondary" 
                      className={`text-sm mt-3 px-4 py-1 ${
                        (sensorData?.temperature || 0) > 30 ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                        (sensorData?.temperature || 0) > 25 ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' :
                        'bg-green-500/10 text-green-500 border-green-500/20'
                      }`}
                    >
                      {(sensorData?.temperature || 0) > 30 ? 'Hot' : 
                       (sensorData?.temperature || 0) > 25 ? 'Warm' : 'Normal'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Humidity Chart */}
              <Card className="border-0 bg-card/50 backdrop-blur-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="text-xl font-semibold flex items-center gap-2">
                    <Droplets className="w-6 h-6 text-blue-500" />
                    Humidity
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={humidityChartData}>
                        <defs>
                          <linearGradient id="humidityGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.1}/>
                          </linearGradient>
                        </defs>
                        <XAxis 
                          dataKey="time" 
                          axisLine={false}
                          tickLine={false}
                          className="text-sm fill-muted-foreground"
                        />
                        <YAxis 
                          axisLine={false}
                          tickLine={false}
                          className="text-sm fill-muted-foreground"
                        />
                        <Tooltip 
                          contentStyle={{
                            backgroundColor: 'hsl(var(--card))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px',
                            fontSize: '14px',
                          }}
                          labelStyle={{ color: 'hsl(var(--foreground))' }}
                        />
                        <Area
                          type="monotone"
                          dataKey="value"
                          stroke="#3B82F6"
                          fill="url(#humidityGradient)"
                          strokeWidth={3}
                          name="Humidity (%)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="mt-6 text-center">
                    <div className="text-3xl font-bold text-foreground">
                      {sensorData?.humidity?.toFixed(1) || '0.0'}%
                    </div>
                    <Badge 
                      variant="secondary" 
                      className={`text-sm mt-3 px-4 py-1 ${
                        (sensorData?.humidity || 0) > 80 ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' :
                        (sensorData?.humidity || 0) > 60 ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' :
                        (sensorData?.humidity || 0) < 30 ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                        'bg-green-500/10 text-green-500 border-green-500/20'
                      }`}
                    >
                      {(sensorData?.humidity || 0) > 80 ? 'Very High' : 
                       (sensorData?.humidity || 0) > 60 ? 'High' : 
                       (sensorData?.humidity || 0) < 30 ? 'Low' : 'Normal'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Monitoring Table */}
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
                    {monitoringData.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground">
                          No data available
                        </TableCell>
                      </TableRow>
                    ) : (
                      monitoringData.map((record) => (
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

            <Footer />
          </div>
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