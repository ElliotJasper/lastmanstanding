export class DateHandler {
  /**
   * Generates an array of dates from today until the next Sunday?
   * @returns {string[]} - An array of dates
   */
  static generateDatesUntilSunday(): string[] {
    const formattedDates: string[] = [];
    const dateObj = new Date();
    
    // Start from current time for today's games
    formattedDates.push(dateObj.toISOString());
    
    // End of Sunday
    const endDate = new Date(dateObj);
    const daysUntilSunday = 7 - endDate.getDay();
    endDate.setDate(endDate.getDate() + daysUntilSunday);
    endDate.setHours(23, 59, 59, 999);
    formattedDates.push(endDate.toISOString());
    console.log(formattedDates)
    return formattedDates;
   }

  /**
   * Generates an array of dates from today until the previous Sunday
   * @returns {string[]} - An array of dates
   */
  static generateDatesUntilPreviousSunday(): string[] {
    const formattedDates: string[] = [];
    const dateObj = new Date();
    const currentDay = dateObj.getDay();
    const daysSinceSunday = currentDay === 0 ? 8 : currentDay + 2;

    for (let i = 0; i < daysSinceSunday; i++) {
      const newDate = new Date(dateObj);
      newDate.setDate(dateObj.getDate() - i);
      formattedDates.push(newDate.toISOString());
    }

    return formattedDates;
  }
}
