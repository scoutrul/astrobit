
import { AppDependencyConfig } from './Shared/infrastructure';
import { AppContainer } from './Shared/presentation';

function App() {
  // Инициализация DI контейнера и регистрация зависимостей
  AppDependencyConfig.configure();

  return <AppContainer />;
}

export default App; 