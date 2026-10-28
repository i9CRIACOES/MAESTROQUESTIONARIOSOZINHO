import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./styles.css";
import { lazy, Suspense } from 'react';
import { tokenDaUrl } from './data/acesso';
const ResultadoPorEmail = lazy(() => import('./screens/ResultadoPorEmail').then(m => ({ default: m.ResultadoPorEmail })));
const abrindoResultado = window.location.hash.includes('resultado=');

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    {abrindoResultado ? <Suspense fallback={<p role="status" className="p-10">Carregando diagnóstico…</p>}><ResultadoPorEmail token={tokenDaUrl(window.location.hash)} /></Suspense> : <App />}
  </React.StrictMode>,
);
