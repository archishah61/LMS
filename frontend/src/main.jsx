import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HelmetProvider } from 'react-helmet-async';
import './index.css'
import App from './App.jsx'
import { Provider } from 'react-redux';
import { store } from "./app/store";
import { Toaster } from 'react-hot-toast';


createRoot(document.getElementById("root")).render(
  <StrictMode>
    <Provider store={store}>
      <HelmetProvider>
        <App />
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#dc2626', // 🔴 Red background
              color: '#fff',         // White text
            },
            success: {
              style: {
                background: '#16a34a', // ✅ Green for success
              },
            },
            error: {
              style: {
                background: '#dc2626', // ❌ Red for errors
              },
            },
          }}
        />
      </HelmetProvider>
    </Provider>
  </StrictMode>
);
