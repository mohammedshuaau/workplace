import React from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Wifi, WifiOff, AlertCircle, CheckCircle } from 'lucide-react';
import { useMatrix } from '@/contexts/matrix-context';

const getStatusIcon = (connectionStatus: string) => {
    switch (connectionStatus) {
        case 'connected':
            return <CheckCircle className="h-4 w-4 text-green-500" />;
        case 'connecting':
            return <Wifi className="h-4 w-4 text-yellow-500 animate-pulse" />;
        case 'disconnected':
            return <WifiOff className="h-4 w-4 text-red-500" />;
        case 'error':
            return <AlertCircle className="h-4 w-4 text-red-500" />;
        default:
            return <WifiOff className="h-4 w-4 text-gray-500" />;
    }
};

const getStatusText = (connectionStatus: string) => {
    switch (connectionStatus) {
        case 'connected':
            return 'Connected';
        case 'connecting':
            return 'Connecting...';
        case 'disconnected':
            return 'Disconnected';
        case 'error':
            return 'Connection Error';
        default:
            return 'Unknown';
    }
};

const getStatusColor = (connectionStatus: string) => {
    switch (connectionStatus) {
        case 'connected':
            return 'text-green-600';
        case 'connecting':
            return 'text-yellow-600';
        case 'disconnected':
        case 'error':
            return 'text-red-600';
        default:
            return 'text-gray-600';
    }
};

// Component for embedding in other popovers
export const ConnectionStatusEmbedded: React.FC = () => {
    const { connectionStatus, lastError, reconnect, testConnection } = useMatrix();

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <h4 className="font-medium text-sm">Matrix Server Status</h4>
                {getStatusIcon(connectionStatus)}
            </div>

            <div className="space-y-2">
                <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Status:</span>
                    <span className={`font-medium ${getStatusColor(connectionStatus)}`}>
                        {getStatusText(connectionStatus)}
                    </span>
                </div>

                {lastError && (
                    <div className="text-sm">
                        <span className="text-muted-foreground">Error:</span>
                        <div className="mt-1 p-2 bg-red-50 border border-red-200 rounded text-red-700 text-xs">
                            {lastError}
                        </div>
                    </div>
                )}
            </div>

            {(connectionStatus === 'disconnected' || connectionStatus === 'error') && (
                <Button
                    onClick={reconnect}
                    size="sm"
                    className="w-full"
                    disabled={false}
                >
                    Reconnect
                </Button>
            )}

            {connectionStatus === 'connected' && (
                <Button
                    onClick={testConnection}
                    size="sm"
                    variant="outline"
                    className="w-full"
                >
                    Test Connection
                </Button>
            )}
        </div>
    );
};

// Original component with its own popover
export const ConnectionStatus: React.FC = () => {
    const { connectionStatus } = useMatrix();

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button
                    variant="ghost"
                    size="sm"
                    className="flex items-center gap-2 px-2 py-1 h-auto"
                >
                    {getStatusIcon(connectionStatus)}
                    <span className={`text-xs font-medium ${getStatusColor(connectionStatus)}`}>
                        {getStatusText(connectionStatus)}
                    </span>
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80" align="end">
                <ConnectionStatusEmbedded />
            </PopoverContent>
        </Popover>
    );
}; 