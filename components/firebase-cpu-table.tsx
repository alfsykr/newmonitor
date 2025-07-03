"use client";

import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import { useFirebase } from "@/lib/firebase-context";
import { Cloud, Wifi, WifiOff } from "lucide-react";

export function FirebaseCPUTable() {
  const {
    firebaseCPUData,
    isFirebaseConnected,
    lastFirebaseUpdate,
    connectedLaptops,
  } = useFirebase();

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Cool":
        return "bg-blue-500/10 text-blue-500 border-blue-500/20";
      case "Normal":
        return "bg-green-500/10 text-green-500 border-green-500/20";
      case "Warning":
        return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
      case "Critical":
        return "bg-red-500/10 text-red-500 border-red-500/20";
      default:
        return "bg-gray-500/10 text-gray-500 border-gray-500/20";
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  return (
    <Card className="border-0 bg-card/50 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-lg font-semibold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Cloud className="w-5 h-5" />
            Computer CPU Temperature Data (Firebase)
          </div>
          <div className="flex items-center gap-2">
            {isFirebaseConnected ? (
              <Badge
                variant="default"
                className="bg-green-500/10 text-green-500 border-green-500/20"
              >
                <Wifi className="w-3 h-3 mr-1" />
                Connected
              </Badge>
            ) : (
              <Badge
                variant="secondary"
                className="bg-red-500/10 text-red-500 border-red-500/20"
              >
                <WifiOff className="w-3 h-3 mr-1" />
                Disconnected
              </Badge>
            )}
          </div>
        </CardTitle>
        {isFirebaseConnected && (
          <div className="text-sm text-muted-foreground">
            <p>Last Update: {formatTime(lastFirebaseUpdate)}</p>
          </div>
        )}
      </CardHeader>
      <CardContent>
        {!isFirebaseConnected ? (
          <div className="text-center py-8 text-muted-foreground">
            <Cloud className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No connection to Firebase</p>
            <p className="text-sm">
              Make sure another laptop is running the Python script to send the data.
            </p>
          </div>
        ) : firebaseCPUData.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Cloud className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>There is no temperature data from other computers yet</p>
            <p className="text-sm">Waiting for data from Firebase...</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">#</TableHead>
                <TableHead>ID Computer</TableHead>
                <TableHead>CPU Temp</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {firebaseCPUData.map((laptop, index) => (
                <TableRow key={laptop.id}>
                  <TableCell className="font-medium">{index + 1}</TableCell>
                  <TableCell className="font-medium">
                    {laptop.laptopId}
                  </TableCell>
                  <TableCell className="font-mono">{laptop.suhu}°C</TableCell>
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className={`text-xs ${getStatusColor(laptop.status)}`}
                    >
                      {laptop.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">{laptop.tanggal}</TableCell>
                  <TableCell className="text-sm font-mono">
                    {laptop.waktu}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
