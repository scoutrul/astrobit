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
              <h3 className="text-xl font-semibold text-white mb-3">🌟 Идея проекта</h3>
              <p className="leading-relaxed">
                AstroBit — это уникальная платформа, которая исследует удивительную связь между космическими событиями и криптовалютными рынками. 
                Мы верим, что ритмы Вселенной могут влиять на настроения трейдеров и рыночные движения.
              </p>
            </section>

            <section>
              <h3 className="text-xl font-semibold text-white mb-3">🚀 Что вы можете делать</h3>
              <ul className="space-y-3 list-disc list-inside">
                <li><strong>Следить за рынками в реальном времени</strong> — получайте актуальные данные о криптовалютах с мгновенными обновлениями</li>
                <li><strong>Анализировать графики</strong> — изучайте ценовые движения на разных временных интервалах</li>
                <li><strong>Отслеживать космические события</strong> — узнавайте о лунных фазах, затмениях, метеорных потоках</li>
                <li><strong>Исследовать корреляции</strong> — находите интересные связи между небесными явлениями и рыночными движениями</li>
                <li><strong>Планировать торговые стратегии</strong> — используйте астрономический календарь для принятия решений</li>
              </ul>
            </section>

            <section>
              <h3 className="text-xl font-semibold text-white mb-3">🌙 Космические события</h3>
              <p className="leading-relaxed mb-3">
                Наша система отслеживает более 350 астрономических событий:
              </p>
              <ul className="space-y-2 list-disc list-inside">
                <li><strong>Лунные циклы:</strong> новолуние, полнолуние, затмения</li>
                <li><strong>Солнечная активность:</strong> солнцестояния, равноденствия, солнечные затмения</li>
                <li><strong>Планетарные движения:</strong> соединения планет, ретроградности</li>
                <li><strong>Метеорные потоки:</strong> звездные дожди с уникальными характеристиками</li>
                <li><strong>Кометные явления:</strong> редкие космические гости</li>
              </ul>
            </section>

            <section>
              <h3 className="text-xl font-semibold text-white mb-3">💡 Как это работает</h3>
              <p className="leading-relaxed">
                Мы собираем данные о криптовалютных ценах и астрономических событиях, анализируем их на предмет возможных связей 
                и предоставляем вам инструменты для самостоятельного исследования. Это не финансовый совет — это возможность 
                увидеть рынки с новой, космической перспективы.
              </p>
            </section>

            <section>
              <h3 className="text-xl font-semibold text-white mb-3">🎯 Для кого это</h3>
              <ul className="space-y-2 list-disc list-inside">
                <li><strong>Трейдеры и инвесторы</strong> — ищете новые углы анализа рынков</li>
                <li><strong>Астрономы-любители</strong> — интересуетесь космическими событиями</li>
                <li><strong>Исследователи</strong> — изучаете необычные корреляции в данных</li>
                <li><strong>Любознательные умы</strong> — верите в связь между макро и микро</li>
              </ul>
            </section>

            <section>
              <h3 className="text-xl font-semibold text-white mb-3">🔮 Будущие возможности</h3>
              <p className="leading-relaxed">
                В планах: умный анализ корреляций, персональные уведомления о важных событиях, 
                социальные функции для обмена идеями, расширенная аналитика и многое другое.
              </p>
            </section>

            <section className="border-t border-gray-600 pt-6">
              <div className="text-center space-y-3">
                <p className="text-sm text-gray-400">
                  AstroBit — где космос встречается с криптовалютами
                </p>
                <a 
                  href="https://github.com/scoutrul/astrobit" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-xs text-gray-500 hover:text-gray-300 transition-colors"
                >
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                  </svg>
                  GitHub
                </a>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}; 