import {
  createClient,
  SupabaseClient as OriginalSupabaseClient,
} from "../utils/supabase/server.js";
import { getUniqueLeagueId } from "../lib/utils.js";
import { DateHandler } from "./dateHandler.ts";
import { LeagueIdGenerator } from "./leagueIdGenerator.ts";

export class SupabaseClient {
  private client: OriginalSupabaseClient;
  private leagueIdGenerator: LeagueIdGenerator;

  constructor() {
    this.client = createClient();
    this.leagueIdGenerator = new LeagueIdGenerator(this);
  }

  /**
   * Gets the authenticated user or null if not authenticated
   * @returns {Promise<any>} - The authenticated user
   */
  async getAuthenticatedUser(): Promise<any> {
    const { data, error: authError } = await this.client.auth.getUser();

    if (authError) throw new Error("Error fetching authenticated user");
    return data?.user ?? null;
  }

  /**
   * Gets all the leagues a user is in
   * @param userId
   * @returns {Promise<any>} - User's leagues
   */
  async getUserLeagues(userId: string): Promise<any> {
    const { data: leagues, error } = await this.client
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
   * @returns {Promise<any>} - The created league
   */
  async createLeague(name: string, userId: string): Promise<any> {
    const code = await this.leagueIdGenerator.getUniqueLeagueId();
    const { data: createdLeague, error: leagueError } = await this.client
      .from("leagues")
      .insert({
        name: name,
        code: code,
        user_id: userId,
      })
      .select();

    if (leagueError) {
      throw new Error(`Error creating league: ${leagueError.message}`);
    }

    const { error: userLeagueError } = await this.client.from("league_users").insert({
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
   * @returns {Promise<any>} - Users of a league
   */
  async getLeagueUsers(leagueId: string): Promise<any> {
    const { data: leagueUsers, error: leagueUsersError } = await this.client
      .from("league_users")
      .select("user_id, isEliminated")
      .eq("league_id", parseInt(leagueId));

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
    const { data: users, error: usersError } = await this.client
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
    const dates = DateHandler.generateDatesUntilSunday();

    const { data: games, error: picksError } = await this.client
      .from("games")
      .select("homeTeam, awayTeam, date, eventProgress")
      .gt("date", dates[0])
      .lte("date", dates[dates.length - 1])
      .order("date", { ascending: true });

    if (picksError) {
      throw new Error(`Error fetching pickable games: ${error.message}`);
    }

    const gameDetails = games.flatMap((game) => [
      {
        team: game.homeTeam,
        date: game.date,
        opponent: game.awayTeam,
      },
      {
        team: game.awayTeam,
        date: game.date,
        opponent: game.homeTeam,
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

    const { data: games, error: picksError } = await this.client
      .from("games")
      .select("homeTeam, awayTeam, homeScore, awayScore, date, id, eventProgress")
      .gte("date", dates[dates.length - 1])
      .lte("date", dates[0])
      .order("date", { ascending: true });

    if (picksError) {
      throw new Error(`Error fetching previous games: ${error.message}`);
    }

    return games;
  }

  /**
   * Gets the picks a user has already made in a league
   * @param userId
   * @param leagueId
   * @returns {Promise<any>} - Users picks
   */
  async getUserPicks(userId: string, leagueId: number): Promise<any> {
    const { data: picks, error: picksError } = await this.client
      .from("picks")
      .select("teamName, date")
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
   * @returns {Promise<any>} - Information about the user in the league
   */
  async getLeagueUserData(userId: string, leagueId: number): Promise<any> {
    const { data: leagueUserData, error: leagueUserDataError } = await this.client
      .from("league_users")
      .select("isEliminated, winner")
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
    const { data: league, error: leagueError } = await this.client
      .from("leagues")
      .select("id")
      .eq("code", code);
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
    const { data: league, error: leagueCheckError } = await this.client
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
    const { data: added, error: joinLeagueError } = await this.client.from("league_users").insert({
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
    const { data: league, error: leagueError } = await this.client
      .from("leagues")
      .select("isactive, user_id")
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
  async activateLeague(leagueId: number): Promise<void> {
    const { error: leagueError } = await this.client
      .from("leagues")
      .update({ isactive: true })
      .eq("id", leagueId);

    if (leagueError) {
      throw new Error(`Error activating league: ${leagueError.message}`);
    }
  }

  /**
   * Get the profile of a user
   * @param userId
   * @returns
   */
  async getProfile(userId: string): Promise<any> {
    const { data: profile, error: profileError } = await this.client
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
    const { error: profileError } = await this.client
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
    const { data, error } = await this.client.storage.from("avatars").list();

    if (error) {
      throw new Error(error.message);
    }

    // Try to find the file with the userId and possible extensions (e.g., .png, .jpg)
    const possibleExtensions = ["png", "jpg", "jpeg", "gif"]; // Add more extensions if needed
    for (const ext of possibleExtensions) {
      const fileName = `${userId}.${ext}`;
      const file = data.find((file) => file.name === fileName);

      if (file) {
        // If file is found, download and return it
        const { data: avatarData, error: avatarError } = await this.client.storage
          .from("avatars")
          .download(file.name);

        if (avatarError) {
          throw new Error(avatarError.message);
        }
        return avatarData;
      }
    }

    // If no file is found, return the default avatar
    const { data: defaultAvatar, error: defaultAvatarError } = await this.client.storage
      .from("avatars")
      .download("default-pfp.jpg");

    if (defaultAvatarError) {
      throw new Error(defaultAvatarError.message);
    }

    return defaultAvatar;
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
    const { data: listData, error: listError } = await this.client.storage.from("avatars").list();

    if (listError) {
      throw new Error(`Failed to list files: ${listError.message}`);
    }

    // Find any file that starts with the userId (e.g., "userId.extension")
    const existingFile = listData?.find((file) => file.name.startsWith(userId));

    // If an existing file is found, delete it
    if (existingFile) {
      const { error: deleteError } = await this.client.storage
        .from("avatars")
        .remove([existingFile.name]);
      if (deleteError) {
        throw new Error(`Failed to delete existing avatar: ${deleteError.message}`);
      }
    }

    // Construct the new file path with userId and appropriate extension based on mimeType
    const extension = mimeType.split("/")[1];
    const newFilePath = `${userId}`;

    // Upload the new avatar
    const { data: uploadData, error: uploadError } = await this.client.storage
      .from("avatars")
      .upload(newFilePath, fileBuffer, {
        contentType: mimeType,
      });

    if (uploadError) {
      throw new Error(`Failed to upload avatar: ${uploadError.message}`);
    }

    console.log("Upload success:", uploadData);
    return uploadData;
  }
}
