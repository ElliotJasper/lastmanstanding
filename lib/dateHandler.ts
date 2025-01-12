export class DateHandler {
  /**
   * Generates an array of dates from today until the next Sunday?
   * @returns {string[]} - An array of dates
   */
  static generateDaysFridayToMonday(): string[] {
    const formattedDates: string[] = [];
    const currentDate = new Date();
    let startDate: Date;
    let endDate: Date;

    // Determine if we're in the current Friday-Monday period
    const currentDay = currentDate.getDay(); // 0 = Sunday, 6 = Saturday
    const isInCurrentPeriod = currentDay >= 5 || currentDay === 0 || currentDay === 1;

    if (isInCurrentPeriod) {
        // Calculate back to the most recent Friday
        startDate = new Date(currentDate);
        const daysToSubtract = currentDay === 0 ? 2 : // If Sunday, go back 2 days
                              currentDay === 1 ? 3 : // If Monday, go back 3 days
                              currentDay - 5;        // If Fri/Sat, go back to Friday
        startDate.setDate(currentDate.getDate() - daysToSubtract);
    } else {
        // Calculate forward to the next Friday
        startDate = new Date(currentDate);
        const daysToAdd = 5 - currentDay;
        startDate.setDate(currentDate.getDate() + daysToAdd);
    }

    // Set start date to beginning of day
    startDate.setHours(0, 0, 0, 0);
    formattedDates.push(startDate.toISOString());

    // Calculate end date (Monday)
    endDate = new Date(startDate);
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
