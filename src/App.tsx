import './index.css';
import { DependencyContainer } from './Shared/infrastructure';
import { AppContainer } from './Shared/presentation';
import { CryptoDataDependencyConfig } from './CryptoData/Infrastructure/config/DependencyConfig';
import { ChartingDependencyConfig } from './Charting/Infrastructure/config/DependencyConfig';
import { AstronomicalDependencyConfig } from './Astronomical/Infrastructure/config/DependencyConfig';

function App() {
  // Инициализация DI контейнера и регистрация зависимостей
  const container = DependencyContainer.getInstance();
  CryptoDataDependencyConfig.configure(container);
  ChartingDependencyConfig.configure(container);
  AstronomicalDependencyConfig.configure(container);

  return <AppContainer />;
}

export default App; 