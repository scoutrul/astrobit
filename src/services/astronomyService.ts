import * as Astronomia from 'astronomia';
import { AstroEvent } from '../types';

class AstronomyService {
  /**
   * Calculate lunar phases for a given date range
   */
  calculateLunarPhases(startDate: Date, endDate: Date): AstroEvent[] {
    const events: AstroEvent[] = [];
    const startYear = startDate.getFullYear();
    const endYear = endDate.getFullYear();
    
    try {
      for (let year = startYear; year <= endYear; year++) {
        // Get lunar phases for the year
        const phases = Astronomia.moonphase.year(year);
        
        phases.forEach((phase: number, index: number) => {
          const phaseDate = new Date(phase * 24 * 60 * 60 * 1000); // Convert from Julian days
          
          if (phaseDate >= startDate && phaseDate <= endDate) {
            const phaseType = index % 4;
            let title = '';
            let significance: 'low' | 'medium' | 'high' = 'medium';
            
            switch (phaseType) {
              case 0:
                title = 'New Moon';
                significance = 'high';
                break;
              case 1:
                title = 'First Quarter';
                significance = 'medium';
                break;
              case 2:
                title = 'Full Moon';
                significance = 'high';
                break;
              case 3:
                title = 'Last Quarter';
                significance = 'medium';
                break;
            }
            
            events.push({
              id: `lunar_${year}_${index}`,
              type: 'lunar_phase',
              timestamp: phaseDate.getTime(),
              title,
              description: `${title} phase of the moon`,
              significance,
            });
          }
        });
      }
    } catch (error) {
      console.error('[Astronomy Service] Error calculating lunar phases:', error);
    }
    
    return events.sort((a, b) => a.timestamp - b.timestamp);
  }
  
  /**
   * Calculate solar eclipses for a given date range
   * Note: This is a simplified implementation
   */
  calculateSolarEclipses(startDate: Date, endDate: Date): AstroEvent[] {
    const events: AstroEvent[] = [];
    
           // Simplified eclipse calculation - in production, use more sophisticated algorithms
       try {
         // const startYear = startDate.getFullYear();
         // const endYear = endDate.getFullYear();
         // These would be used for more sophisticated eclipse calculations
      
      // Known eclipse dates for demonstration (would use proper calculations in production)
      const knownEclipses = [
        { date: new Date('2024-04-08'), type: 'Total Solar Eclipse' },
        { date: new Date('2024-10-02'), type: 'Annular Solar Eclipse' },
        { date: new Date('2025-03-29'), type: 'Partial Solar Eclipse' },
        { date: new Date('2025-09-21'), type: 'Partial Solar Eclipse' },
      ];
      
      knownEclipses.forEach((eclipse, index) => {
        if (eclipse.date >= startDate && eclipse.date <= endDate) {
          events.push({
            id: `solar_eclipse_${index}`,
            type: 'solar_eclipse',
            timestamp: eclipse.date.getTime(),
            title: eclipse.type,
            description: `${eclipse.type} visible from certain locations`,
            significance: 'high',
          });
        }
      });
    } catch (error) {
      console.error('[Astronomy Service] Error calculating solar eclipses:', error);
    }
    
    return events.sort((a, b) => a.timestamp - b.timestamp);
  }
  
  /**
   * Calculate planetary aspects (simplified)
   */
  calculatePlanetaryAspects(startDate: Date, endDate: Date): AstroEvent[] {
    const events: AstroEvent[] = [];
    
    try {
      // Simplified planetary aspect calculation
      // In production, would use proper astronomical calculations
      const aspectTypes = [
        'Mercury-Venus Conjunction',
        'Mars-Jupiter Opposition',
        'Saturn-Neptune Square',
        'Venus-Mars Trine',
      ];
      
      const currentTime = startDate.getTime();
      const endTime = endDate.getTime();
      const timeSpan = endTime - currentTime;
      
      // Generate some sample aspects
      aspectTypes.forEach((aspect, index) => {
        const eventTime = currentTime + (timeSpan / aspectTypes.length) * (index + 1);
        
        events.push({
          id: `aspect_${index}`,
          type: 'planetary_aspect',
          timestamp: eventTime,
          title: aspect,
          description: `Planetary aspect: ${aspect}`,
          significance: 'medium',
        });
      });
    } catch (error) {
      console.error('[Astronomy Service] Error calculating planetary aspects:', error);
    }
    
    return events.sort((a, b) => a.timestamp - b.timestamp);
  }
  
  /**
   * Get all astronomical events for a date range
   */
  async getAstronomicalEvents(startDate: Date, endDate: Date): Promise<AstroEvent[]> {
    try {
      const lunarPhases = this.calculateLunarPhases(startDate, endDate);
      const solarEclipses = this.calculateSolarEclipses(startDate, endDate);
      const planetaryAspects = this.calculatePlanetaryAspects(startDate, endDate);
      
      const allEvents = [...lunarPhases, ...solarEclipses, ...planetaryAspects];
      
      return allEvents.sort((a, b) => a.timestamp - b.timestamp);
    } catch (error) {
      console.error('[Astronomy Service] Error getting astronomical events:', error);
      return [];
    }
  }
}

// Export singleton instance
export const astronomyService = new AstronomyService(); 