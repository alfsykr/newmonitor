"use client";

import { useEffect, useState, useRef } from "react";
import { Sidebar } from "@/components/sidebar";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Power, Zap, Activity, TrendingUp, Percent } from "lucide-react";
import { ChartContainer } from "@/components/ui/chart";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, Legend, CartesianGrid, Area, AreaChart } from "recharts";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AnimatePresence, motion } from 'framer-motion';

// Dummy data generator
const generateReading = () => {
  const now = new Date();
  return {
    timestamp: now.toLocaleString("id-ID", { hour12: false }),
    voltage: (210 + Math.random() * 20).toFixed(2),
    current: (2 + Math.random() * 7).toFixed(2),
    power: (800 + Math.random() * 400).toFixed(2),
    energy: (150 + Math.random() * 60).toFixed(2),
    cosphi: (0.8 + Math.random() * 0.2).toFixed(3),
    status: "NORMAL",
  };
};

// Fungsi generate data monitoring PZEM mirip lab monitoring, interval 5 menit
const generatePZEMMonitoringTable = () => {
  const data = [];
  const now = new Date();
  for (let i = 11; i >= 0; i--) {
    const time = new Date(now.getTime() - i * 5 * 60 * 1000);
    const timeStr = time.toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
    // Simulasi variasi data
    const voltage = Math.round((220 + (Math.random() - 0.5) * 20) * 100) / 100;
    const current = Math.round((4 + (Math.random() - 0.5) * 4) * 100) / 100;
    const power = Math.round((voltage * current) * 100) / 100;
    const energy = Math.round((150 + Math.random() * 60) * 100) / 100;
    const cosphi = Math.round((0.85 + (Math.random() - 0.5) * 0.2) * 1000) / 1000;
    let status = "Normal";
    if (current > 7.5) status = "Warning";
    else if (current > 6) status = "Caution";
    data.push({
      id: i,
      time: timeStr,
      voltage,
      current,
      power,
      energy,
      cosphi,
      status,
    });
  }
  return data.reverse();
};

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

export default function PZEMMonitoringPage() {
  const [readings, setReadings] = useState(() => {
    // Inisialisasi 8 data awal
    const arr = [];
    for (let i = 0; i < 8; i++) arr.push(generateReading());
    return arr;
  });

  const [monitoringData, setMonitoringData] = useState(() => generatePZEMMonitoringTable());

  // Update setiap 1 menit (dummy)
  useEffect(() => {
    const interval = setInterval(() => {
      setReadings((prev) => [generateReading(), ...prev.slice(0, 7)]);
    }, 60000); // 1 menit
    return () => clearInterval(interval);
  }, []);

  // Update setiap 5 menit (simulasi)
  useEffect(() => {
    const interval = setInterval(() => {
      setMonitoringData(generatePZEMMonitoringTable());
    }, 300000); // 5 menit
    return () => clearInterval(interval);
  }, []);

  // Untuk grafik dummy
  const chartData = readings.slice().reverse().map((r, i) => ({
    name: `T-${7 - i}`,
    Tegangan: Number(r.voltage),
    Arus: Number(r.current),
    Daya: Number(r.power),
    "Cos φ": Number(r.cosphi),
  }));

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-background">
          <AnimatePresence mode="wait">
            <motion.div
              key="pzem-monitoring-page"
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
                      <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                        <Zap className="w-7 h-7 text-blue-400" /> Electrical Power Monitoring
                        <Badge className="ml-2 bg-yellow-500/10 text-yellow-400 border-yellow-500/20">Simulated</Badge>
                        <Badge className="ml-2 bg-yellow-500/10 text-yellow-400 border-yellow-500/20">Demo Mode</Badge>
                      </h1>
                      <p className="text-muted-foreground mt-2">
                        Monitoring tegangan, arus, daya, dan cos φ secara real-time (dummy data)
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
                      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
                    >
                      <Card className="border-0 bg-card/50 backdrop-blur-sm">
                        <CardHeader className="pb-2 flex flex-row items-center justify-between">
                          <CardTitle className="text-base font-semibold flex items-center gap-2">
                            Tegangan <span className="text-xs text-yellow-400">(Sim)</span>
                          </CardTitle>
                          <Zap className="w-5 h-5 text-green-400" />
                        </CardHeader>
                        <CardContent>
                          <div className="text-3xl font-bold text-foreground">{monitoringData[monitoringData.length-1].voltage} V</div>
                          <div className="text-xs text-muted-foreground mt-1">Normal Range</div>
                        </CardContent>
                      </Card>
                      <Card className="border-0 bg-card/50 backdrop-blur-sm">
                        <CardHeader className="pb-2 flex flex-row items-center justify-between">
                          <CardTitle className="text-base font-semibold flex items-center gap-2">
                            Arus <span className="text-xs text-yellow-400">(Sim)</span>
                          </CardTitle>
                          <Activity className="w-5 h-5 text-yellow-400" />
                        </CardHeader>
                        <CardContent>
                          <div className="text-3xl font-bold text-foreground">{monitoringData[monitoringData.length-1].current} A</div>
                          <div className="text-xs text-muted-foreground mt-1">Normal</div>
                        </CardContent>
                      </Card>
                      <Card className="border-0 bg-card/50 backdrop-blur-sm">
                        <CardHeader className="pb-2 flex flex-row items-center justify-between">
                          <CardTitle className="text-base font-semibold flex items-center gap-2">
                            Daya <span className="text-xs text-yellow-400">(Sim)</span>
                          </CardTitle>
                          <TrendingUp className="w-5 h-5 text-blue-400" />
                        </CardHeader>
                        <CardContent>
                          <div className="text-3xl font-bold text-foreground">{monitoringData[monitoringData.length-1].power} W</div>
                          <div className="text-xs text-muted-foreground mt-1">Active Power</div>
                        </CardContent>
                      </Card>
                      <Card className="border-0 bg-card/50 backdrop-blur-sm">
                        <CardHeader className="pb-2 flex flex-row items-center justify-between">
                          <CardTitle className="text-base font-semibold flex items-center gap-2">
                            Cos φ <span className="text-xs text-yellow-400">(Sim)</span>
                          </CardTitle>
                          <Percent className="w-5 h-5 text-purple-400" />
                        </CardHeader>
                        <CardContent>
                          <div className="text-3xl font-bold text-foreground">{monitoringData[monitoringData.length-1].cosphi}</div>
                          <div className="text-xs text-muted-foreground mt-1">Power Factor</div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })()}

                {/* Grafik */}
                {(() => {
                  const [ref, isVisible] = useScrollReveal();
                  return (
                    <motion.div
                      ref={ref}
                      initial={{ opacity: 0, y: 40 }}
                      animate={isVisible ? { opacity: 1, y: 0 } : {}}
                      transition={{ duration: 0.7, delay: 0.2, ease: [0.4, 0, 0.2, 1] }}
                      className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8"
                    >
                      {/* Tegangan */}
                      <Card className="border-0 bg-card/50 backdrop-blur-sm">
                        <CardHeader>
                          <CardTitle className="text-lg font-semibold">Voltage (Tegangan)</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="h-80">
                            <ResponsiveContainer width="100%" height="100%">
                              <AreaChart data={monitoringData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                <defs>
                                  <linearGradient id="voltageGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.8}/>
                                    <stop offset="95%" stopColor="#22d3ee" stopOpacity={0.1}/>
                                  </linearGradient>
                                </defs>
                                <XAxis dataKey="time" axisLine={false} tickLine={false} className="text-xs fill-muted-foreground" />
                                <YAxis axisLine={false} tickLine={false} className="text-xs fill-muted-foreground" />
                                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }} labelStyle={{ color: 'hsl(var(--foreground))' }} />
                                <Area type="monotone" dataKey="voltage" stroke="#22d3ee" fill="url(#voltageGradient)" strokeWidth={2} name="Tegangan (V)" />
                              </AreaChart>
                            </ResponsiveContainer>
                          </div>
                        </CardContent>
                      </Card>
                      {/* Arus */}
                      <Card className="border-0 bg-card/50 backdrop-blur-sm">
                        <CardHeader>
                          <CardTitle className="text-lg font-semibold">Current (Arus)</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="h-80">
                            <ResponsiveContainer width="100%" height="100%">
                              <AreaChart data={monitoringData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                <defs>
                                  <linearGradient id="currentGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#facc15" stopOpacity={0.8}/>
                                    <stop offset="95%" stopColor="#facc15" stopOpacity={0.1}/>
                                  </linearGradient>
                                </defs>
                                <XAxis dataKey="time" axisLine={false} tickLine={false} className="text-xs fill-muted-foreground" />
                                <YAxis axisLine={false} tickLine={false} className="text-xs fill-muted-foreground" />
                                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }} labelStyle={{ color: 'hsl(var(--foreground))' }} />
                                <Area type="monotone" dataKey="current" stroke="#facc15" fill="url(#currentGradient)" strokeWidth={2} name="Arus (A)" />
                              </AreaChart>
                            </ResponsiveContainer>
                          </div>
                        </CardContent>
                      </Card>
                      {/* Daya */}
                      <Card className="border-0 bg-card/50 backdrop-blur-sm">
                        <CardHeader>
                          <CardTitle className="text-lg font-semibold">Power (Daya)</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="h-80">
                            <ResponsiveContainer width="100%" height="100%">
                              <AreaChart data={monitoringData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                <defs>
                                  <linearGradient id="powerGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#60a5fa" stopOpacity={0.8}/>
                                    <stop offset="95%" stopColor="#60a5fa" stopOpacity={0.1}/>
                                  </linearGradient>
                                </defs>
                                <XAxis dataKey="time" axisLine={false} tickLine={false} className="text-xs fill-muted-foreground" />
                                <YAxis axisLine={false} tickLine={false} className="text-xs fill-muted-foreground" />
                                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }} labelStyle={{ color: 'hsl(var(--foreground))' }} />
                                <Area type="monotone" dataKey="power" stroke="#60a5fa" fill="url(#powerGradient)" strokeWidth={2} name="Daya (W)" />
                              </AreaChart>
                            </ResponsiveContainer>
                          </div>
                        </CardContent>
                      </Card>
                      {/* Cos φ */}
                      <Card className="border-0 bg-card/50 backdrop-blur-sm">
                        <CardHeader>
                          <CardTitle className="text-lg font-semibold">Cos φ</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="h-80">
                            <ResponsiveContainer width="100%" height="100%">
                              <AreaChart data={monitoringData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                <defs>
                                  <linearGradient id="cosphiGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#a78bfa" stopOpacity={0.8}/>
                                    <stop offset="95%" stopColor="#a78bfa" stopOpacity={0.1}/>
                                  </linearGradient>
                                </defs>
                                <XAxis dataKey="time" axisLine={false} tickLine={false} className="text-xs fill-muted-foreground" />
                                <YAxis axisLine={false} tickLine={false} className="text-xs fill-muted-foreground" />
                                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }} labelStyle={{ color: 'hsl(var(--foreground))' }} />
                                <Area type="monotone" dataKey="cosphi" stroke="#a78bfa" fill="url(#cosphiGradient)" strokeWidth={2} name="Cos φ" />
                              </AreaChart>
                            </ResponsiveContainer>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })()}

                {/* Monitoring Table */}
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
                            PZEM Power Monitoring (5-Minute Intervals)
                            <Badge className="bg-yellow-500/10 text-yellow-400 border-yellow-500/20">Simulated Data</Badge>
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead className="w-[100px]">Time</TableHead>
                                <TableHead>Voltage (V)</TableHead>
                                <TableHead>Current (A)</TableHead>
                                <TableHead>Power (W)</TableHead>
                                <TableHead>Energy (kWh)</TableHead>
                                <TableHead>Cos φ</TableHead>
                                <TableHead>Status</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {monitoringData.map((row) => (
                                <TableRow key={row.id}>
                                  <TableCell className="font-mono">{row.time}</TableCell>
                                  <TableCell className="font-mono text-green-500">{row.voltage}</TableCell>
                                  <TableCell className="font-mono text-yellow-500">{row.current}</TableCell>
                                  <TableCell className="font-mono text-blue-500">{row.power}</TableCell>
                                  <TableCell className="font-mono text-purple-500">{row.energy}</TableCell>
                                  <TableCell className="font-mono text-purple-400">{row.cosphi}</TableCell>
                                  <TableCell>
                                    <Badge variant="secondary" className={`text-xs ${row.status === "Normal" ? "bg-green-500/10 text-green-500 border-green-500/20" : row.status === "Caution" ? "bg-yellow-500/10 text-yellow-500 border-yellow-500/20" : "bg-red-500/10 text-red-500 border-red-500/20"}`}>
                                      {row.status}
                                    </Badge>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })()}

                {/* Footer */}
                <Footer name="Raka Azzihri" />
              </div>
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
} 