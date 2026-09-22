import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ThemeProvider, createTheme, type Shadows } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import { BrowserRouter } from 'react-router-dom'
import './i18n/config'
import App from './App'
import { useThemeStore } from './store/themeStore'
import './index.css'

// Apply the persisted theme (dark by default) before the first paint
// to avoid a flash of the light theme on page load.
if (useThemeStore.getState().isDarkMode) {
  document.documentElement.classList.add('dark')
}

const theme = createTheme({
  shape: {
    borderRadius: 2,
  },
  // Disable all Material elevation shadows
  shadows: Array(25).fill('none') as Shadows,
  palette: {
    mode: 'light',
    primary: {
      main: '#2563EB',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ThemeProvider>
  </StrictMode>,
)
