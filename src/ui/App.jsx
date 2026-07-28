import { Analytics } from '@vercel/analytics/react';
import Dashboard from './components/Dashboard';

function App() {
  return (
    <div className="app">
      <Dashboard />
      <Analytics />
    </div>
  );
}

export default App;
