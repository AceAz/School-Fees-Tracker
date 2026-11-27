import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import FeeTracker from './FeeTracker'

import { Amplify } from "aws-amplify";

Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId: import.meta.env.VITE_COGNITO_USER_POOL_ID,
      userPoolClientId: import.meta.env.VITE_COGNITO_CLIENT_ID,
      loginWith: { email: true },
    },
  },
});
console.log("Pool ID:", JSON.stringify(import.meta.env.VITE_COGNITO_USER_POOL_ID));
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
    <FeeTracker />
  </StrictMode>,
)
