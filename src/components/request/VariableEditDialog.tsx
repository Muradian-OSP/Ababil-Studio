import { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '../ui/dialog';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Environment } from '../../types/environment';
import { updateVariable } from '../../services/environmentService';

interface VariableEditDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    environment: Environment | null;
    variableKey: string;
    onVariableUpdated?: () => void;
}

export function VariableEditDialog({
    open,
    onOpenChange,
    environment,
    variableKey,
    onVariableUpdated,
}: VariableEditDialogProps) {
    const [value, setValue] = useState('');

    useEffect(() => {
        if (open && environment) {
            const variable = environment.variables.find((v) => v.key === variableKey);
            setValue(variable?.value || '');
        }
    }, [open, environment, variableKey]);

    const handleSave = () => {
        if (!environment) return;

        const success = updateVariable(environment.id, variableKey, value);
        if (success) {
            onVariableUpdated?.();
            onOpenChange(false);
        }
    };

    if (!environment) {
        return null;
    }

    const variable = environment.variables.find((v) => v.key === variableKey);
    if (!variable) {
        return null;
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Edit Variable</DialogTitle>
                    <DialogDescription>
                        Update the value for the variable{' '}
                        <code className="text-xs bg-muted px-1 py-0.5 rounded">
                            {variableKey}
                        </code>
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4 space-y-4">
                    <div className="space-y-2">
                        <Label>Variable Key</Label>
                        <Input value={variableKey} disabled className="font-mono" />
                    </div>
                    <div className="space-y-2">
                        <Label>Value</Label>
                        <Input
                            value={value}
                            onChange={(e) => setValue(e.target.value)}
                            placeholder="Enter variable value"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    handleSave();
                                }
                            }}
                            autoFocus
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button onClick={handleSave}>Save</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

