import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import ReportsPage from "./pages/CityReports"

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ReportsPage />
  </StrictMode>,
)
