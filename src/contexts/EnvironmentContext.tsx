import React, {
    createContext,
    useContext,
    useState,
    useCallback,
    useEffect,
    ReactNode,
} from 'react';
import { Environment } from '../types/environment';
import {
    loadEnvironments,
    getActiveEnvironment,
    setActiveEnvironment as setActiveEnvInStorage,
} from '../services/environmentService';

interface EnvironmentContextType {
    environments: Environment[];
    activeEnvironment: Environment | null;
    revision: number; // Force re-renders when environments change
    refreshEnvironments: () => void;
    setActiveEnvironment: (environmentId: string) => void;
    clearActiveEnvironment: () => void;
}

const EnvironmentContext = createContext<EnvironmentContextType | undefined>(
    undefined
);

interface EnvironmentProviderProps {
    children: ReactNode;
}

export function EnvironmentProvider({ children }: EnvironmentProviderProps) {
    const [environments, setEnvironments] = useState<Environment[]>([]);
    const [activeEnvironment, setActiveEnvironmentState] =
        useState<Environment | null>(null);
    const [revision, setRevision] = useState(0);

    const refreshEnvironments = useCallback(() => {
        const envs = loadEnvironments();
        setEnvironments(envs);

        const activeEnv = getActiveEnvironment();
        // Create new object reference to ensure React detects the change
        if (activeEnv) {
            setActiveEnvironmentState({
                ...activeEnv,
                variables: [...activeEnv.variables],
            });
        } else {
            setActiveEnvironmentState(null);
        }

        // Increment revision to force re-renders in consuming components
        setRevision((prev) => prev + 1);
    }, []);

    const setActiveEnvironment = useCallback(
        (environmentId: string) => {
            if (environmentId) {
                setActiveEnvInStorage(environmentId);
            }
            refreshEnvironments();
        },
        [refreshEnvironments]
    );

    const clearActiveEnvironment = useCallback(() => {
        localStorage.removeItem('ababil_active_environment');
        refreshEnvironments();
    }, [refreshEnvironments]);

    // Load environments on mount
    useEffect(() => {
        refreshEnvironments();
    }, [refreshEnvironments]);

    const value: EnvironmentContextType = {
        environments,
        activeEnvironment,
        revision,
        refreshEnvironments,
        setActiveEnvironment,
        clearActiveEnvironment,
    };

    return (
        <EnvironmentContext.Provider value={value}>
            {children}
        </EnvironmentContext.Provider>
    );
}

export function useEnvironment(): EnvironmentContextType {
    const context = useContext(EnvironmentContext);
    if (context === undefined) {
        throw new Error(
            'useEnvironment must be used within an EnvironmentProvider'
        );
    }
    return context;
}
