/**
 * Type declarations for the Electron preload API
 */

export interface NativeLibraryStatus {
    initialized: boolean;
    error?: string;
    libraryPath?: string;
}

export interface AbabilAPI {
    makeHttpRequest: (requestJson: string) => Promise<string>;
    getNativeLibraryStatus: () => Promise<NativeLibraryStatus>;
    platform: string;
}

declare global {
    interface Window {
        ababilAPI: AbabilAPI;
    }
}
