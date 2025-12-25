
import React from 'react';

const LoadingScreen: React.FC = () => {
  return (
    <div className="fixed inset-0 bg-white dark:bg-dark z-[999] flex flex-col items-center justify-center space-y-4">
      <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      <div className="flex items-center space-x-2 animate-pulse-slow">
        <span className="text-xl font-bold">Deshi</span>
        <span className="text-xl font-bold text-primary">Wallet</span>
      </div>
      <p className="text-gray-400 text-sm">Securing your vault...</p>
    </div>
  );
};

export default LoadingScreen;
