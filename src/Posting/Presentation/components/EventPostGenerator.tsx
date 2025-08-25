import React, { useState, useEffect } from 'react';
import { GeneratePostFromEventUseCase, GeneratePostFromEventRequest } from '../../Application/use-cases/GeneratePostFromEventUseCase';
import { LocalStoragePostRepository } from '../../Infrastructure/repositories/LocalStoragePostRepository';

interface AstronomicalEvent {
  id: string;
  name: string;
  type: string;
  date: string;
  description: string;
  significance?: string;
}

interface EventPostGeneratorProps {
  onPostGenerated: () => void;
}

export const EventPostGenerator: React.FC<EventPostGeneratorProps> = ({ onPostGenerated }) => {
  const [events, setEvents] = useState<AstronomicalEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<AstronomicalEvent | null>(null);
  const [scheduledDate, setScheduledDate] = useState('');
  const [generating, setGenerating] = useState(false);

  const repository = new LocalStoragePostRepository();
  const generateUseCase = new GeneratePostFromEventUseCase(repository);

  useEffect(() => {
    // Симуляция загрузки астрономических событий
    const mockEvents: AstronomicalEvent[] = [
      {
        id: '1',
        name: 'Лунное затмение',
        type: 'lunar_eclipse',
        date: '2024-12-31',
        description: 'Полное лунное затмение будет видно на большей части территории России. Луна приобретет красноватый оттенок.',
        significance: 'Высокая'
      },
      {
        id: '2',
        name: 'Квадрантиды',
        type: 'meteor_shower',
        date: '2024-12-28',
        description: 'Пик активности метеорного потока Квадрантиды. Ожидается до 40 метеоров в час.',
        significance: 'Средняя'
      },
      {
        id: '3',
        name: 'Соединение Венеры и Марса',
        type: 'planetary_conjunction',
        date: '2025-01-15',
        description: 'Венера и Марс сблизятся на небе на минимальное расстояние.',
        significance: 'Средняя'
      }
    ];
    setEvents(mockEvents);
  }, []);

  const handleGeneratePost = async () => {
    if (!selectedEvent) return;

    setGenerating(true);
    try {
      const request: GeneratePostFromEventRequest = {
        eventName: selectedEvent.name,
        eventDescription: selectedEvent.description,
        eventDate: new Date(selectedEvent.date),
        eventType: selectedEvent.type
      };

      const result = await generateUseCase.execute(request);
      
      if (result.isSuccess) {
        onPostGenerated();
        setSelectedEvent(null);
        setScheduledDate('');
      }
    } catch (error) {
      console.error('Ошибка генерации поста:', error);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-6 border border-purple-200">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-2xl">🌟</span>
        <h3 className="text-lg font-semibold text-gray-900">Генерация постов из событий</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Астрономическое событие
          </label>
          <select
            value={selectedEvent?.id || ''}
            onChange={(e) => {
              const event = events.find(ev => ev.id === e.target.value);
              setSelectedEvent(event || null);
            }}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            <option value="">Выберите событие</option>
            {events.map(event => (
              <option key={event.id} value={event.id}>
                {event.name} - {new Date(event.date).toLocaleDateString('ru-RU')}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Дата публикации (опционально)
          </label>
          <input
            type="datetime-local"
            value={scheduledDate}
            onChange={(e) => setScheduledDate(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>
      </div>

      {selectedEvent && (
        <div className="bg-white rounded-lg p-4 mb-4 border border-gray-200">
          <h4 className="font-medium text-gray-900 mb-2">{selectedEvent.name}</h4>
          <p className="text-gray-600 text-sm mb-2">{selectedEvent.description}</p>
          <div className="flex gap-4 text-xs text-gray-500">
            <span>📅 {new Date(selectedEvent.date).toLocaleDateString('ru-RU')}</span>
            <span>⭐ {selectedEvent.significance}</span>
            <span>🏷️ {selectedEvent.type}</span>
          </div>
        </div>
      )}

      <button
        onClick={handleGeneratePost}
        disabled={!selectedEvent || generating}
        className={`w-full py-2 px-4 rounded-lg font-medium ${
          selectedEvent && !generating
            ? 'bg-purple-600 text-white hover:bg-purple-700'
            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
        }`}
      >
        {generating ? '⏳ Генерация...' : '✨ Сгенерировать пост'}
      </button>
    </div>
  );
};
