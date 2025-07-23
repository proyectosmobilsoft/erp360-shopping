import React from 'react';
import { CheckCircle, XCircle, AlertCircle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface CustomToastProps {
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  onClose?: () => void;
}

const toastConfig = {
  success: {
    icon: CheckCircle,
    bgColor: 'bg-white',
    borderColor: 'border-green-200',
    iconColor: 'text-green-500',
    titleColor: 'text-gray-900'
  },
  error: {
    icon: XCircle, 
    bgColor: 'bg-white',
    borderColor: 'border-red-200',
    iconColor: 'text-red-500',
    titleColor: 'text-gray-900'
  },
  warning: {
    icon: AlertCircle,
    bgColor: 'bg-white', 
    borderColor: 'border-yellow-200',
    iconColor: 'text-yellow-500',
    titleColor: 'text-gray-900'
  },
  info: {
    icon: Info,
    bgColor: 'bg-white',
    borderColor: 'border-blue-200', 
    iconColor: 'text-blue-500',
    titleColor: 'text-gray-900'
  }
};

export const CustomToast: React.FC<CustomToastProps> = ({ 
  type, 
  title, 
  message, 
  onClose 
}) => {
  const config = toastConfig[type];
  const Icon = config.icon;

  return (
    <div className={cn(
      "flex items-start space-x-3 p-4 rounded-lg border shadow-lg max-w-md",
      config.bgColor,
      config.borderColor
    )}>
      <div className="flex-shrink-0">
        <Icon className={cn("w-6 h-6", config.iconColor)} />
      </div>
      <div className="flex-1 min-w-0">
        <p className={cn("text-sm font-medium", config.titleColor)}>
          {title}
        </p>
        {message && (
          <p className="text-sm text-gray-600 mt-1">
            {message}
          </p>
        )}
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="bg-cyan-500 hover:bg-cyan-600 text-white px-4 py-1 rounded text-sm font-medium transition-colors"
        >
          Cerrar
        </button>
      )}
    </div>
  );
};