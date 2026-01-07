import React from 'react';
import { Toaster } from 'sonner';
import { ThemeProvider } from './contexts/ThemeContext';
import { HomeLayout } from './components/layout/HomeLayout';

function App() {
    return (
        <ThemeProvider>
            <HomeLayout />
            <Toaster richColors position="top-right" />
        </ThemeProvider>
    );
}

export default App;
