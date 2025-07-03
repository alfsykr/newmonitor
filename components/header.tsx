"use client";

import { Bell, Sun, Moon, Thermometer, Home } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from './ui/button';
import { Avatar, AvatarFallback } from './ui/avatar';
import { useEffect, useState } from 'react';

function GreetingText() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000 * 30);
    return () => clearInterval(timer);
  }, []);
  const hours = now.getHours();
  let greeting = "";
  if (hours < 5) greeting = "Good Night!";
  else if (hours < 12) greeting = "Good Morning!";
  else if (hours < 18) greeting = "Good Afternoon!";
  else greeting = "Good Evening!";
  return <span className="text-lg font-semibold text-gray-800 dark:text-white drop-shadow-lg">{greeting}</span>;
}

function DateText() {
  const [mounted, setMounted] = useState(false);
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    setMounted(true);
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);
  if (!mounted) return <span className="text-base font-medium text-gray-700 dark:text-gray-200">&nbsp;</span>;
  const time = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
  const day = now.toLocaleDateString('en-US', { weekday: 'long' });
  const date = now.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' });
  return (
    <span className="text-base font-medium text-gray-700 dark:text-gray-200 flex items-center gap-4">
      {time}
      <span>{day}, {date}</span>
    </span>
  );
}

export function Header() {
  const { theme, setTheme } = useTheme();

  return (
    <header className="h-16 bg-background border-b border-border flex items-center justify-between px-6">
      {/* Greeting on the left */}
      <div className="flex-1 flex items-center justify-start">
        <GreetingText />
      </div>

      {/* Actions in the center */}
      <div className="flex items-center justify-center space-x-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        >
          <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        </Button>
        <Avatar className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600">
          <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
            <Home className="w-4 h-4" />
          </AvatarFallback>
        </Avatar>
      </div>

      {/* Date/time on the right */}
      <div className="flex-1 flex items-center justify-end">
        <DateText />
      </div>
    </header>
  );
}