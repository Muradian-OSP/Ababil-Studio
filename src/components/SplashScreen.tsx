import React from 'react';

export const SplashScreen = () => {
    return (
        <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm transition-all duration-500">
            <div className="relative flex flex-col items-center animate-in fade-in zoom-in duration-500">
                <img
                    src="https://assetsvw.imurad.me/appicon.png"
                    alt="Ababil Studio"
                    className="w-32 h-32 object-contain animate-pulse drop-shadow-2xl"
                />
            </div>
        </div>
    );
};
