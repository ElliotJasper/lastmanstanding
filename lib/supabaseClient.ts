import { createClient} from "../utils/supabase/server.js";
import { createServiceClient } from "../utils/supabase/server.js";
import { DateHandler } from "./dateHandler";
import { LeagueIdGenerator } from "./leagueIdGenerator";

export class SupabaseClient {
  private client;
  private leagueIdGenerator: LeagueIdGenerator;
  private serviceClient;

  constructor() {
    this.client = createClient();
    this.leagueIdGenerator = new LeagueIdGenerator(this);
    this.serviceClient = createServiceClient();
  }

  /**
   * Gets the authenticated user or null if not authenticated
   * @returns {Promise<User | null>} - The authenticated user or null
   */
  async getAuthenticatedUser(): Promise<User | null> {
    const { data, error: authError } = await this.client.auth.getUser();

    if (authError) throw new Error("Error fetching authenticated user");
    return data?.user ?? null;
  }

  /**
   * Gets all the leagues a user is in
   * @param userId
   * @returns {Promise<UserLeagues[]>} - User's leagues
   */
  async getUserLeagues(userId: string): Promise<UserLeagues[]> {
    const { data: leagues, error } = await this.serviceClient
      .from("league_users")
      .select(`leagues (*), isEliminated, canPick, winner`)
      .eq("user_id", userId);

    if (error) {
      throw new Error(error.message);
    }

    return leagues;
  }

  /**
   * Creates a league and associates the user with it
   * @param name
   * @param userId
   * @returns {Promise<League>} - The created league
   */
  async createLeague(name: string, userId: string): Promise<League> {
    const code: string = await this.leagueIdGenerator.getUniqueLeagueId();

    const { data: createdLeague, error: leagueError } = await this.serviceClient
      .from("leagues")
      .insert({
        name: name,
        code: code,
        user_id: userId,
      })
      .select()
      .returns<League[]>();

    if (leagueError) {
      throw new Error(`Error creating league: ${leagueError.message}`);
    }

    const { error: userLeagueError } = await this.serviceClient.from("league_users").insert({
      user_id: userId,
      league_id: createdLeague[0].id,
    });

    if (userLeagueError) {
      throw new Error(`Error associating user with league: ${userLeagueError.message}`);
    }

    return createdLeague[0];
  }

  /**
   * Gets all the users of a league (user_id and isEliminated)
   * @param leagueId
   * @returns {Promise<LeagueUserSummary>} - Users of a league
   */
  async getLeagueUsers(leagueId: string): Promise<LeagueUserSummary[]> {
    const { data: leagueUsers, error: leagueUsersError } = await this.serviceClient
      .from("league_users")
      .select("user_id, isEliminated, winner")
      .eq("league_id", parseInt(leagueId))
      .returns<LeagueUserSummary[]>();

    if (leagueUsersError) {
      throw new Error(`Error fetching league users: ${leagueUsersError.message}`);
    }

    return leagueUsers;
  }

  /**
   * Gets the display names of the users passed in
   * @param userIds
   * @returns {Promise<any>} - Users display names
   */
  async getUserDisplayNames(userIds: string[]): Promise<any> {
    const { data: users, error: usersError } = await this.serviceClient
      .from("profiles")
      .select("user_id, display_name")
      .in("user_id", userIds);

    if (usersError) {
      throw new Error(`Error fetching user display names: ${usersError.message}`);
    }

    return users;
  }

  /**
   * Gets all the games that are pickable
   * @returns {Promise<any>} - All pickable games / teams
   */
  async getPickableGames(): Promise<any> {
    const dates = DateHandler.generateDaysFridayToMonday();

    const { data: games, error: picksError } = await this.serviceClient
    .from("games")
    .select("homeTeam, awayTeam, date, eventProgress, league")
    .gt("date", dates[0])
    .lte("date", dates[dates.length - 1])
    .eq("eventProgress", "PreEvent") // Filter for matchStatus being PreEvent
    .order("date", { ascending: true });
      
    if (picksError) {
      console.error("Picks Error Details:", picksError);
      throw new Error(`Error fetching pickable games: ${picksError.message}`);
    }

    const gameDetails = games.flatMap((game) => [
      {
        team: game.homeTeam,
        date: game.date,
        opponent: game.awayTeam,
        league: game.league,
      },
      {
        team: game.awayTeam,
        date: game.date,
        opponent: game.homeTeam,
        league: game.league,
      },
    ]);

    return gameDetails;
  }

  /**
   * Gets the previous games between certain dates
   * @returns {Promise<any>} - Previous games
   */
  async getPreviousGames(): Promise<any> {
    const dates = DateHandler.generateDatesUntilPreviousSunday();

    const { data: games, error: picksError } = await this.serviceClient
      .from("games")
      .select("homeTeam, awayTeam, homeScore, awayScore, date, id, eventProgress, league, minute")
      .gte("date", dates[0])
      .lte("date", dates[dates.length - 1])
      .order("date", { ascending: true });

    if (picksError) {
      throw new Error(`Error fetching previous games: ${picksError.message}`);
    }

    return games;
  }

  /**
   * Gets games(s) that match date and team name
   * @param gameData 
   * @returns  {Promise<any>} - Game
   */
  async getSingleGame(date: Date, team: string): Promise<any> {
    const { data: game, error: gameError } = await this.serviceClient
      .from("games")
      .select("homeTeam, awayTeam, eventProgress, league")
      .or(`homeTeam.eq.${team},awayTeam.eq.${team}`)
      .eq("date", date);

    if (gameError) {
      throw new Error(`Error fetching previous games: ${gameError.message}`);
    }
  
    return game;
  }
  

  /**
   * Gets the picks a user has already made in a league
   * @param userId
   * @param leagueId
   * @returns {Promise<any>} - Users picks
   */
  async getUserPicks(userId: string, leagueId: number): Promise<any> {
    const { data: picks, error: picksError } = await this.serviceClient
      .from("picks")
      .select("teamName, date, outcome")
      .eq("user_id", userId)
      .eq("league_id", leagueId);

    if (picksError) {
      throw new Error(`Error fetching picks: ${picksError.message}`);
    }
        
    return picks;
  }

  /**
   * Gets isEliminated and winner status of a user in a league
   * @param userId
   * @param leagueId
   * @returns {Promise<LeagueUser>} - Information about the user in the league
   */

  async getLeagueUserData(userId: string, leagueId: number): Promise<LeagueUser> {
    const { data: leagueUserData, error: leagueUserDataError } = await this.serviceClient
      .from("league_users")
      .select("isEliminated, winner, canPick")
      .eq("user_id", userId)
      .eq("league_id", leagueId)
      .single();

    if (leagueUserDataError) {
      throw new Error(`Error fetching league user data: ${leagueUserDataError.message}`);
    }

    return leagueUserData;
  }

  /**
   * Checks if a league with given code exists
   * @param code
   * @returns A league with given code if exists
   */
  async getLeagueByCode(code: string): Promise<any> {
    const { data: league, error: leagueError } = await this.serviceClient.from("leagues").select("id").eq("code", code);
    if (leagueError) {
      throw new Error(`Error fetching league: ${leagueError.message}`);
    }

    return league;
  }

  /**
   * Adds a user to a league if the league is inactive
   * @param userId
   * @param leagueId
   */
  async addUserToLeague(userId: string, leagueId: number): Promise<void> {
    // Check if the league is inactive
    const { data: league, error: leagueCheckError } = await this.serviceClient
      .from("leagues")
      .select("isactive")
      .eq("id", leagueId)
      .single();

    if (leagueCheckError) {
      throw new Error(`Error fetching league status: ${leagueCheckError.message}`);
    }

    if (league?.isactive) {
      throw new Error(`Cannot join league: the league is active`);
    }

    // Proceed to add user to league
    const { data: added, error: joinLeagueError } = await this.serviceClient.from("league_users").insert({
      user_id: userId,
      league_id: leagueId,
    });

    if (joinLeagueError) {
      throw new Error(`Error joining league: ${joinLeagueError.message}`);
    }
  }

  /**
   * Get info about a league
   * @param leagueId
   * @returns
   */
  async getLeagueInfo(leagueId: number): Promise<any> {
    const { data: league, error: leagueError } = await this.serviceClient
      .from("leagues")
      .select("isactive, user_id, created_at, name, code")
      .eq("id", leagueId)
      .single();

    if (leagueError) {
      throw new Error(`Error fetching league info: ${leagueError.message}`);
    }

    return league;
  }

  /**
   * Set the league as active
   * @param leagueId
   */
  async activateLeague(leagueId: number, clientId: string): Promise<any> {
    const isWeekendPeriod = DateHandler.isWeekendPeriod();
    if (isWeekendPeriod) {
      return { error: "Cannot activate league during the weekend period" };
    }
  
    if (!this.isLeagueCreator(leagueId, clientId)) {
      return { error: "You are not the creator of this league" };
    }
  
    const { error: leagueError } = await this.serviceClient
      .from("leagues")
      .update({ isactive: true })
      .eq("id", leagueId);
      
    if (leagueError) {
      return { error: `Error activating league: ${leagueError.message}` };
    }
  
    return { success: `League ${leagueId} has been activated` };
  }

  /**
   * Get the profile of a user
   * @param userId
   * @returns
   */
  async getProfile(userId: string): Promise<any> {
    const { data: profile, error: profileError } = await this.serviceClient
      .from("profiles")
      .select("display_name")
      .eq("user_id", userId)
      .single();

    if (profileError) {
      throw new Error(`Error fetching profile: ${profileError.message}`);
    }

    return profile;
  }

  /**
   * Update the profile of a user
   * @param userId
   * @param displayName
   */
  async updateProfile(userId: string, displayName: string): Promise<void> {
    const { error: profileError } = await this.serviceClient
      .from("profiles")
      .update({ display_name: displayName })
      .eq("user_id", userId);
    if (profileError) {
      console.error("Error updating profile:", profileError.message);
      throw profileError;
    }
  }

  /**
   * Downloads the avatar of a user
   * @param userId
   * @returns
   */
  async downloadAvatar(userId: string) {
    // List all files in the "avatars" bucket
    const { data, error } = await this.serviceClient.storage.from("avatars").list();

    if (error) {
      throw new Error(error.message);
    }

    // Try to find the file with the userId and possible extensions (e.g., .png, .jpg)
    const possibleExtensions = ["png", "jpg", "jpeg", "gif"]; // Add more extensions if needed
    for (const ext of possibleExtensions) {
      const fileName = `${userId}.${ext}`;
      const file = data.find((file) => file.name === fileName);

      if (file) {
        // If file is found, generate and return its public URL
        const {
          data: { publicUrl },
          error: urlError,
        } = this.serviceClient.storage.from("avatars").getPublicUrl(fileName);

        if (urlError) {
          throw new Error(urlError.message);
        }
        return publicUrl;
      }
    }

    // If no file is found, return the default avatar URL
    const {
      data: { publicUrl },
      error: defaultUrlError,
    } = this.serviceClient.storage.from("avatars").getPublicUrl("default-pfp.jpg");

    if (defaultUrlError) {
      throw new Error(defaultUrlError.message);
    }

    return publicUrl;
  }

  /**
   * Uploads the avatar of a user and deletes the previous one if it exists
   * @param userId
   * @param fileBuffer
   * @param mimeType
   * @returns
   */
  async uploadAvatar(userId: string, fileBuffer: Buffer, mimeType: string) {
    // List all files in the "avatars" bucket
    const { data: listData, error: listError } = await this.serviceClient.storage.from("avatars").list();

    if (listError) {
      throw new Error(`Failed to list files: ${listError.message}`);
    }

    // Find any file that starts with the userId (e.g., "userId.extension")
    const existingFile = listData?.find((file) => file.name.startsWith(userId));

    // If an existing file is found, delete it
    if (existingFile) {
      const { error: deleteError } = await this.serviceClient.storage.from("avatars").remove([existingFile.name]);
      if (deleteError) {
        throw new Error(`Failed to delete existing avatar: ${deleteError.message}`);
      }
    }

    // Construct the new file path with userId and appropriate extension based on mimeType
    const extension = mimeType.split("/")[1];
    const newFilePath = `${userId}`;

    // Upload the new avatar
    const { data: uploadData, error: uploadError } = await this.serviceClient.storage
      .from("avatars")
      .upload(newFilePath, fileBuffer, {
        contentType: mimeType,
      });

    if (uploadError) {
      throw new Error(`Failed to upload avatar: ${uploadError.message}`);
    }

    return uploadData;
  }

  /**
   * Submit a pick for a user in a league
   * @param userId
   * @param leagueId
   * @param teamName
   * @param date
   */
  async submitPick(userId: string, leagueId: number, teamName: string, date: string): Promise<void> {
    const gameWeekInfo = await this.getGameWeekInfo(); 

    if (gameWeekInfo == false) {
      throw new Error("Not an active week.");
    }

    const { error: pickError } = await this.serviceClient.from("picks").insert({
      user_id: userId,
      league_id: leagueId,
      teamName: teamName,
      date: date,
    });

    if (pickError) {
      throw new Error(`Error submitting pick: ${pickError.message}`);
    }

    // Update the "league_users" table to set "canpick" to false for the given user_id and league_id
    const { error: updateError } = await this.serviceClient
      .from("league_users")
      .update({ canPick: false }) 
      .eq("user_id", userId)
      .eq("league_id", leagueId);

    if (updateError) {
      throw new Error(`Error updating canpick: ${updateError.message}`);
    }
  }

  /**
   * Check if user is the creator of a league
   * @param userId
   * @param leagueId
   * @returns
   */
  async isLeagueCreator(leagueId: number, userId: string): Promise<boolean> {
    const { data: league, error: leagueError } = await this.serviceClient
      .from("leagues")
      .select("user_id")
      .eq("id", leagueId)
      .single();

    if (leagueError) {
      throw new Error(`Error fetching league creator: ${leagueError.message}`);
    }

    return league.user_id === userId;
  }

  async getGameWeekInfo(): Promise<any> {
    const { data: gameWeekInfo, error: gameWeekInfoError } = await this.serviceClient
      .from("game_week_info")
      .select("activeWeek")
      .eq("id", 1);

    if (gameWeekInfoError) {
      throw new Error(`Error fetching game week info: ${gameWeekInfoError.message}`);
    }

    return gameWeekInfo[0].activeWeek;
  }
}
