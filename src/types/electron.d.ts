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
    parsePostmanCollection: (jsonString: string) => Promise<string>;
    selectPostmanFile: () => Promise<{ filePath: string; content: string } | { error: string } | null>;
    parsePostmanEnvironment: (jsonString: string) => Promise<string>;
    selectPostmanEnvironmentFile: () => Promise<{ filePath: string; content: string } | { error: string } | null>;
    platform: string;
}

declare global {
    interface Window {
        ababilAPI: AbabilAPI;
    }
}
