"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { useModbus } from '@/lib/modbus-context';
import { 
  Wifi, 
  WifiOff, 
  Settings, 
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Loader2
} from 'lucide-react';

export function ModbusConnectionPanel() {
  const {
    config,
    isConnected,
    isConnecting,
    error,
    sht20Data,
    connect,
    disconnect,
    updateConfig,
    clearError
  } = useModbus();

  const [showSettings, setShowSettings] = useState(false);
  const [tempConfig, setTempConfig] = useState(config);

  const handleConnect = () => {
    clearError();
    connect();
  };

  const handleSaveConfig = () => {
    updateConfig(tempConfig);
    setShowSettings(false);
  };

  const getStatusIcon = () => {
    if (isConnecting) {
      return <Loader2 className="w-4 h-4 animate-spin" />;
    }
    if (isConnected) {
      return <CheckCircle className="w-4 h-4 text-green-500" />;
    }
    if (error) {
      return <AlertTriangle className="w-4 h-4 text-red-500" />;
    }
    return <WifiOff className="w-4 h-4 text-gray-500" />;
  };

  const getStatusText = () => {
    if (isConnecting) return 'Connecting...';
    if (isConnected) return 'Connected';
    if (error) return 'Error';
    return 'Disconnected';
  };

  const getStatusColor = () => {
    if (isConnecting) return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
    if (isConnected) return 'bg-green-500/10 text-green-500 border-green-500/20';
    if (error) return 'bg-red-500/10 text-red-500 border-red-500/20';
    return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
  };

  return (
    <Card className="border-0 bg-card/50 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-lg font-semibold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wifi className="w-5 h-5" />
            Modbus SHT20 Connection
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowSettings(!showSettings)}
          >
            <Settings className="w-4 h-4" />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Connection Status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getStatusIcon()}
            <span className="font-medium">{getStatusText()}</span>
          </div>
          <Badge variant="secondary" className={`text-xs ${getStatusColor()}`}>
            {config.host}:{config.port}
          </Badge>
        </div>

        {/* Current Data */}
        {isConnected && (
          <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
            <div>
              <p className="text-sm text-muted-foreground">Temperature</p>
              <p className="text-xl font-bold">{sht20Data.temperature}°C</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Humidity</p>
              <p className="text-xl font-bold">{sht20Data.humidity}%</p>
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {error}
            </AlertDescription>
          </Alert>
        )}

        {/* Connection Controls */}
        <div className="flex gap-2">
          {!isConnected ? (
            <Button 
              onClick={handleConnect} 
              disabled={isConnecting}
              className="flex-1"
            >
              {isConnecting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <Wifi className="w-4 h-4 mr-2" />
                  Connect
                </>
              )}
            </Button>
          ) : (
            <Button 
              onClick={disconnect} 
              variant="outline"
              className="flex-1"
            >
              <WifiOff className="w-4 h-4 mr-2" />
              Disconnect
            </Button>
          )}
          
          {isConnected && (
            <Button 
              onClick={handleConnect} 
              variant="outline"
              size="icon"
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
          )}
        </div>

        {/* Settings Panel */}
        {showSettings && (
          <div className="space-y-4 p-4 border rounded-lg bg-background/50">
            <h4 className="font-medium">Modbus Configuration</h4>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="host">Host IP</Label>
                <Input
                  id="host"
                  value={tempConfig.host}
                  onChange={(e) => setTempConfig(prev => ({ ...prev, host: e.target.value }))}
                  placeholder="192.168.1.100"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="port">Port</Label>
                <Input
                  id="port"
                  type="number"
                  value={tempConfig.port}
                  onChange={(e) => setTempConfig(prev => ({ ...prev, port: parseInt(e.target.value) || 502 }))}
                  placeholder="502"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="unitId">Unit ID</Label>
                <Input
                  id="unitId"
                  type="number"
                  value={tempConfig.unitId}
                  onChange={(e) => setTempConfig(prev => ({ ...prev, unitId: parseInt(e.target.value) || 1 }))}
                  placeholder="1"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="pollInterval">Poll Interval (ms)</Label>
                <Input
                  id="pollInterval"
                  type="number"
                  value={tempConfig.pollInterval}
                  onChange={(e) => setTempConfig(prev => ({ ...prev, pollInterval: parseInt(e.target.value) || 5000 }))}
                  placeholder="5000"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="tempRegister">Temperature Register</Label>
                <Input
                  id="tempRegister"
                  type="number"
                  value={tempConfig.temperatureRegister}
                  onChange={(e) => setTempConfig(prev => ({ ...prev, temperatureRegister: parseInt(e.target.value) || 0 }))}
                  placeholder="0"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="humidityRegister">Humidity Register</Label>
                <Input
                  id="humidityRegister"
                  type="number"
                  value={tempConfig.humidityRegister}
                  onChange={(e) => setTempConfig(prev => ({ ...prev, humidityRegister: parseInt(e.target.value) || 1 }))}
                  placeholder="1"
                />
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button onClick={handleSaveConfig} size="sm">
                Save Configuration
              </Button>
              <Button 
                onClick={() => {
                  setTempConfig(config);
                  setShowSettings(false);
                }} 
                variant="outline" 
                size="sm"
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Last Update */}
        {isConnected && (
          <p className="text-xs text-muted-foreground text-center">
            Last update: {sht20Data.timestamp.toLocaleTimeString()}
          </p>
        )}
      </CardContent>
    </Card>
  );
}