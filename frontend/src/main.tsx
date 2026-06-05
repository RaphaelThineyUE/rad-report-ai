import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import * as Sentry from '@sentry/react'
import './index.css'
import App from './App.tsx'
import { initSentry } from './utils/sentry'

initSentry()

const SentryApp = Sentry.withProfiler(App)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Sentry.ErrorBoundary fallback={<p>An error occurred</p>} showDialog>
      <SentryApp />
    </Sentry.ErrorBoundary>
  </StrictMode>,
)




Sentry.init({
  dsn: "https://f1c79f25ed46d6be4ec21e7a73527e62@o4511117899464704.ingest.us.sentry.io/4511509732720640",
  // Setting this option to true will send default PII data to Sentry.
  // For example, automatic IP address collection on events
  sendDefaultPii: true
});

const container = document.getElementById("app");
const root = createRoot(container);
root.render(<App />);