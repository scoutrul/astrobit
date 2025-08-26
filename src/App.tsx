
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AppContainer } from './Shared/presentation/containers/AppContainer';
import { EnhancedPostingContainer } from './Posting/Presentation/containers/EnhancedPostingContainer';
import { AdminGuard } from './Shared/presentation/components/AdminGuard';
import { AdminPanel } from './Shared/presentation/components/AdminPanel';

import './Shared/presentation/styles/global.css';

function App() {
  try {
    return (
      <Router>
        <Routes>
          <Route path="/" element={<AppContainer />} />
          <Route 
            path="/admin" 
            element={
              <AdminGuard>
                <AdminPanel title="Система постинга">
                  <EnhancedPostingContainer />
                </AdminPanel>
              </AdminGuard>
            } 
          />
        </Routes>
      </Router>
    );
  } catch (error) {
    return <div>Ошибка загрузки приложения</div>;
  }
}

export default App; 