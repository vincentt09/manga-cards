import React, { useEffect, useState } from "react";
import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";

export default function CountdownTimer({ targetDate, onComplete, className }) {
  const [timeLeft, setTimeLeft] = useState({
    hours: 0,
    minutes: 0,
    seconds: 0,
    isExpired: false,
  });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = new Date(targetDate) - new Date();

      if (difference <= 0) {
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0, isExpired: true });
        onComplete?.();
        return;
      }

      setTimeLeft({
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
        isExpired: false,
      });
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [targetDate, onComplete]);

  if (timeLeft.isExpired) {
    return (
      <div className={cn("flex items-center gap-2 text-destructive", className)}>
        <Clock className="w-4 h-4" />
        <span className="text-sm font-bold">Expiré</span>
      </div>
    );
  }

  const TimeBlock = ({ value, label }) => (
    <div className="flex flex-col items-center">
      <div className="w-10 h-10 rounded-lg bg-secondary/50 border border-border flex items-center justify-center">
        <span className="text-sm font-bold font-mono">
          {String(value).padStart(2, '0')}
        </span>
      </div>
      <span className="text-[9px] text-muted-foreground mt-1">{label}</span>
    </div>
  );

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Clock className="w-4 h-4 text-primary" />
      <div className="flex gap-1">
        <TimeBlock value={timeLeft.hours} label="h" />
        <TimeBlock value={timeLeft.minutes} label="m" />
        <TimeBlock value={timeLeft.seconds} label="s" />
      </div>
    </div>
  );
}