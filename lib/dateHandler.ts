export class DateHandler {
  /**
   * Generates an array of dates from today until the next Sunday?
   * @returns {string[]} - An array of dates
   */
  static generateDaysFridayToMonday(): string[] {
    const formattedDates: string[] = [];
    const currentDate = new Date();
    
    // Calculate days until next Friday
    let daysUntilFriday = 5 - currentDate.getDay();
    if (daysUntilFriday <= 0) {
        daysUntilFriday += 7; // If we're past Friday, get next Friday
    }
    
    // Set start date (Friday)
    const startDate = new Date(currentDate);
    startDate.setDate(currentDate.getDate() + daysUntilFriday);
    startDate.setHours(0, 0, 0, 0);
    formattedDates.push(startDate.toISOString());
    
    // Set end date (following Monday)
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 3); // Add 3 days to get to Monday
    endDate.setHours(23, 59, 59, 999);
    formattedDates.push(endDate.toISOString());
    
    return formattedDates;
  }

  /**
   * Generates an array of dates from today until the previous Sunday
   * @returns {string[]} - An array of dates
   */
  static generateDatesUntilPreviousSunday(): string[] {
    const formattedDates: string[] = [];
    const dateObj = new Date();
  
    // Calculate days since the last Sunday
    const currentDay = dateObj.getDay();
    const daysSinceSunday = currentDay === 0 ? 8 : currentDay + 2;
  
    // Generate dates up to the previous Sunday
    for (let i = daysSinceSunday - 1; i >= 0; i--) {
      const newDate = new Date(dateObj);
      newDate.setDate(dateObj.getDate() - i);
      formattedDates.push(newDate.toISOString());
    }
  
    // Generate dates 5 days into the future
    const daysIntoFuture = 8;
    for (let i = 1; i <= daysIntoFuture; i++) {
      const newDate = new Date(dateObj);
      newDate.setDate(dateObj.getDate() + i);
      formattedDates.push(newDate.toISOString());
    }
  
    return formattedDates;
  }
  
  /**
   * Checks if the current date falls between Friday and Monday (inclusive)
   * @returns {boolean} - True if current date is Friday, Saturday, Sunday, or Monday
   */
  static isWeekendPeriod(): boolean {
    const currentDay = new Date().getDay();
    // 5 = Friday, 6 = Saturday, 0 = Sunday, 1 = Monday
    return currentDay === 5 || currentDay === 6 || currentDay === 0 || currentDay === 1;
  }
}
