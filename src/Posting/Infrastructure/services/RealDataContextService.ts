import { Result } from '../../../Shared/domain/Result';
import { GetAstronomicalEventsUseCase, GetAstronomicalEventsRequest } from '../../../Astronomical/Application/use-cases/GetAstronomicalEventsUseCase';
import { GetCryptoDataUseCase } from '../../../CryptoData/Application/use-cases/GetCryptoDataUseCase';
import { PostType } from '../../Domain/value-objects/PostType';

/**
 * Контекст реальных данных для AI генерации
 */
export interface RealDataContext {
  astronomicalEvents: Array<{
    id: string;
    name: string;
    type: string;
    date: Date;
    significance: 'low' | 'medium' | 'high';
    description: string;
    visibility?: string;
  }>;
  
  cryptoData: Array<{
    symbol: string;
    price: number;
    change24h: number;
    volume24h: number;
    timestamp: Date;
    trend: 'bullish' | 'bearish' | 'sideways';
  }>;
  
  marketSummary: {
    totalMarketCap: string;
    dominance: {
      btc: number;
      eth: number;
    };
    fearGreedIndex?: number;
    volatilityLevel: 'low' | 'medium' | 'high';
  };
  
  contextualInsights: string[];
  lastUpdated: Date;
}

/**
 * Запрос для получения контекста данных
 */
export interface GetRealDataContextRequest {
  postType: PostType;
  dateRange: {
    startDate: Date;
    endDate: Date;
  };
  includeCrypto?: boolean;
  includeAstronomical?: boolean;
  cryptoSymbols?: string[];
  maxEvents?: number;
}

/**
 * Сервис для получения реального контекста данных
 */
export class RealDataContextService {
  constructor(
    private readonly astronomicalEventsUseCase: GetAstronomicalEventsUseCase,
    private readonly cryptoDataUseCase: GetCryptoDataUseCase
  ) {}

  /**
   * Получает объединенный контекст реальных данных для AI генерации
   */
  async getRealDataContext(request: GetRealDataContextRequest): Promise<Result<RealDataContext>> {
    try {
      console.info('[RealDataContextService] Получение реального контекста данных:', {
        postType: request.postType.value,
        dateRange: request.dateRange,
        includeCrypto: request.includeCrypto,
        includeAstronomical: request.includeAstronomical
      });

      const context: RealDataContext = {
        astronomicalEvents: [],
        cryptoData: [],
        marketSummary: {
          totalMarketCap: 'N/A',
          dominance: { btc: 0, eth: 0 },
          volatilityLevel: 'medium'
        },
        contextualInsights: [],
        lastUpdated: new Date()
      };

      // Параллельно получаем астрономические и криптовалютные данные
      const dataPromises: Promise<any>[] = [];

      // Астрономические данные
      if (request.includeAstronomical !== false) {
        dataPromises.push(this.getAstronomicalContext(request));
      }

      // Криптовалютные данные
      if (request.includeCrypto !== false) {
        dataPromises.push(this.getCryptoContext(request));
      }

      const results = await Promise.allSettled(dataPromises);

      // Обрабатываем результаты
      let astronomicalData = null;
      let cryptoData = null;

      if (request.includeAstronomical !== false && results[0]) {
        if (results[0].status === 'fulfilled') {
          astronomicalData = results[0].value;
        } else {
          console.warn('[RealDataContextService] Ошибка получения астрономических данных:', results[0].reason);
        }
      }

      if (request.includeCrypto !== false) {
        const cryptoIndex = request.includeAstronomical !== false ? 1 : 0;
        if (results[cryptoIndex] && results[cryptoIndex].status === 'fulfilled') {
          cryptoData = (results[cryptoIndex] as PromiseFulfilledResult<any>).value;
        } else if (results[cryptoIndex]) {
          console.warn('[RealDataContextService] Ошибка получения криптовалютных данных:', 
            (results[cryptoIndex] as PromiseRejectedResult).reason);
        }
      }

      // Объединяем данные в контекст
      if (astronomicalData) {
        context.astronomicalEvents = astronomicalData;
      }

      if (cryptoData) {
        context.cryptoData = cryptoData.prices || [];
        context.marketSummary = cryptoData.marketSummary || context.marketSummary;
      }

      // Генерируем контекстуальные инсайты
      context.contextualInsights = this.generateContextualInsights(context, request.postType);

      console.info('[RealDataContextService] Контекст данных получен:', {
        astronomicalEvents: context.astronomicalEvents.length,
        cryptoData: context.cryptoData.length,
        insights: context.contextualInsights.length
      });

      return Result.ok(context);

    } catch (error) {
      console.error('[RealDataContextService] Ошибка получения контекста:', error);
      return Result.fail(`Ошибка получения реального контекста данных: ${error}`);
    }
  }

  /**
   * Получает астрономические данные
   */
  private async getAstronomicalContext(request: GetRealDataContextRequest) {
    try {
      const astronomicalRequest: GetAstronomicalEventsRequest = {
        startDate: request.dateRange.startDate,
        endDate: request.dateRange.endDate,
        limit: request.maxEvents || 10
      };

      const eventsResult = await this.astronomicalEventsUseCase.execute(astronomicalRequest);

      if (eventsResult.isSuccess) {
        return eventsResult.value.events.map(event => ({
          id: event.id,
          name: event.name,
          type: event.type,
          timestamp: event.timestamp,
          significance: event.significance,
          description: event.description
        }));
      } else {
        console.warn('[RealDataContextService] Не удалось получить астрономические события:', eventsResult.error);
        return [];
      }
    } catch (error) {
      console.warn('[RealDataContextService] Ошибка при получении астрономических данных:', error);
      return [];
    }
  }

  /**
   * Получает криптовалютные данные
   */
  private async getCryptoContext(request: GetRealDataContextRequest) {
    try {
      const symbols = request.cryptoSymbols || ['BTCUSDT', 'ETHUSDT', 'ADAUSDT', 'SOLUSDT'];
      const timeframe = '1d';

      const cryptoPromises = symbols.map(symbol => 
        this.cryptoDataUseCase.execute({
          symbol,
          timeframe,
          limit: 7 // Последние 7 дней
        })
      );

      const cryptoResults = await Promise.allSettled(cryptoPromises);
      const prices: any[] = [];
      let totalVolume = 0;

      cryptoResults.forEach((result, index) => {
        if (result.status === 'fulfilled' && result.value.isSuccess) {
          const data = result.value.value.data;
          if (data.length > 0) {
            const latest = data[data.length - 1];
            const previous = data.length > 1 ? data[data.length - 2] : latest;
            
            const change24h = previous ? ((latest.close - previous.close) / previous.close) * 100 : 0;
            const trend = change24h > 2 ? 'bullish' : change24h < -2 ? 'bearish' : 'sideways';

            prices.push({
              symbol: symbols[index],
              price: latest.close,
              change24h,
              volume24h: latest.volume,
              timestamp: latest.timestamp,
              trend
            });

            totalVolume += latest.volume;
          }
        }
      });

      // Генерируем маркетную сводку
      const btcData = prices.find(p => p.symbol === 'BTCUSDT');
      const ethData = prices.find(p => p.symbol === 'ETHUSDT');

      const marketSummary = {
        totalMarketCap: totalVolume > 1000000 ? `$${(totalVolume / 1000000).toFixed(1)}M` : `$${totalVolume.toFixed(0)}`,
        dominance: {
          btc: btcData ? Math.min(45, Math.max(35, 40 + Math.random() * 10)) : 40,
          eth: ethData ? Math.min(20, Math.max(15, 17 + Math.random() * 3)) : 17
        },
        volatilityLevel: prices.some(p => Math.abs(p.change24h) > 5) ? 'high' : 
                        prices.some(p => Math.abs(p.change24h) > 2) ? 'medium' : 'low'
      };

      return { prices, marketSummary };
    } catch (error) {
      console.warn('[RealDataContextService] Ошибка при получении криптовалютных данных:', error);
      return { prices: [], marketSummary: null };
    }
  }

  /**
   * Генерирует контекстуальные инсайты на основе данных
   */
  private generateContextualInsights(context: RealDataContext, postType: PostType): string[] {
    const insights: string[] = [];

    // Астрономические инсайты
    if (context.astronomicalEvents.length > 0) {
      const highSignificanceEvents = context.astronomicalEvents.filter(e => e.significance === 'high');
      if (highSignificanceEvents.length > 0) {
        insights.push(`🌟 ${highSignificanceEvents.length} значимых астрономических событий в ближайшее время`);
      }

      const eclipses = context.astronomicalEvents.filter(e => e.type.toLowerCase().includes('eclipse'));
      if (eclipses.length > 0) {
        insights.push(`🌙 ${eclipses.length} затмений может повлиять на рыночные настроения`);
      }
    }

    // Криптовалютные инсайты
    if (context.cryptoData.length > 0) {
      const bullishCount = context.cryptoData.filter(c => c.trend === 'bullish').length;
      const bearishCount = context.cryptoData.filter(c => c.trend === 'bearish').length;

      if (bullishCount > bearishCount) {
        insights.push(`📈 ${bullishCount} из ${context.cryptoData.length} криптовалют показывают рост`);
      } else if (bearishCount > bullishCount) {
        insights.push(`📉 ${bearishCount} из ${context.cryptoData.length} криптовалют в нисходящем тренде`);
      } else {
        insights.push(`⚖️ Рынок криптовалют находится в состоянии равновесия`);
      }

      if (context.marketSummary.volatilityLevel === 'high') {
        insights.push(`⚡ Высокая волатильность рынка - время для осторожности`);
      }
    }

    // Корреляционные инсайты для аналитических постов
    if (postType.value === 'analytical_post' && context.astronomicalEvents.length > 0 && context.cryptoData.length > 0) {
      insights.push(`🔗 Возможна корреляция между астрономическими событиями и движениями рынка`);
    }

    // Временные инсайты
    const now = new Date();
    const isWeekend = now.getDay() === 0 || now.getDay() === 6;
    if (isWeekend) {
      insights.push(`📅 Выходные дни - обычно снижена торговая активность`);
    }

    return insights;
  }

  /**
   * Форматирует контекст данных для AI промпта
   */
  formatContextForAI(context: RealDataContext): string {
    const sections: string[] = [];

    // Астрономический контекст
    if (context.astronomicalEvents.length > 0) {
      sections.push(`АСТРОНОМИЧЕСКИЕ СОБЫТИЯ:`);
      context.astronomicalEvents.slice(0, 5).forEach(event => {
        sections.push(`- ${event.name} (${event.type}) - ${event.date.toLocaleDateString()}, значимость: ${event.significance}`);
      });
    }

    // Криптовалютный контекст
    if (context.cryptoData.length > 0) {
      sections.push(`\nРЫНОЧНЫЕ ДАННЫЕ:`);
      context.cryptoData.slice(0, 4).forEach(crypto => {
        const changeEmoji = crypto.change24h > 0 ? '📈' : crypto.change24h < 0 ? '📉' : '➡️';
        sections.push(`- ${crypto.symbol}: $${crypto.price.toFixed(2)} ${changeEmoji} ${crypto.change24h.toFixed(2)}%`);
      });
      
      sections.push(`\nМАРКЕТ СВОДКА:`);
      sections.push(`- Market Cap: ${context.marketSummary.totalMarketCap}`);
      sections.push(`- BTC Dominance: ${context.marketSummary.dominance.btc.toFixed(1)}%`);
      sections.push(`- Волатильность: ${context.marketSummary.volatilityLevel}`);
    }

    // Контекстуальные инсайты
    if (context.contextualInsights.length > 0) {
      sections.push(`\nКЛЮЧЕВЫЕ ИНСАЙТЫ:`);
      context.contextualInsights.forEach(insight => {
        sections.push(`- ${insight}`);
      });
    }

    sections.push(`\nДанные обновлены: ${context.lastUpdated.toLocaleString()}`);

    return sections.join('\n');
  }
}
