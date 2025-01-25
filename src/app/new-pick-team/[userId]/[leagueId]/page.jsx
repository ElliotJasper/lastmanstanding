"use client";

import LeaguePicksDisplay from "@/components/custom/LeaguePicksDisplay";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Trophy, ArrowRight, Star, AlertCircle, ChevronDown, ChevronUp, PlayCircle } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useAuth } from "../../../../../contexts/AuthContext";
import "react-toastify/dist/ReactToastify.css";
import { toast } from "react-toastify";

import Link from "next/link";
import confetti from "canvas-confetti";

function calculateTimeDifference(createdAt) {
  const start = new Date(createdAt);
  const end = new Date();

  const diffInMs = end - start;

  const days = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diffInMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diffInMs % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diffInMs % (1000 * 60)) / 1000);

  return {
    days,
    hours,
    minutes,
    seconds,
  };
}

// Function to submit selected team pick
const submitPick = async (userId, leagueId, selectedPick) => {
  const response = await fetch(`/api/submit-pick`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      selectedPick,
      userId,
      leagueId,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to submit pick");
  }

  return data;
};

// Fetch available picks
const getPicks = async (userId, leagueId) => {
  const response = await fetch(`/api/get-available-picks/${userId}/${leagueId}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });
  if (!response.ok) {
    throw new Error("Failed to fetch picks");
  }
  const data = await response.json();
  return data;
};

const getUsers = async (leagueId) => {
  const response = await fetch(`/api/get-league-users/${leagueId}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });
  if (!response.ok) {
    throw new Error("Failed to fetch users");
  }
  const data = await response.json();
  return data;
};

const getLeagueInfo = async (leagueId) => {
  const response = await fetch(`/api/get-league/${leagueId}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });
  if (!response.ok) {
    throw new Error("Failed to fetch league info");
  }
  const data = await response.json();
  return data;
};

const DeadlineDisplay = () => {
  const [, forceUpdate] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      forceUpdate((prev) => prev + 1); // This forces a re-render
    }, 1000);

    return () => clearInterval(timer); // Cleanup on unmount
  }, []);

  const deadline = timeUntilThursdayMidnight();
  return (
    <p className="text-2xl font-bold text-[#e01883]">
      {`${deadline.days}d ${deadline.hours}h ${deadline.minutes}m ${deadline.seconds}s`}
    </p>
  );
};

function timeUntilThursdayMidnight() {
  const now = new Date(); // Current date and time

  // Calculate the current day of the week (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
  const currentDay = now.getDay();

  // Calculate how many days until the next Thursday
  const daysUntilThursday = (2 - currentDay + 7) % 7 || 7;

  // Create the target Thursday midnight date
  const thursdayMidnight = new Date(now);
  thursdayMidnight.setDate(now.getDate() + daysUntilThursday); // Move to next Thursday
  thursdayMidnight.setHours(0, 0, 0, 0); // Set time to midnight

  // Calculate the difference in milliseconds
  const difference = thursdayMidnight - now;

  // Convert the difference to days, hours, minutes, and seconds
  const totalMinutes = Math.floor(difference / (1000 * 60));
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;
  const seconds = Math.floor((difference / 1000) % 60);

  return { days, hours, minutes, seconds };
}

export default function TeamSelectionPage({ params }) {
  const [picks, setPicks] = useState([]);
  const [selectedPick, setSelectedPick] = useState(null);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [isEliminated, setIsEliminated] = useState(null);
  const [gameWeeks, setGameWeeks] = useState(null);
  const [winner, setWinner] = useState(null);
  const { user, loading } = useAuth();
  const [users, setUsers] = useState();
  const [expandedUsers, setExpandedUsers] = useState(new Set());
  const [leagueInfo, setLeagueInfo] = useState(null);

  const handleTeamClick = (team, date) => {
    setSelectedPick({ team, date });
    setSuccessMessage(null); // Reset success message on new selection
  };

  useEffect(() => {
    if (!loading && !user) {
      window.location.href = "/login";
      return;
    }

    if (user) {
      const fetchData = async () => {
        try {
          // Fetch league info first
          const leagueData = await getLeagueInfo(params.leagueId);
          setLeagueInfo(leagueData);
          // Then fetch other data
          const [picksData, usersData] = await Promise.all([
            getPicks(params.userId, params.leagueId),
            getUsers(params.leagueId),
          ]);

          setPicks(picksData.availablePicks);
          setIsEliminated(picksData.isEliminated);
          setGameWeeks(picksData.gameWeeks);
          setWinner(picksData.winner);
          setUsers(usersData);

          if (picksData.winner) {
            confetti({
              particleCount: 100,
              spread: 70,
              origin: { y: 0.6 },
            });
          }
        } catch (err) {
          setError(err.message);
          console.error("Error fetching data:", err);
        }
      };

      fetchData();
    }
  }, [loading]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedPick) {
      setError("No team selected!");
      return;
    }

    try {
      const result = await submitPick(params.userId, params.leagueId, selectedPick);
      setSuccessMessage(`Pick submitted successfully for ${selectedPick.team}!`);
      setError(null);

      // Refresh the picks and users data
      const [picksData, usersData] = await Promise.all([
        getPicks(params.userId, params.leagueId),
        getUsers(params.leagueId),
      ]);

      setPicks(picksData.availablePicks);
      setUsers(usersData);
    } catch (err) {
      setError(err.message);
      setSuccessMessage(null);
      toast.error(err.message, {
        position: "top-center",
        autoClose: 3000,
      });
    }
  };

  const getResultColor = (result) => {
    switch (result) {
      case "W":
        return "bg-green-500";
      case "L":
        return "bg-red-500";
      case "D":
        return "bg-yellow-500";
      default:
        return "bg-gray-500";
    }
  };

  const toggleUserExpansion = (userId) => {
    setExpandedUsers((prevExpandedUsers) => {
      const newExpandedUsers = new Set(prevExpandedUsers);
      if (newExpandedUsers.has(userId)) {
        newExpandedUsers.delete(userId);
      } else {
        newExpandedUsers.add(userId);
      }
      return newExpandedUsers;
    });
  };

  const handleActivate = async () => {
    try {
      const response = await fetch(`/api/activate-league/${params.leagueId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (data.error) {
        toast.error(data.error, {
          position: "top-center",
          autoClose: 2000,
        });
      } else {
        toast.success("League activated successfully!", {
          position: "top-center",
          autoClose: 2000,
        });
      }
      const leagueData = await getLeagueInfo(params.leagueId);
      setLeagueInfo(leagueData);
    } catch (error) {
      toast.error("Cannot activate league during gameplay time", {
        position: "top-center",
        autoClose: 2000,
      });
    }
  };

  if (loading || !leagueInfo) {
    return (
      <div className="min-h-screen bg-background w-full flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // If not loading and no user, return null (page will redirect)
  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background w-full">
      <div className="px-8 mt-4">
        <h1 className="text-3xl font-bold mb-6 text-center text-[#4a82b0]">{leagueInfo.name}</h1>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            {winner ? (
              // Render the "winner" card
              <Card className="border-t-4 border-t-[#e01883]">
                <CardHeader>
                  <CardTitle className="text-3xl text-[#4a82b0] flex items-center justify-center">
                    <Trophy className="mr-2 h-8 w-8 text-yellow-500" />
                    Congratulations, Champion!
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <div className="space-y-6">
                    <p className="text-xl">You've won the Football Last Man Standing League!</p>
                    <div className="p-6 bg-gradient-to-r from-yellow-100 to-yellow-200 rounded-lg shadow-inner">
                      {leagueInfo?.created_at &&
                        (() => {
                          const timeDiff = calculateTimeDifference(leagueInfo.created_at);
                          return (
                            <li className="text-[#4a82b0]">
                              League Duration: {timeDiff.days} days, {timeDiff.hours} hours, {timeDiff.minutes} minutes
                            </li>
                          );
                        })()}
                    </div>
                    <p className="italic text-xl text-[#4a82b0]">"You're simply the best, better than all the rest."</p>
                    <div className="pt-4 flex justify-center">
                      <Link href="/home" passHref>
                        <Button className="bg-[#4a82b0] hover:bg-[#4a82b0]/90">
                          Join New League <ArrowRight className="ml-2 h-5 w-5" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : isEliminated ? (
              // Render the "eliminated" card
              <Card className="border-t-4 border-t-[#e01883]">
                <CardHeader>
                  <CardTitle className="text-2xl text-[#4a82b0] flex items-center justify-center">
                    <Trophy className="mr-2 h-6 w-6 text-yellow-500" />
                    Better Luck Next Time!
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <div className="space-y-4">
                    <p className="text-lg">
                      Unfortunately, you've been eliminated from this league. But don't worry, there's always next time!
                    </p>
                    <div className="p-4 bg-gray-100 rounded-lg">
                      <h3 className="font-semibold text-[#4a82b0] mb-2">Your Final Stats</h3>
                      <ul className="space-y-2">
                        <li>Weeks Survived: {gameWeeks}</li>
                      </ul>
                    </div>
                    <div className="pt-4">
                      <Link href="/home">
                        <Button className="bg-[#4a82b0] hover:bg-[#4a82b0]/90">
                          Join New League <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : !leagueInfo.isactive ? (
              <Card className="border-t-4 border-t-[#e01883]">
                <CardHeader>
                  <CardTitle className="text-2xl text-[#4a82b0]">Inactive League</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <p className="text-lg mb-4">
                    This league needs to be activated before you can start playing.
                    <br />
                    Players cannot join once league is active.
                  </p>
                  {leagueInfo.user_id === user.id && (
                    <Button onClick={handleActivate} className="bg-[#4a82b0] hover:bg-[#4a82b0]/90">
                      <PlayCircle className="mr-2 h-4 w-4" /> Activate League
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card className="border-t-4 border-t-[#e01883]">
                <CardHeader>
                  <CardTitle className="text-2xl text-[#4a82b0]">Select Your Team</CardTitle>
                </CardHeader>
                <CardContent>
                  <LeaguePicksDisplay
                    picks={picks}
                    selectedPick={selectedPick}
                    onTeamClick={handleTeamClick}
                    onSubmit={handleSubmit}
                    successMessage={successMessage}
                  />
                </CardContent>
              </Card>
            )}
          </div>
          <div className="space-y-6">
            <Card className="border-t-4 border-t-[#e01883]">
              <CardHeader>
                <CardTitle className="text-xl text-[#4a82b0]">League Players</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[300px]">
                  {users?.length > 0 && (
                    <ul className="space-y-4">
                      {users.map((user) => (
                        <li key={user.user_id}>
                          <Collapsible>
                            <CollapsibleTrigger asChild>
                              <div
                                className="flex items-center justify-between cursor-pointer"
                                onClick={() => toggleUserExpansion(user.user_id)}
                              >
                                <div className="flex items-center space-x-3">
                                  <Avatar className="h-12 w-12">
                                    <AvatarImage src={user.avatar_url} className="object-cover" />
                                  </Avatar>
                                  <span className="font-medium">{user.display_name}</span>
                                </div>
                                <div className="flex items-center space-x-2 mr-2">
                                  {user.winner ? (
                                    <Badge variant="secondary" className="bg-[#4CAF50] text-white">
                                      Winner
                                    </Badge>
                                  ) : user.isEliminated ? (
                                    <Badge variant="secondary" className="bg-red-500 text-white">
                                      Eliminated
                                    </Badge>
                                  ) : (
                                    <Badge variant="default" className="bg-[#4a82b0] text-white">
                                      Active
                                    </Badge>
                                  )}
                                  {expandedUsers.has(user.user_id) ? (
                                    <ChevronUp className="h-4 w-4" />
                                  ) : (
                                    <ChevronDown className="h-4 w-4" />
                                  )}
                                </div>
                              </div>
                            </CollapsibleTrigger>
                            <CollapsibleContent>
                              <div className="mt-2 pl-11">
                                <h4 className="text-sm font-semibold mb-2">Pick History:</h4>
                                <ul className="space-y-1">
                                  {user.picks
                                    .sort((a, b) => new Date(a.date) - new Date(b.date)) // Sort picks by date
                                    .map((pick) => (
                                      <li
                                        key={pick.teamName}
                                        className={`text-xs p-1 rounded-md flex items-center justify-start ${
                                          pick.outcome === "win"
                                            ? "bg-green-100"
                                            : pick.outcome === "loss"
                                            ? "bg-red-400"
                                            : pick.outcome === "draw"
                                            ? "bg-red-200"
                                            : "bg-blue-100"
                                        }`}
                                      >
                                        <span className="font-bold w-48 truncate">{pick.teamName}</span>
                                        <span className="w-32 truncate">
                                          {new Date(pick.date).toLocaleDateString("en-US", {
                                            year: "numeric",
                                            month: "long",
                                            day: "numeric",
                                          })}
                                        </span>
                                      </li>
                                    ))}
                                </ul>
                              </div>
                            </CollapsibleContent>
                          </Collapsible>
                        </li>
                      ))}
                    </ul>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>

            <Card className="border-t-4 border-t-[#e01883]">
              <CardHeader>
                <CardTitle className="text-xl text-[#4a82b0]">Next Weeks Picks Open In</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <DeadlineDisplay />
                  <p className="text-sm text-muted-foreground">Until picks lock</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-t-4 border-t-[#e01883]">
              <CardHeader>
                <CardTitle className="text-xl text-[#4a82b0]">How to Play</CardTitle>
              </CardHeader>
              <CardContent>
                <ol className="list-decimal list-inside space-y-2 text-sm">
                  <li>Select one team each week</li>
                  <li>If your team wins, you advance</li>
                  <li>You can't pick the same team twice</li>
                  <li>Last person standing wins!</li>
                </ol>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
