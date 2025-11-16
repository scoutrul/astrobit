import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AppContainer } from './Shared/presentation/containers/AppContainer';
import { YandexMetrika } from './Shared/presentation/components/YandexMetrika';

import './Shared/presentation/styles/global.css';

function App() {
  try {
    return (
      <Router>
        {/* Яндекс.Метрика */}
        <YandexMetrika 
          metrikaId={104028714}
          config={{
            clickmap: true,
            trackLinks: true,
            accurateTrackBounce: true,
            webvisor: true,
            defer: true,
            trackHash: true,
            trackBounce: true,
            ssr: true
          }}
          enableRouter={true}
          visitParams={{
            site: 'astrobit.online',
            platform: 'web'
          }}
          userParams={{
            app_version: '1.0.0'
          }}
        />
        
        <Routes>
          <Route path="/" element={<AppContainer />} />
        </Routes>
      </Router>
    );
  } catch (error) {
    return <div>Ошибка загрузки приложения</div>;
  }
}

export default App; 