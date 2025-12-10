import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ColorSchemeScript, MantineProvider } from '@mantine/core'
import '@mantine/core/styles.css'
import '@mantine/dates/styles.css'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ColorSchemeScript defaultColorScheme="light" />
    <MantineProvider
      defaultColorScheme="light"
      theme={{
        fontFamily: 'Manrope, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        headings: {
          fontFamily: 'Manrope, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
          fontWeight: '700',
        },
      }}
    >
      <App />
    </MantineProvider>
  </StrictMode>,
)
