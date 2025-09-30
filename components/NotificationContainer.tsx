import React, { useEffect, useRef } from 'react';
import { PriceAlert, AlertCondition } from '../types';
import CheckCircleIcon from './icons/CheckCircleIcon';
import XIcon from './icons/XIcon';

interface NotificationContainerProps {
  notifications: PriceAlert[];
  onDismiss: (alertId: string) => void;
}

// A short, silent, and valid base64-encoded WAV file to prevent syntax errors.
const NOTIFICATION_SOUND_B64 = "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=";

export const NotificationContainer: React.FC<NotificationContainerProps> = ({ notifications, onDismiss }) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const lastNotificationCount = useRef(0);

  useEffect(() => {
    if (notifications.length > 0 && notifications.length > lastNotificationCount.current) {
        audioRef.current?.play().catch(e => console.error("Error playing notification sound:", e));
    }
    lastNotificationCount.current = notifications.length;
  }, [notifications]);

  if (notifications.length === 0) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-[100] w-full max-w-sm space-y-3">
      <audio ref={audioRef} src={NOTIFICATION_SOUND_B64} preload="auto" />
      {notifications.map(alert => (
        <div key={alert.id} className="bg-gray-800 border border-green-500 shadow-lg rounded-lg pointer-events-auto ring-1 ring-black ring-opacity-5 overflow-hidden animate-pulse">
          <div className="p-4">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <CheckCircleIcon className="h-6 w-6 text-green-400" />
              </div>
              <div className="ml-3 w-0 flex-1 pt-0.5">
                <p className="text-sm font-semibold text-gray-100">Price Alert Triggered!</p>
                <p className="mt-1 text-sm text-gray-300">
                  {alert.ticker} is now {alert.condition === AlertCondition.ABOVE ? 'above' : 'below'} your target of ${alert.targetPrice.toFixed(2)}.
                </p>
              </div>
              <div className="ml-4 flex-shrink-0 flex">
                <button
                  onClick={() => onDismiss(alert.id)}
                  className="bg-gray-800 rounded-md inline-flex text-gray-400 hover:text-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-green-500"
                >
                  <span className="sr-only">Close</span>
                  <XIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
