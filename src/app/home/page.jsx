"use client";

import { createClient } from "../../../utils/supabase/client";
import { useState, useEffect } from "react";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
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

// Mock data for leagues
// const leagues = [
//   { id: 1, name: "Premier League Survivors", members: 124, status: "active" },
//   { id: 2, name: "Champions League Challenge", members: 56, status: "active" },
//   { id: 3, name: "Euro 2024 Predictor", members: 89, status: "upcoming" },
// ];

// Mock data for fixtures and results
// const fixturesAndResults = [
//   { id: 1, homeTeam: "Arsenal", awayTeam: "Chelsea", score: "2 - 1", date: "2023-05-02" },
//   { id: 2, homeTeam: "Liverpool", awayTeam: "Man United", score: "Upcoming", date: "2023-05-07" },
//   { id: 3, homeTeam: "Man City", awayTeam: "Tottenham", score: "3 - 0", date: "2023-04-29" },
//   { id: 4, homeTeam: "Newcastle", awayTeam: "Everton", score: "Upcoming", date: "2023-05-08" },
//   { id: 5, homeTeam: "West Ham", awayTeam: "Crystal Palace", score: "1 - 1", date: "2023-04-30" },
// ];

export default function HomePage() {
  const [leagues, setLeagues] = useState([]);
  const [user, setUser] = useState(null);
  const [fixturesAndResults, setFixturesAndResults] = useState([]);
  const [leagueCode, setLeagueCode] = useState("");
  const [leagueName, setLeagueName] = useState("");

  useEffect(() => {
    const supabase = createClient();

    const checkAuth = async () => {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (user != null) {
        setUser(user);
        fetchLeagues(user.id);
        fetchPreviousScores();
      } else {
        // If there's no user, redirect to login
        window.location.href = "/login";
      }
    };

    checkAuth();
  }, []);

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
      console.log(data);
    } catch (err) {
      console.log(err.message);
    }
  };

  const handleLogout = async () => {
    const supabase = createClient();
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Error signing out:", error.message);
    } else {
      // Redirect to home or login page after logout
      window.location.href = "/login";
    }
  };

  const handleJoinLeague = async (e) => {
    e.preventDefault();

    const formData = { leagueCode };
    try {
      const response = await fetch("/api/join-league", {
        method: "POST",
        headers: {
          "Content-Type": "application/json", // Fixed typo in "Content-Type"
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        console.log("League joined successfully");
        window.location.reload();
      } else {
        // Handle HTTP errors by parsing the response error message
        const errorData = await response.json();
        alert(`Failed to join league: ${errorData.message || "Unknown error"}`);
        console.error("Failed to join league:", errorData);
      }
    } catch (error) {
      // Handle any network or unexpected errors
      alert(`Failed to join league: ${error.message}`);
      console.error("Error:", error);
    }
  };

  const handleCreateLeague = async (e) => {
    e.preventDefault();
    const formData = {
      leagueName,
    };
    console.log("THIS IS THE FORM DATA", formData);

    try {
      const response = await fetch("/api/create-league", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        console.log("League created successfully");
        window.location.reload();
      } else {
        console.error("Failed to create league");
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  return (
    <div className="min-h-screen bg-background w-full">
      <header className="w-full">
        <nav className="flex flex-col sm:flex-row justify-between items-center w-full bg-[#4a82b0]">
          <Link href="/" className="text-2xl font-bold text-white mb-4 sm:mb-0">
            Football Last Man Standing
          </Link>
          <div className="flex space-x-4">
            <Link href="/login">
              <Button variant="ghost" className="text-white hover:text-[#e01883] hover:bg-white/10">
                Login
              </Button>
            </Link>
            <Link href="/signup">
              <Button className="bg-[#e01883] hover:bg-[#e01883]/90 text-white">Sign Up</Button>
            </Link>
          </div>
        </nav>
      </header>
      <main className="container mx-auto px-4 py-8">
        <div className="grid gap-8 md:grid-cols-2">
          <section aria-labelledby="leagues-title">
            <div className="flex justify-between items-center mb-4">
              <h2 id="leagues-title" className="text-xl font-semibold text-[#4a82b0] dark:text-[#7ab3e0]">
                Your Leagues
              </h2>
              <div className="space-x-2">
                <Dialog>
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
                <Dialog>
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
                                <div className="text-sm text-muted-foreground">{league.members} members</div>
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
          <section aria-labelledby="fixtures-results-title">
            <h2 id="fixtures-results-title" className="text-xl font-semibold mb-4 text-[#4a82b0]">
              Recent Scores & Fixtures
            </h2>
            <Card className="border-t-4 border-t-[#e01883]">
              <Tabs defaultValue="all" className="w-full">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Matches</CardTitle>
                    <TabsList className="bg-[#4a82b0]/10">
                      <TabsTrigger
                        value="all"
                        className="data-[state=active]:bg-[#4a82b0] data-[state=active]:text-white"
                      >
                        All
                      </TabsTrigger>
                      <TabsTrigger
                        value="results"
                        className="data-[state=active]:bg-[#4a82b0] data-[state=active]:text-white"
                      >
                        Results
                      </TabsTrigger>
                      <TabsTrigger
                        value="live"
                        className="data-[state=active]:bg-[#4a82b0] data-[state=active]:text-white"
                      >
                        Live
                      </TabsTrigger>
                    </TabsList>
                  </div>
                </CardHeader>
                <CardContent>
                  <TabsContent value="all" className="space-y-4">
                    {fixturesAndResults.map((match) => (
                      <div key={match.id} className="flex items-center">
                        <div className="w-[40%] flex items-center justify-end space-x-2">
                          <span className="text-sm">{match.homeTeam}</span>
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={match.homeImg} alt={match.homeTeam} />
                            <AvatarFallback>{match.homeTeam[0]}</AvatarFallback>
                          </Avatar>
                        </div>
                        <div className="w-[20%] text-center px-2">
                          <span className="font-semibold text-[#e01883] whitespace-nowrap">
                            {match.score === "Upcoming" ? match.date : match.homeScore + " - " + match.awayScore}
                          </span>
                        </div>
                        <div className="w-[40%] flex items-center space-x-2">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={match.awayImg} alt={match.awayTeam} />
                            <AvatarFallback>{match.awayTeam[0]}</AvatarFallback>
                          </Avatar>
                          <span className="text-sm">{match.awayTeam}</span>
                        </div>
                      </div>
                    ))}
                  </TabsContent>
                  <TabsContent value="results" className="space-y-4">
                    {fixturesAndResults
                      .filter((match) => match.eventProgress == "PostEvent")
                      .map((match) => (
                        <div key={match.id} className="flex items-center">
                          <div className="w-[40%] flex items-center justify-end space-x-2">
                            <span className="text-sm">{match.homeTeam}</span>
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={match.homeImg} alt={match.homeTeam} />
                              <AvatarFallback>{match.homeTeam[0]}</AvatarFallback>
                            </Avatar>
                          </div>
                          <div className="w-[20%] text-center px-2">
                            <span className="font-semibold text-[#e01883] whitespace-nowrap">
                              {match.score === "Upcoming" ? match.date : match.homeScore + " - " + match.awayScore}
                            </span>
                          </div>
                          <div className="w-[40%] flex items-center space-x-2">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={match.awayImg} alt={match.awayTeam} />
                              <AvatarFallback>{match.awayTeam[0]}</AvatarFallback>
                            </Avatar>
                            <span className="text-sm">{match.awayTeam}</span>
                          </div>
                        </div>
                      ))}
                  </TabsContent>
                  <TabsContent value="live" className="space-y-4">
                    {fixturesAndResults
                      .filter((match) => match.eventProgress == "MidEvent")
                      .map((match) => (
                        <div key={match.id} className="flex items-center">
                          <div className="w-[40%] flex items-center justify-end space-x-2">
                            <span className="text-sm">{match.homeTeam}</span>
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={match.homeImg} alt={match.homeTeam} />
                              <AvatarFallback>{match.homeTeam[0]}</AvatarFallback>
                            </Avatar>
                          </div>
                          <div className="w-[20%] text-center px-2">
                            <span className="font-semibold text-[#e01883] whitespace-nowrap">
                              {match.score === "Upcoming" ? match.date : match.homeScore + " - " + match.awayScore}
                            </span>
                          </div>
                          <div className="w-[40%] flex items-center space-x-2">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={match.awayImg} alt={match.awayTeam} />
                              <AvatarFallback>{match.awayTeam[0]}</AvatarFallback>
                            </Avatar>
                            <span className="text-sm">{match.awayTeam}</span>
                          </div>
                        </div>
                      ))}
                  </TabsContent>
                </CardContent>
              </Tabs>
            </Card>
          </section>
        </div>
      </main>
    </div>
  );
}
