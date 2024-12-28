"use client";

import { createClient } from "../../../../../utils/supabase/client";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Trophy, ArrowRight, Star, AlertCircle, ChevronDown, ChevronUp, PlayCircle } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import Navbar from "@/components/custom/Navbar";

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

  if (!response.ok) {
    throw new Error("Failed to submit pick");
  }

  return response.json();
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
  console.log(data);
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
  console.log("isactive", data);
  return data;
};

function timeUntilThursdayMidnight() {
  const now = new Date(); // Current date and time

  // Calculate the current day of the week (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
  const currentDay = now.getDay();

  // Calculate how many days until the next Thursday
  const daysUntilThursday = (4 - currentDay + 7) % 7 || 7;

  // Create the target Thursday midnight date
  const thursdayMidnight = new Date(now);
  thursdayMidnight.setDate(now.getDate() + daysUntilThursday); // Move to next Thursday
  thursdayMidnight.setHours(0, 0, 0, 0); // Set time to midnight

  // Calculate the difference in milliseconds
  const difference = thursdayMidnight - now;

  // Convert the difference to days, hours, and minutes
  const totalMinutes = Math.floor(difference / (1000 * 60));
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;

  return { days, hours, minutes };
}

export default function TeamSelectionPage({ params }) {
  const [picks, setPicks] = useState([]);
  const [selectedPick, setSelectedPick] = useState(null);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEliminated, setIsEliminated] = useState(null);
  const [gameWeeks, setGameWeeks] = useState(null);
  const [winner, setWinner] = useState(null);
  const [user, setUser] = useState(null);
  const [users, setUsers] = useState();
  const [expandedUser, setExpandedUser] = useState(null);
  const [leagueInfo, setLeagueInfo] = useState(null);
  const [timeUntilDeadline, setTimeUntilDeadline] = useState({ days: 0, hours: 0, minutes: 0 });

  useEffect(() => {
    const supabase = createClient();

    const checkAuth = async () => {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();
      if (user != null) {
        setUser(user);
      } else {
        // If there's no user, redirect to login
        window.location.href = "/login";
      }
    };

    checkAuth();

    const fetchPicks = async () => {
      try {
        const data = await getPicks(params.userId, params.leagueId);

        setPicks(data.availablePicks);
        setIsEliminated(data.isEliminated);
        setGameWeeks(data.gameWeeks);
        console.log(loading);
        setWinner(data.winner);

        if (data.winner) {
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
          });
        }
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    const fetchUsers = async () => {
      try {
        const data = await getUsers(params.leagueId);
        console.log("data", data);
        setUsers(data);
        console.log("users", users);
      } catch (err) {
        console.log(err);
      }
    };

    const fetchLeagueInfo = async () => {
      try {
        const data = await getLeagueInfo(params.leagueId);
        console.log("league info", data);
        setLeagueInfo(data);
        setLoading(false);
      } catch (err) {
        console.log(err);
      }
    };

    fetchLeagueInfo();
    fetchUsers();
    fetchPicks();
  }, [params.userId, params.leagueId]);

  useEffect(() => {
    // Update deadline timer every minute
    const updateDeadline = () => {
      const time = timeUntilThursdayMidnight();
      setTimeUntilDeadline(time);
    };

    // Initial update
    updateDeadline();

    // Set up interval for updates
    const interval = setInterval(updateDeadline, 60000); // Update every minute

    // Cleanup interval on component unmount
    return () => clearInterval(interval);
  }, []);

  const handleTeamClick = (team, date) => {
    setSelectedPick({ team, date });
    setSuccessMessage(null); // Reset success message on new selection
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedPick) {
      setError("No team selected!");
      return;
    }

    try {
      await submitPick(params.userId, params.leagueId, selectedPick);
      setSuccessMessage(`Pick submitted successfully for ${selectedPick.team}!`);
      setError(null);
    } catch (err) {
      alert("Failed to submit pick");
      setError(err.message);
      setSuccessMessage(null);
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
    setExpandedUser(expandedUser === userId ? null : userId);
  };

  const handleActivate = async () => {
    await fetch(`/api/activate-league/${params.leagueId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });

    window.location.reload();
  };

  if (loading) {
    return <p>Loading...</p>;
  }

  return (
    <div className="min-h-screen bg-background w-full">
      <Navbar />
      <div className="px-8 mt-4">
        <h1 className="text-3xl font-bold mb-6 text-center text-[#4a82b0]">Football Last Man Standing</h1>
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
                    <div className="pt-4">
                      <Button className="bg-[#4a82b0] hover:bg-[#4a82b0]/90 text-lg px-6 py-3">
                        Join New League <ArrowRight className="ml-2 h-5 w-5" />
                      </Button>
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
                      <Link href="/new-home">
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
                  <p className="text-lg mb-4">This league needs to be activated before you can start playing.</p>
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
                  <ScrollArea className="h-[400px]">
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 p-8">
                      {picks.map((team) => (
                        <TooltipProvider key={team.team}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Card
                                className={`cursor-pointer transition-all ${
                                  selectedPick?.team === team.team ? "ring-2 ring-[#e01883]" : ""
                                }`}
                                onClick={() => handleTeamClick(team.team, team.date)}
                              >
                                <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                                  <Avatar className="h-12 w-12 mb-2">
                                    <AvatarImage src={team.teamImg} alt={team.team} />
                                    <AvatarFallback className="bg-[#4a82b0] text-white">{team.team[0]}</AvatarFallback>
                                  </Avatar>
                                  <h3 className="font-semibold text-sm">{team.team}</h3>
                                  <p className="text-xs text-muted-foreground">vs {team.opponent}</p>
                                </CardContent>
                              </Card>
                            </TooltipTrigger>
                          </Tooltip>
                        </TooltipProvider>
                      ))}
                    </div>
                  </ScrollArea>
                  <div className="mt-6 text-center">
                    <Button
                      onClick={handleSubmit}
                      disabled={!selectedPick}
                      className="bg-[#4a82b0] hover:bg-[#4a82b0]/90"
                    >
                      Submit Pick
                    </Button>
                  </div>
                  {successMessage && <div className="text-green-500 mt-4">{successMessage}</div>}
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
                                onClick={() => toggleUserExpansion(user.id)}
                              >
                                <div className="flex items-center space-x-3">
                                  <Avatar className="h-12 w-12">
                                    <AvatarImage src={user.avatar_url} className="object-cover" />
                                  </Avatar>
                                  <span className="font-medium">{user.display_name}</span>
                                </div>
                                <div className="flex items-center space-x-2 mr-2">
                                  <Badge
                                    variant={user.isEliminated == false ? "default" : "secondary"}
                                    className={user.isEliminated == false ? "bg-green-500" : "bg-red-500"}
                                  >
                                    {user.isEliminated == false ? "Active" : "Eliminated"}
                                  </Badge>
                                  {expandedUser === user.id ? (
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
                                  {user.picks.map((pick) => (
                                    <li
                                      key={pick.teamName}
                                      className={`text-xs p-1 rounded-md flex items-center justify-start bg-blue-100`}
                                    >
                                      {/* <span className="font-medium w-6">{pick.gameweek}</span> */}
                                      <span className="font-bold w-48 truncate">{pick.teamName}</span>
                                      <span className="w-32 truncate">
                                        {new Date(pick.date).toLocaleDateString("en-US", {
                                          year: "numeric",
                                          month: "long",
                                          day: "numeric",
                                        })}
                                      </span>
                                      {/* <span className="w-24 truncate">{pick.opponent}</span> */}
                                      {/* <Badge 
                                     variant={pick.result === "W" ? "default" : pick.result === "L" ? "destructive" : "secondary"}
                                     className={`text-xs px-1 py-0 ${
                                       pick.result === "W" 
                                         ? "bg-green-500" 
                                         : pick.result === "L" 
                                         ? "bg-red-500" 
                                         : "bg-yellow-500"
                                     }`}
                                   >
                                     {pick.result}
                                   </Badge> */}
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
                <CardTitle className="text-xl text-[#4a82b0]">Next Deadline</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <p className="text-2xl font-bold text-[#e01883]">
                    {timeUntilDeadline.days}d {timeUntilDeadline.hours}h {timeUntilDeadline.minutes}m
                  </p>
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
