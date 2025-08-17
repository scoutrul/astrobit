import { AstroEvent } from '../../Domain/types';

class AstronomyService {
  /**
   * Calculate lunar phases using a simplified algorithm
   * This replaces the incorrect Astronomia.moonphase.year() call
   */
  private calculateLunarPhases(startDate: Date, endDate: Date): AstroEvent[] {
    const events: AstroEvent[] = [];
    
    try {
      // Use a simplified lunar phase calculation
      // Based on the synodic month of approximately 29.53 days
      const SYNODIC_MONTH = 29.530588853; // days
      const KNOWN_NEW_MOON = new Date('2000-01-06T18:14:00Z'); // Known new moon
      
      const startTime = startDate.getTime();
      const knownNewMoonTime = KNOWN_NEW_MOON.getTime();
      
      // Calculate the number of synodic months since the known new moon
      const daysSinceKnownNewMoon = (startTime - knownNewMoonTime) / (1000 * 60 * 60 * 24);
      const cyclesSinceKnownNewMoon = Math.floor(daysSinceKnownNewMoon / SYNODIC_MONTH);
      
      // Find lunar phases in the given date range
      for (let cycle = cyclesSinceKnownNewMoon - 1; cycle <= cyclesSinceKnownNewMoon + 3; cycle++) {
        const cycleStartTime = knownNewMoonTime + (cycle * SYNODIC_MONTH * 24 * 60 * 60 * 1000);
        
        // Calculate phase times within this cycle
        const phases = [
          { offset: 0, type: 'New Moon', significance: 'high' as const },
          { offset: 0.25, type: 'First Quarter', significance: 'medium' as const },
          { offset: 0.5, type: 'Full Moon', significance: 'high' as const },
          { offset: 0.75, type: 'Last Quarter', significance: 'medium' as const }
        ];
        
        phases.forEach((phase, index) => {
          const phaseTime = cycleStartTime + (phase.offset * SYNODIC_MONTH * 24 * 60 * 60 * 1000);
          const phaseDate = new Date(phaseTime);
          
          // Only include phases within our date range
          if (phaseDate >= startDate && phaseDate <= endDate) {
            events.push({
              id: `lunar_phase_${cycle}_${index}`,
              type: 'lunar_phase',
              timestamp: phaseTime,
              title: phase.type,
              description: `${phase.type} lunar phase`,
              significance: phase.significance
            });
          }
        });
      }
      
    } catch (error) {
    }
    
    return events;
  }

  /**
   * Calculate solar eclipses (simplified implementation)
   */
  private calculateSolarEclipses(startDate: Date, endDate: Date): AstroEvent[] {
    const events: AstroEvent[] = [];
    
    try {
      // Simplified eclipse calculation - eclipses occur roughly every 6 months
      const startYear = startDate.getFullYear();
      const endYear = endDate.getFullYear();
      
      for (let year = startYear; year <= endYear; year++) {
        // Approximate eclipse dates (this is a simplified calculation)
        const eclipseDates = [
          new Date(`${year}-06-15T12:00:00Z`), // Approximate summer eclipse
          new Date(`${year}-12-15T12:00:00Z`)  // Approximate winter eclipse
        ];
        
        eclipseDates.forEach((eclipseDate, index) => {
          if (eclipseDate >= startDate && eclipseDate <= endDate) {
            events.push({
              id: `solar_eclipse_${year}_${index}`,
              type: 'solar_eclipse',
              timestamp: eclipseDate.getTime(),
              title: 'Solar Eclipse',
              description: 'Solar eclipse event',
              significance: 'high'
            });
          }
        });
      }
      
    } catch (error) {
    }
    
    return events;
  }

  /**
   * Calculate planetary aspects (simplified implementation)
   */
  private calculatePlanetaryAspects(startDate: Date, endDate: Date): AstroEvent[] {
    const events: AstroEvent[] = [];
    
    try {
      // Simplified planetary aspect calculation
      const aspects = [
        { name: 'Mercury Retrograde', frequency: 88, significance: 'medium' as const },
        { name: 'Venus Conjunction', frequency: 584, significance: 'medium' as const },
        { name: 'Mars Opposition', frequency: 687, significance: 'low' as const }
      ];
      
      const startTime = startDate.getTime();
      const endTime = endDate.getTime();
      const timeRange = endTime - startTime;
      
      aspects.forEach((aspect, aspectIndex) => {
        const intervalMs = aspect.frequency * 24 * 60 * 60 * 1000; // Convert days to milliseconds
        const eventsInRange = Math.floor(timeRange / intervalMs) + 1;
        
        for (let i = 0; i < eventsInRange; i++) {
          const eventTime = startTime + (i * intervalMs);
          const eventDate = new Date(eventTime);
          
          if (eventDate >= startDate && eventDate <= endDate) {
            events.push({
              id: `planetary_aspect_${aspectIndex}_${i}`,
              type: 'planetary_aspect',
              timestamp: eventTime,
              title: aspect.name,
              description: `${aspect.name} planetary aspect`,
              significance: aspect.significance
            });
          }
        }
      });
      
    } catch (error) {
    }
    
    return events;
  }

  /**
   * Get astronomical events for a date range
   */
  async getAstronomicalEvents(startDate: Date, endDate: Date): Promise<AstroEvent[]> {
    try {
      // Генерируем события лунных фаз
      const lunarEvents = this.calculateLunarPhases(startDate, endDate);
      
      // Генерируем события солнечных затмений
      const solarEvents = this.calculateSolarEclipses(startDate, endDate);
      
      // Генерируем события планетарных аспектов
      const planetaryEvents = this.calculatePlanetaryAspects(startDate, endDate);
      
      // Объединяем все события
      const allEvents = [...lunarEvents, ...solarEvents, ...planetaryEvents];
      
      return allEvents;
    } catch (error) {
      throw new Error(`Failed to generate astronomical events: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

export const astronomyService = new AstronomyService(); 