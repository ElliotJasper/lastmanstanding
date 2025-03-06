import { SupabaseClient } from "./supabaseClient";

export class LeagueIdGenerator {
  private supabaseClient: SupabaseClient;
  private readonly length = 8;
  private readonly chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  constructor(supabaseClient: SupabaseClient) {
    this.supabaseClient = supabaseClient;
  }

  /**
   * Generates a random league ID
   * @returns {string} - A randomly generated league ID
   */
  generateLeagueId(): string {
    let leagueId = "";

    for (let i = 0; i < this.length; i++) {
      leagueId += this.chars.charAt(Math.floor(Math.random() * this.chars.length));
    }
    return leagueId;
  }

  /**
   * Ensures the league ID is unique
   * @returns {string} - A unique league ID
   */
  async getUniqueLeagueId(): Promise<string> {
    let leagueId = this.generateLeagueId();
    let league = await this.supabaseClient.getLeagueByCode(leagueId);

    while (league.length > 0) {
      leagueId = this.generateLeagueId();
      league = await this.supabaseClient.getLeagueByCode(leagueId);
    }

    return leagueId;
  }
}
