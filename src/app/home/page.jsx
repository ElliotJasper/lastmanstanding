"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../../../contexts/AuthContext";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const generateDates = () => {
  const dates = [];
  const today = new Date();
  for (let i = -5; i < 7; i++) {
    const date = new Date();
    date.setDate(today.getDate() + i);
    dates.push(date);
  }
  return dates;
};

const dates = generateDates();

const getUserLeagues = async (userId) => {
  const response = await fetch(`/api/get-all-leagues`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch leagues");
  }

  return response.json();
};

const getPreviousScores = async () => {
  const response = await fetch(`/api/get-previous-results`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch previous scores");
  }

  return response.json();
};

export default function HomePage() {
  const { user, loading } = useAuth();
  const [leagues, setLeagues] = useState([]);
  const [fixturesAndResults, setFixturesAndResults] = useState([]);
  const [leagueCode, setLeagueCode] = useState("");
  const [leagueName, setLeagueName] = useState("");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isCreateLeagueDialogOpen, setIsCreateLeagueDialogOpen] = useState(false); // State to manage create league dialog open state
  const [isJoinLeagueDialogOpen, setIsJoinLeagueDialogOpen] = useState(false); // State to manage join league dialog open state

  const getVisibleDates = () => {
    const allDates = dates;
    const currentIndex = allDates.findIndex((date) => date.toDateString() === selectedDate.toDateString());

    // Use a safe check for window
    const isMobileView = typeof window !== "undefined" && window.innerWidth < 640;

    const visibleCount = 4;
    const start = Math.max(0, currentIndex - Math.floor(visibleCount / 2));
    return allDates.slice(start, start + visibleCount);
  };

  const navigateDate = (direction) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(selectedDate.getDate() + (direction === "left" ? -1 : 1));
    setSelectedDate(newDate);
  };

  const getMatchesForSelectedDate = () => {
    if (!fixturesAndResults.length) return [];

    return fixturesAndResults.filter((match) => {
      const matchDate = new Date(match.date);
      return (
        matchDate.getDate() === selectedDate.getDate() &&
        matchDate.getMonth() === selectedDate.getMonth() &&
        matchDate.getFullYear() === selectedDate.getFullYear()
      );
    });
  };

  // Function to determine match status
  const getMatchStatus = (match) => {
    if (match.eventProgress === "PostEvent") {
      return "FT";
    } else if (match.eventProgress === "PreEvent") {
      return "KO";
    } else if (match.eventPorgress === "MidEvent") {
      return match.minute;
    }
  };

  useEffect(() => {
    if (!loading && !user) {
      window.location.href = "/login";
      return;
    }

    if (user) {
      fetchLeagues(user.id);
      fetchPreviousScores();
    }
  }, [user, loading]);

  const fetchLeagues = async (userId) => {
    try {
      const data = await getUserLeagues(userId);
      setLeagues(data);
    } catch (err) {
      console.log(err);
    }
  };

  const fetchPreviousScores = async () => {
    try {
      const data = await getPreviousScores();
      setFixturesAndResults(data);
    } catch (err) {
      console.log(err);
    }
  };

  const handleJoinLeague = async (e) => {
    e.preventDefault();
    const formData = { leagueCode };

    try {
      const response = await fetch("/api/join-league", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        await fetchLeagues(user.id);
        setIsJoinLeagueDialogOpen(false);
      } else if (response.status === 404) {
        alert(data.message); // Show specific message for invalid league code
      } else {
        alert(`Failed to join league: ${data.message || "Unknown error"}`);
      }
    } catch (error) {
      alert(`Failed to join league: ${error.message}`);
      console.error("Error:", error);
    }
  };

  const handleCreateLeague = async (e) => {
    e.preventDefault();

    if (!leagueName.trim()) {
      alert("Please enter a name for the league.");
      return;
    }

    const formData = { leagueName };

    try {
      const response = await fetch("/api/create-league", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        // Fetch the updated list of leagues
        await fetchLeagues(user.id);
        setIsCreateLeagueDialogOpen(false); // Close the dialog
      } else {
        const errorData = await response.json();
        alert(`Failed to create league: ${errorData.message || "Unknown error"}`);
        console.error("Failed to create league:", errorData);
      }
    } catch (error) {
      alert(`Failed to create league: ${error.message}`);
      console.error("Error:", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background w-full flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  const leaguesOrder = ["Premier League", "Championship", "League One", "League Two"];

  return (
    <div className="min-h-screen bg-background w-full">
      <main className="container mx-auto px-4 py-8">
        <div className="grid gap-8 md:grid-cols-2">
          <section aria-labelledby="leagues-title">
            <div className="flex flex-col md:flex-row justify-between items-center mb-4">
              <h2 id="leagues-title" className="text-xl mb-4 md:mb-0 font-semibold text-[#4a82b0] dark:text-[#7ab3e0]">
                Your Leagues
              </h2>
              <div className="space-x-2">
                <Dialog open={isCreateLeagueDialogOpen} onOpenChange={setIsCreateLeagueDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline">Create League</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <form onSubmit={handleCreateLeague}>
                      <DialogHeader>
                        <DialogTitle>Create a New League</DialogTitle>
                        <DialogDescription>Enter a name for your new league.</DialogDescription>
                      </DialogHeader>
                      <div className="py-4">
                        <Label htmlFor="league-name">League Name</Label>
                        <Input
                          id="league-name"
                          value={leagueName}
                          onChange={(e) => setLeagueName(e.target.value)}
                          placeholder="Enter league name"
                        />
                      </div>
                      <DialogFooter>
                        <Button type="submit">Create League</Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
                <Dialog open={isJoinLeagueDialogOpen} onOpenChange={setIsJoinLeagueDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline">Join League</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <form onSubmit={handleJoinLeague}>
                      <DialogHeader>
                        <DialogTitle>Join a League</DialogTitle>
                        <DialogDescription>Enter the league code to join.</DialogDescription>
                      </DialogHeader>
                      <div className="py-4">
                        <Label htmlFor="league-code">League Code</Label>
                        <Input
                          id="league-code"
                          value={leagueCode}
                          onChange={(e) => setLeagueCode(e.target.value)}
                          placeholder="Enter league code"
                        />
                      </div>
                      <DialogFooter>
                        <Button type="submit">Join League</Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
            <Card className="border-t-4 border-t-[#e01883]">
              <CardHeader>
                <CardTitle>Active and Upcoming Leagues</CardTitle>
                <CardDescription>Leagues you're participating in or can join</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[300px]">
                  <ul className="space-y-4">
                    {leagues.map((league) => (
                      <li key={league.leagues.id}>
                        <Card>
                          <Link href={`/new-pick-team/${user.id}/${league.leagues.id}`} className="cursor-pointer">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                              <CardTitle className="text-sm font-medium">{league.leagues.name}</CardTitle>
                              <div className="flex flex-col gap-2">
                                {league.winner && (
                                  <Badge className="bg-[#4CAF50] flex items-center justify-center">{"Winner"}</Badge>
                                )}
                                {league.isEliminated && (
                                  <Badge className="bg-[#FF0000] flex items-center justify-center">
                                    {"Eliminated"}
                                  </Badge>
                                )}
                                {league.leagues.isactive && (
                                  <Badge className="bg-[#4a82b0] flex items-center justify-center">{"Active"}</Badge>
                                )}
                                {!league.isEliminated && league.canPick && (
                                  <Badge className="bg-[#FFA500] flex items-center justify-center">{"Pick"}</Badge>
                                )}
                              </div>
                            </CardHeader>
                            <CardContent>
                              <div className="flex gap-8">
                                <div className="text-sm text-muted-foreground">{league.leagues.members} members</div>
                                <div className="text-sm text-muted-foreground">code: {league.leagues.code}</div>
                              </div>
                            </CardContent>
                          </Link>
                        </Card>
                      </li>
                    ))}
                  </ul>
                </ScrollArea>
              </CardContent>
            </Card>
          </section>
          <div className="lg:col-span-1">
            <Card className="sticky top-4">
              <CardHeader className="pb-3">
                <CardTitle className="text-base sm:text-lg font-semibold flex items-center justify-between">
                  <span className="text-[#4a82b0]">Fixtures & Results</span>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardTitle>
              </CardHeader>
              <CardContent className="w-full max-w-full">
                <div className="flex items-center justify-between w-full">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="flex-shrink-0 p-1 sm:p-2"
                    onClick={() => navigateDate("left")}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>

                  <div className="flex-grow mx-2 sm:mx-4 max-w-full overflow-hidden">
                    <ScrollArea className="w-full max-w-full">
                      <div className="flex justify-center gap-1 sm:gap-2 flex-wrap">
                        {getVisibleDates().map((date, i) => (
                          <Button
                            key={i}
                            variant={date.toDateString() === selectedDate.toDateString() ? "default" : "outline"}
                            className={`flex-shrink-0 min-w-[3rem] sm:min-w-[4rem] mb-4 ${
                              date.toDateString() === selectedDate.toDateString() ? "bg-[#e01883] text-white" : ""
                            }`}
                            onClick={() => setSelectedDate(date)}
                          >
                            <div className="flex flex-col items-center">
                              <span className="text-[10px] sm:text-xs">
                                {date.toLocaleDateString("en-US", { weekday: "short" })}
                              </span>
                              <span className="text-xs sm:text-sm font-bold">{date.getDate()}</span>
                            </div>
                          </Button>
                        ))}
                      </div>
                      <ScrollBar orientation="horizontal" />
                    </ScrollArea>
                  </div>

                  <Button
                    variant="ghost"
                    size="icon"
                    className="flex-shrink-0 p-1 sm:p-2"
                    onClick={() => navigateDate("right")}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>

                {/* Matches section */}
                <div className="mt-4 space-y-2 sm:space-y-3">
                  {leaguesOrder.map((league) => {
                    const matches = getMatchesForSelectedDate().filter((match) => match.league === league);
                    return (
                      matches.length > 0 && (
                        <div key={league}>
                          <div className="text-lg font-bold mb-2">{league}</div>
                          {matches.map((match, index) => (
                            <div
                              key={index}
                              className={`p-2 mb-3 sm:p-3 bg-gray-100 rounded-lg max-w-full overflow-hidden ${
                                getMatchStatus(match) === "FT"
                                  ? "border-l-4 border-blue-500"
                                  : getMatchStatus(match) === "KO"
                                  ? "border-l-4 border-purple-500"
                                  : "border-l-4 border-yellow-500"
                              }`}
                            >
                              <div className="flex justify-between items-center text-xs sm:text-sm">
                                {/* Home Team */}
                                <div className="flex-[2] flex items-center justify-end gap-1 sm:gap-2">
                                  <span
                                    className="text-[10px] sm:text-sm truncate max-w-[6rem] sm:max-w-[8rem]"
                                    title={match.homeTeam}
                                  >
                                    {match.homeTeam}
                                  </span>
                                  <Avatar className="h-8 w-8 sm:h-10 sm:w-10">
                                    <AvatarImage src={match.homeImg} alt={match.homeTeam} />
                                    <AvatarFallback>{match.homeTeam[0]}</AvatarFallback>
                                  </Avatar>
                                </div>

                                {/* Score and Time */}
                                <div className="flex-[1] flex flex-col items-center justify-center text-center">
                                  <div className="flex flex-col items-center">
                                    <span className="font-semibold text-[#e01883] text-xs sm:text-sm">
                                      {match.score === "Upcoming"
                                        ? match.date
                                        : match.homeScore + " - " + match.awayScore}
                                    </span>
                                    <span className="text-[10px] sm:text-xs text-muted-foreground ml-1 sm:ml-2">
                                      {getMatchStatus(match)}
                                    </span>
                                  </div>

                                  {/* Ensure time or minute is also centered */}
                                  {getMatchStatus(match) === "KO" ? (
                                    <div className="text-[10px] sm:text-xs text-muted-foreground mt-1">
                                      {new Date(match.date).toLocaleTimeString("en-US", {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                        hour12: true,
                                      })}
                                    </div>
                                  ) : getMatchStatus(match) !== "FT" && getMatchStatus(match) !== "KO" ? (
                                    <div className="text-[10px] sm:text-xs text-muted-foreground mt-1">
                                      {match.minute}
                                    </div>
                                  ) : null}
                                </div>

                                {/* Away Team */}
                                <div className="flex-[2] flex items-center gap-1 sm:gap-2">
                                  <Avatar className="h-8 w-8 sm:h-10 sm:w-10">
                                    <AvatarImage src={match.awayImg} alt={match.awayTeam} />
                                    <AvatarFallback>{match.awayTeam[0]}</AvatarFallback>
                                  </Avatar>
                                  <span
                                    className="text-[10px] sm:text-sm truncate max-w-[6rem] sm:max-w-[8rem]"
                                    title={match.awayTeam}
                                  >
                                    {match.awayTeam}
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )
                    );
                  })}
                  {getMatchesForSelectedDate().length === 0 && (
                    <div className="text-center text-muted-foreground py-6 sm:py-8 text-sm">
                      No matches scheduled for this date
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
