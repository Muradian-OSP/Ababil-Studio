import { Environment } from '../types/environment';

const ENVIRONMENTS_KEY = 'ababil_environments';
const ACTIVE_ENVIRONMENT_KEY = 'ababil_active_environment';

// Environment operations
export function saveEnvironment(
    environment: Omit<Environment, 'id' | 'createdAt' | 'updatedAt'>
): Environment {
    const environments = loadEnvironments();
    const now = Date.now();
    const newEnvironment: Environment = {
        ...environment,
        id: `env_${now}_${Math.random().toString(36).substr(2, 9)}`,
        createdAt: now,
        updatedAt: now,
    };

    // If this is set as active, deactivate others
    if (newEnvironment.isActive) {
        environments.forEach((env) => {
            if (env.id !== newEnvironment.id) {
                env.isActive = false;
            }
        });
        localStorage.setItem(ACTIVE_ENVIRONMENT_KEY, newEnvironment.id);
    }

    environments.push(newEnvironment);
    localStorage.setItem(ENVIRONMENTS_KEY, JSON.stringify(environments));
    return newEnvironment;
}

export function loadEnvironments(): Environment[] {
    try {
        const data = localStorage.getItem(ENVIRONMENTS_KEY);
        return data ? JSON.parse(data) : [];
    } catch {
        return [];
    }
}

export function updateEnvironment(
    id: string,
    updates: Partial<Omit<Environment, 'id' | 'createdAt'>>
): Environment | null {
    const environments = loadEnvironments();
    const index = environments.findIndex((e) => e.id === id);
    if (index === -1) return null;

    // If setting as active, deactivate others
    if (updates.isActive) {
        environments.forEach((env) => {
            if (env.id !== id) {
                env.isActive = false;
            }
        });
        localStorage.setItem(ACTIVE_ENVIRONMENT_KEY, id);
    }

    environments[index] = {
        ...environments[index],
        ...updates,
        updatedAt: Date.now(),
    };
    localStorage.setItem(ENVIRONMENTS_KEY, JSON.stringify(environments));
    return environments[index];
}

export function deleteEnvironment(id: string): boolean {
    const environments = loadEnvironments();
    const filtered = environments.filter((e) => e.id !== id);
    if (filtered.length === environments.length) return false;

    // If deleting active environment, clear active
    const activeId = localStorage.getItem(ACTIVE_ENVIRONMENT_KEY);
    if (activeId === id) {
        localStorage.removeItem(ACTIVE_ENVIRONMENT_KEY);
    }

    localStorage.setItem(ENVIRONMENTS_KEY, JSON.stringify(filtered));
    return true;
}

// Delete all environments linked to a specific collection
export function deleteEnvironmentsByCollectionId(collectionId: string): number {
    const environments = loadEnvironments();
    const toDelete = environments.filter(
        (e) => e.collectionId === collectionId
    );
    if (toDelete.length === 0) return 0;

    // Clear active if any of the deleted ones were active
    const activeId = localStorage.getItem(ACTIVE_ENVIRONMENT_KEY);
    if (activeId && toDelete.some((e) => e.id === activeId)) {
        localStorage.removeItem(ACTIVE_ENVIRONMENT_KEY);
    }

    const filtered = environments.filter(
        (e) => e.collectionId !== collectionId
    );
    localStorage.setItem(ENVIRONMENTS_KEY, JSON.stringify(filtered));
    return toDelete.length;
}

export function getEnvironment(id: string): Environment | null {
    const environments = loadEnvironments();
    return environments.find((e) => e.id === id) || null;
}

export function getActiveEnvironment(): Environment | null {
    const activeId = localStorage.getItem(ACTIVE_ENVIRONMENT_KEY);
    if (!activeId) {
        // Try to find any active environment
        const environments = loadEnvironments();
        const active = environments.find((e) => e.isActive);
        // Return a new object reference to ensure React detects changes
        return active ? { ...active, variables: [...active.variables] } : null;
    }
    const env = getEnvironment(activeId);
    // Return a new object reference to ensure React detects changes
    return env ? { ...env, variables: [...env.variables] } : null;
}

export function setActiveEnvironment(id: string): boolean {
    const environments = loadEnvironments();
    const environment = environments.find((e) => e.id === id);
    if (!environment) return false;

    // Deactivate all
    environments.forEach((env) => {
        env.isActive = env.id === id;
    });
    localStorage.setItem(ENVIRONMENTS_KEY, JSON.stringify(environments));
    localStorage.setItem(ACTIVE_ENVIRONMENT_KEY, id);
    return true;
}

/**
 * Update a variable in an environment
 */
export function updateVariable(
    environmentId: string,
    variableKey: string,
    newValue: string
): boolean {
    const environments = loadEnvironments();
    const environment = environments.find((e) => e.id === environmentId);
    if (!environment) return false;

    const variableIndex = environment.variables.findIndex(
        (v) => v.key === variableKey
    );
    if (variableIndex === -1) return false;

    environment.variables[variableIndex] = {
        ...environment.variables[variableIndex],
        value: newValue,
    };

    environment.updatedAt = Date.now();
    localStorage.setItem(ENVIRONMENTS_KEY, JSON.stringify(environments));
    return true;
}

/**
 * Get variable value from active environment
 */
export function getVariableValue(
    variableKey: string,
    environment: Environment | null
): string | null {
    if (!environment) return null;
    const variable = environment.variables.find(
        (v) => v.key === variableKey && !v.disabled
    );
    return variable ? variable.value : null;
}

/**
 * Replace variables in text using {{variable}} syntax
 */
export function replaceVariables(
    text: string,
    environment: Environment | null
): string {
    if (!environment || !text) return text;

    let result = text;
    const variablePattern = /\{\{([^}]+)\}\}/g;
    let match: RegExpExecArray | null;
    const replacements = new Map<string, string>();

    // First pass: collect all unique variables and their values
    while ((match = variablePattern.exec(text)) !== null) {
        const varName = match[1].trim();
        if (!replacements.has(varName)) {
            const variable = environment.variables.find(
                (v) => v.key === varName && !v.disabled
            );
            if (variable) {
                replacements.set(varName, variable.value);
            }
        }
    }

    // Second pass: replace all occurrences of each variable
    replacements.forEach((value, varName) => {
        const regex = new RegExp(
            `\\{\\{\\s*${varName.replace(
                /[.*+?^${}()|[\]\\]/g,
                '\\$&'
            )}\\s*\\}\\}`,
            'g'
        );
        result = result.replace(regex, value);
    });

    return result;
}
