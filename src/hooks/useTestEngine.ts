import { useState, useEffect } from 'react';

export const useTestEngine = (testDuration: number, onTimeUp: () => void) => {
  const [timeLeft, setTimeLeft] = useState(testDuration * 60);
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    let timer: any;
    if (isActive && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setIsActive(false);
      onTimeUp();
    }
    return () => clearInterval(timer);
  }, [timeLeft, isActive]);

  const formatTime = () => {
    const mins = Math.floor(timeLeft / 60);
    const secs = timeLeft % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return { timeLeft, formatTime, setIsActive, setTimeLeft };
};
