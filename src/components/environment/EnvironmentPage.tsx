import { useState, useEffect } from 'react';
import {
    Add01Icon,
    Delete01Icon,
    Edit01Icon,
    FileUploadIcon,
} from 'hugeicons-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '../ui/table';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '../ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Environment, EnvironmentVariable } from '../../types/environment';
import {
    loadEnvironments,
    saveEnvironment,
    updateEnvironment,
    deleteEnvironment,
    setActiveEnvironment,
} from '../../services/environmentService';
import { importPostmanEnvironment } from '../../services/postmanService';
import { useEnvironment } from '../../contexts/EnvironmentContext';

export function EnvironmentPage() {
    const { refreshEnvironments: refreshGlobalEnvironments } = useEnvironment();
    const [environments, setEnvironments] = useState<Environment[]>([]);
    const [selectedEnvironment, setSelectedEnvironment] =
        useState<Environment | null>(null);
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [variableDialogOpen, setVariableDialogOpen] = useState(false);
    const [editingVariable, setEditingVariable] =
        useState<EnvironmentVariable | null>(null);
    const [envName, setEnvName] = useState('');
    const [varKey, setVarKey] = useState('');
    const [varValue, setVarValue] = useState('');
    const [importing, setImporting] = useState(false);
    const [importError, setImportError] = useState<string | null>(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [environmentToDelete, setEnvironmentToDelete] = useState<
        string | null
    >(null);

    useEffect(() => {
        refreshEnvironments();
    }, []);

    const refreshEnvironments = () => {
        const envs = loadEnvironments();
        setEnvironments(envs);
        // Also refresh global context so all components get the update
        refreshGlobalEnvironments();
    };

    const handleCreateEnvironment = () => {
        setSelectedEnvironment(null);
        setEnvName('');
        setEditDialogOpen(true);
    };

    const handleEditEnvironment = (env: Environment) => {
        setSelectedEnvironment(env);
        setEnvName(env.name);
        setEditDialogOpen(true);
    };

    const handleSaveEnvironment = () => {
        if (!envName.trim()) return;

        if (selectedEnvironment) {
            updateEnvironment(selectedEnvironment.id, { name: envName.trim() });
        } else {
            saveEnvironment({
                name: envName.trim(),
                variables: [],
                isActive: false,
            });
        }
        setEditDialogOpen(false);
        refreshEnvironments();
    };

    const handleDeleteEnvironment = (id: string) => {
        setEnvironmentToDelete(id);
        setDeleteDialogOpen(true);
    };

    const confirmDeleteEnvironment = () => {
        if (environmentToDelete) {
            deleteEnvironment(environmentToDelete);
            refreshEnvironments();
            setDeleteDialogOpen(false);
            setEnvironmentToDelete(null);
        }
    };

    const handleSetActive = (id: string) => {
        setActiveEnvironment(id);
        refreshEnvironments();
    };

    const handleAddVariable = (env: Environment) => {
        setSelectedEnvironment(env);
        setEditingVariable(null);
        setVarKey('');
        setVarValue('');
        setVariableDialogOpen(true);
    };

    const handleEditVariable = (
        env: Environment,
        variable: EnvironmentVariable
    ) => {
        setSelectedEnvironment(env);
        setEditingVariable(variable);
        setVarKey(variable.key);
        setVarValue(variable.value);
        setVariableDialogOpen(true);
    };

    const handleSaveVariable = () => {
        if (!selectedEnvironment || !varKey.trim()) return;

        const variables = [...selectedEnvironment.variables];
        if (editingVariable) {
            const index = variables.findIndex(
                (v) => v.key === editingVariable.key
            );
            if (index !== -1) {
                variables[index] = {
                    ...variables[index],
                    key: varKey.trim(),
                    value: varValue,
                };
            }
        } else {
            variables.push({ key: varKey.trim(), value: varValue });
        }

        updateEnvironment(selectedEnvironment.id, { variables });
        setVariableDialogOpen(false);
        refreshEnvironments();
    };

    const handleDeleteVariable = (env: Environment, varKey: string) => {
        const variables = env.variables.filter((v) => v.key !== varKey);
        updateEnvironment(env.id, { variables });
        refreshEnvironments();
    };

    const handleImport = async () => {
        if (typeof window === 'undefined' || !window.ababilAPI) {
            setImportError('Not running in Electron environment');
            return;
        }

        setImporting(true);
        setImportError(null);

        try {
            const fileResult =
                await window.ababilAPI.selectPostmanEnvironmentFile();
            if (!fileResult || 'error' in fileResult) {
                if (fileResult && 'error' in fileResult) {
                    setImportError(fileResult.error);
                }
                setImporting(false);
                return;
            }

            await importPostmanEnvironment(fileResult.content);
            refreshEnvironments();
            setImporting(false);
        } catch (error: unknown) {
            const errorMessage =
                error instanceof Error ? error.message : 'Unknown error';
            setImportError(errorMessage);
            setImporting(false);
        }
    };

    return (
        <div className="h-full overflow-y-auto p-6">
            <div className="max-w-6xl mx-auto space-y-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold">Environments</h1>
                    <div className="flex gap-2">
                        <Button
                            onClick={handleImport}
                            variant="outline"
                            disabled={importing}
                        >
                            {importing ? (
                                'Importing...'
                            ) : (
                                <>
                                    <FileUploadIcon className="w-4 h-4 mr-2" />
                                    Import
                                </>
                            )}
                        </Button>
                        <Button onClick={handleCreateEnvironment}>
                            <Add01Icon className="w-4 h-4 mr-2" />
                            New Environment
                        </Button>
                    </div>
                </div>

                {importError && (
                    <div className="p-3 bg-destructive/10 text-destructive text-sm rounded">
                        {importError}
                    </div>
                )}

                {environments.length === 0 ? (
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center py-12">
                            <p className="text-muted-foreground mb-4">
                                No environments yet
                            </p>
                            <Button onClick={handleCreateEnvironment}>
                                Create Environment
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-4">
                        {environments.map((env) => (
                            <Card key={env.id}>
                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <CardTitle>{env.name}</CardTitle>
                                            {env.isActive && (
                                                <Badge variant="default">
                                                    Active
                                                </Badge>
                                            )}
                                        </div>
                                        <div className="flex gap-2">
                                            {!env.isActive && (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() =>
                                                        handleSetActive(env.id)
                                                    }
                                                >
                                                    Set Active
                                                </Button>
                                            )}
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() =>
                                                    handleEditEnvironment(env)
                                                }
                                            >
                                                <Edit01Icon className="w-4 h-4" />
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() =>
                                                    handleDeleteEnvironment(
                                                        env.id
                                                    )
                                                }
                                            >
                                                <Delete01Icon className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="font-medium">
                                            Variables ({env.variables.length})
                                        </h3>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() =>
                                                handleAddVariable(env)
                                            }
                                        >
                                            <Add01Icon className="w-4 h-4 mr-1" />
                                            Add Variable
                                        </Button>
                                    </div>
                                    {env.variables.length === 0 ? (
                                        <p className="text-sm text-muted-foreground">
                                            No variables in this environment
                                        </p>
                                    ) : (
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Key</TableHead>
                                                    <TableHead>Value</TableHead>
                                                    <TableHead>Type</TableHead>
                                                    <TableHead className="w-[100px]">
                                                        Actions
                                                    </TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {env.variables.map(
                                                    (variable) => (
                                                        <TableRow
                                                            key={variable.key}
                                                        >
                                                            <TableCell className="font-mono text-sm">
                                                                {variable.key}
                                                            </TableCell>
                                                            <TableCell className="font-mono text-sm">
                                                                {variable.value}
                                                            </TableCell>
                                                            <TableCell>
                                                                {variable.type ||
                                                                    'string'}
                                                            </TableCell>
                                                            <TableCell>
                                                                <div className="flex gap-1">
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        onClick={() =>
                                                                            handleEditVariable(
                                                                                env,
                                                                                variable
                                                                            )
                                                                        }
                                                                    >
                                                                        <Edit01Icon className="w-3 h-3" />
                                                                    </Button>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        onClick={() =>
                                                                            handleDeleteVariable(
                                                                                env,
                                                                                variable.key
                                                                            )
                                                                        }
                                                                    >
                                                                        <Delete01Icon className="w-3 h-3" />
                                                                    </Button>
                                                                </div>
                                                            </TableCell>
                                                        </TableRow>
                                                    )
                                                )}
                                            </TableBody>
                                        </Table>
                                    )}
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>

            {/* Environment Dialog */}
            <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {selectedEnvironment
                                ? 'Edit Environment'
                                : 'New Environment'}
                        </DialogTitle>
                        <DialogDescription>
                            Enter a name for your environment.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <Input
                            value={envName}
                            onChange={(e) => setEnvName(e.target.value)}
                            placeholder="Environment name"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    handleSaveEnvironment();
                                }
                            }}
                            autoFocus
                        />
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setEditDialogOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSaveEnvironment}
                            disabled={!envName.trim()}
                        >
                            Save
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Variable Dialog */}
            <Dialog
                open={variableDialogOpen}
                onOpenChange={setVariableDialogOpen}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {editingVariable ? 'Edit Variable' : 'New Variable'}
                        </DialogTitle>
                        <DialogDescription>
                            Add a variable to your environment.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4 space-y-4">
                        <div>
                            <label className="text-sm font-medium mb-2 block">
                                Key
                            </label>
                            <Input
                                value={varKey}
                                onChange={(e) => setVarKey(e.target.value)}
                                placeholder="variable_name"
                                disabled={!!editingVariable}
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium mb-2 block">
                                Value
                            </label>
                            <Input
                                value={varValue}
                                onChange={(e) => setVarValue(e.target.value)}
                                placeholder="variable value"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setVariableDialogOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSaveVariable}
                            disabled={!varKey.trim()}
                        >
                            Save
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Environment</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete this environment?
                            This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setDeleteDialogOpen(false);
                                setEnvironmentToDelete(null);
                            }}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={confirmDeleteEnvironment}
                        >
                            Delete
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
