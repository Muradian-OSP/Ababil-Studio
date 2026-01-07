export interface EnvironmentVariable {
    key: string;
    value: string;
    type?: 'string' | 'number' | 'boolean';
    disabled?: boolean;
}

export interface Environment {
    id: string;
    name: string;
    variables: EnvironmentVariable[];
    isActive: boolean;
    collectionId?: string; // Link to parent collection for cleanup on delete
    createdAt: number;
    updatedAt: number;
}
