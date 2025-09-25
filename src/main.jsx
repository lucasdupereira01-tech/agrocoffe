import React from 'react'
import { createRoot } from 'react-dom/client'
import GerenciamentoApp from './Gerenciamento'
import './index.css'

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <GerenciamentoApp />
  </React.StrictMode>
)
