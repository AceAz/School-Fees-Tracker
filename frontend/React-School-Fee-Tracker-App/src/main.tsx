/// <reference types="vite/client" />

import React from 'react'
import ReactDOM from 'react-dom/client'
import 'bootstrap/dist/css/bootstrap.css'
import FeeTracker from './FeeTracker';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <FeeTracker />
  </React.StrictMode>,
)
