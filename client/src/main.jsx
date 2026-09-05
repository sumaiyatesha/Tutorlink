// main.jsx — The entry point of our React application.
//
// This file:
// 1. Finds the <div id="root"> in index.html
// 2. Renders our React app inside it
// 3. Wraps the app in BrowserRouter so React Router can handle page navigation

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {/* BrowserRouter enables client-side routing (changing pages without
        a full page reload). It must wrap any component that uses
        <Routes>, <Route>, <Link>, or useNavigate(). */}
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
