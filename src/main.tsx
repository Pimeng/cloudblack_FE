import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import Clarity from '@microsoft/clarity';

// 初始化 Microsoft Clarity
const projectId = "vzpezxdt5x";
Clarity.init(projectId);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
