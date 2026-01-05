import { Folder01Icon, GlobeIcon, Settings01Icon } from 'hugeicons-react';
import { Button } from '../ui/button';

type NavItem = 'collections' | 'environments' | 'settings';

interface LeftNavProps {
    activeItem: NavItem;
    onItemClick: (item: NavItem) => void;
}

export function LeftNav({ activeItem, onItemClick }: LeftNavProps) {
    const navItems: Array<{ id: NavItem; label: string; icon: React.ReactNode }> = [
        {
            id: 'collections',
            label: 'Collections',
            icon: <Folder01Icon className="w-4 h-4" />,
        },
        {
            id: 'environments',
            label: 'Environments',
            icon: <GlobeIcon className="w-4 h-4" />,
        },
        {
            id: 'settings',
            label: 'Settings',
            icon: <Settings01Icon className="w-4 h-4" />,
        },
    ];

    return (
        <div className="w-[65px] border-r border-border bg-card h-full flex flex-col flex-shrink-0">
            <div className="p-1 space-y-0.5">
                {navItems.map((item) => (
                    <Button
                        key={item.id}
                        variant={activeItem === item.id ? 'secondary' : 'ghost'}
                        className="w-full flex-col gap-0.5 h-auto py-1.5 px-0 min-h-[48px]"
                        onClick={() => onItemClick(item.id)}
                    >
                        {item.icon}
                        <span className="text-[9px] leading-tight font-normal">{item.label}</span>
                    </Button>
                ))}
            </div>
        </div>
    );
}

