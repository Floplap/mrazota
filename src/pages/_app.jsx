import React from 'react';
import { AuthProvider } from '../hooks/useAuth';
import { ThemeProvider } from '../components/ThemeProvider';
import { ToastProvider } from '../components/ui/ToastProvider';
import Navbar from '../components/layout/Navbar';
import { CartProvider } from '../context/CartContext';

export default function MyApp({ Component, pageProps }) {
  return (
    <AuthProvider>
      <ThemeProvider>
        <ToastProvider>
          <CartProvider>
            <Navbar />
            <main style={{ padding: 20 }}>
              <Component {...pageProps} />
            </main>
          </CartProvider>
        </ToastProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}
