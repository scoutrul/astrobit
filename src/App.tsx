
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AppContainer } from './Shared/presentation/containers/AppContainer';
import { PostingContainer } from './Posting/Presentation/containers/PostingContainer';
import { AdminGuard } from './Shared/presentation/components/AdminGuard';
import { AdminPanel } from './Shared/presentation/components/AdminPanel';
import { useAdminAccess } from './Shared/presentation/hooks/useAdminAccess';
import { logger } from './Shared/infrastructure/Logger';
import './Shared/presentation/styles/global.css';

function App() {
  // Инициализируем хук админского доступа глобально
  useAdminAccess();

  try {
    logger.info('Рендер главного компонента App');
    
    return (
      <Router>
        <Routes>
          <Route path="/" element={<AppContainer />} />
          <Route 
            path="/admin" 
            element={
              <AdminGuard>
                <AdminPanel title="Система постинга">
                  <PostingContainer />
                </AdminPanel>
              </AdminGuard>
            } 
          />
        </Routes>
      </Router>
    );
  } catch (error) {
    logger.exception('Ошибка рендера главного компонента', error);
    return <div>Ошибка загрузки приложения</div>;
  }
}

export default App; 