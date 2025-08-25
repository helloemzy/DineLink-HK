"use client";
import { UtensilsCrossed, Wifi, RefreshCw } from 'lucide-react';

export default function OfflinePage() {
  const handleRetry = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        {/* Logo */}
        <div className="w-20 h-20 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
          <UtensilsCrossed className="w-10 h-10 text-white" />
        </div>
        
        {/* Offline Icon */}
        <div className="relative mb-6">
          <Wifi className="w-16 h-16 text-gray-300 mx-auto" />
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-20 h-20 rounded-full border-4 border-red-500 opacity-75">
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-16 h-1 bg-red-500 rotate-45"></div>
          </div>
        </div>

        {/* Content */}
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          You're Offline
        </h1>
        <p className="text-gray-600 mb-2">
          DineLink needs an internet connection to coordinate your group dining experience.
        </p>
        <p className="text-sm text-gray-500 mb-8">
          Check your connection and try again, or continue browsing your cached events.
        </p>

        {/* Actions */}
        <div className="space-y-3">
          <button 
            onClick={handleRetry}
            className="w-full bg-red-500 text-white py-3 rounded-lg font-medium hover:bg-red-600 transition-colors flex items-center justify-center space-x-2"
          >
            <RefreshCw className="w-5 h-5" />
            <span>Try Again</span>
          </button>
          
          <button 
            onClick={() => window.history.back()}
            className="w-full border border-gray-300 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-50 transition-colors"
          >
            Go Back
          </button>
        </div>

        {/* Offline Features */}
        <div className="mt-12 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-semibold text-blue-900 mb-2">Available Offline:</h3>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• View cached events</li>
            <li>• Browse restaurant information</li>
            <li>• Review past orders</li>
          </ul>
          <p className="text-xs text-blue-600 mt-2">
            Actions will sync when you're back online
          </p>
        </div>
      </div>
    </div>
  );
}