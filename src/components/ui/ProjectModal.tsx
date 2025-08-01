import React from 'react';

interface ProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProjectModal: React.FC<ProjectModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-gray-800 border border-gray-600 rounded-lg shadow-2xl max-w-2xl w-full mx-4 max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-600">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-orange-400 to-yellow-400 bg-clip-text text-transparent">
            О проекте AstroBit
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors p-2"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6 text-gray-300">
            <section>
              <h3 className="text-xl font-semibold text-white mb-3">🎯 Назначение</h3>
              <p className="leading-relaxed">
                AstroBit — это инновационная платформа, объединяющая анализ криптовалютных рынков с астрономическими событиями. 
                Проект исследует возможные корреляции между космическими явлениями и движением цен на криптовалютных рынках.
              </p>
            </section>

            <section>
              <h3 className="text-xl font-semibold text-white mb-3">🚀 Ключевые возможности</h3>
              <ul className="space-y-2 list-disc list-inside">
                <li><strong>Real-time графики:</strong> Интерактивные свечные графики с WebSocket обновлениями</li>
                <li><strong>Астрономические события:</strong> Отслеживание лунных фаз, солнечных затмений, планетарных соединений</li>
                <li><strong>Метеорные потоки:</strong> Мониторинг метеорных дождей и их потенциального влияния</li>
                <li><strong>Адаптивная архитектура:</strong> DDD и Clean Architecture для масштабируемости</li>
                <li><strong>Мультитаймфреймный анализ:</strong> От часовых до месячных интервалов</li>
              </ul>
            </section>

            <section>
              <h3 className="text-xl font-semibold text-white mb-3">🔬 Научная основа</h3>
              <p className="leading-relaxed">
                Проект основан на исследованиях, показывающих возможную связь между астрономическими циклами и поведением финансовых рынков. 
                Лунные фазы, солнечная активность и другие космические явления могут влиять на психологию трейдеров и рыночную волатильность.
              </p>
            </section>

            <section>
              <h3 className="text-xl font-semibold text-white mb-3">📊 Технический стек</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold text-orange-400 mb-2">Frontend</h4>
                  <ul className="space-y-1 text-sm">
                    <li>• React 18 + TypeScript</li>
                    <li>• Tailwind CSS</li>
                    <li>• Lightweight Charts</li>
                    <li>• Vite</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-orange-400 mb-2">Архитектура</h4>
                  <ul className="space-y-1 text-sm">
                    <li>• Domain-Driven Design (DDD)</li>
                    <li>• Clean Architecture</li>
                    <li>• Dependency Injection</li>
                    <li>• WebSocket интеграция</li>
                  </ul>
                </div>
              </div>
            </section>

            <section>
              <h3 className="text-xl font-semibold text-white mb-3">🌙 Астрономические события</h3>
              <p className="leading-relaxed mb-3">
                Система отслеживает более 350 астрономических событий на период 2022-2027:
              </p>
              <ul className="space-y-2 list-disc list-inside">
                <li><strong>Лунные события:</strong> Фазы луны, лунные затмения (13 событий)</li>
                <li><strong>Солнечные события:</strong> Солнцестояния, солнечные затмения (12 событий)</li>
                <li><strong>Планетарные события:</strong> Ретроградности, соединения планет (6 событий)</li>
                <li><strong>Метеорные потоки:</strong> 66 метеорных дождей с уникальными иконками</li>
                <li><strong>Кометные события:</strong> Более 25 кометных явлений</li>
              </ul>
            </section>

            <section>
              <h3 className="text-xl font-semibold text-white mb-3">🔮 Будущее развитие</h3>
              <p className="leading-relaxed">
                Планируется расширение функциональности: AI-анализ корреляций, портфолио-трекинг, 
                социальные функции, интеграция с дополнительными биржами и расширенная аналитика.
              </p>
            </section>

            <section className="border-t border-gray-600 pt-6">
              <p className="text-sm text-gray-400 text-center">
                AstroBit — исследование космических влияний на криптовалютные рынки
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}; 