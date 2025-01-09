"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";

const LeaguePicksDisplay = ({ picks, selectedPick, onTeamClick, onSubmit, successMessage }) => {
  // State for the active tab
  const [activeTab, setActiveTab] = useState(null);
  const [isMobile, setIsMobile] = useState(false);

  // Group picks by league
  const picksByLeague = picks.reduce((acc, pick) => {
    if (!acc[pick.league]) {
      acc[pick.league] = [];
    }
    acc[pick.league].push(pick);
    return acc;
  }, {});

  // Get unique leagues
  const leagues = Object.keys(picksByLeague);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Set the active tab when leagues are available
  useEffect(() => {
    if (!activeTab && leagues.length > 0) {
      const premierLeague = leagues.find(
        (league) =>
          league === "Premier League" ||
          league.toLowerCase() === "premier league" ||
          league.toLowerCase().includes("premier")
      );
      setActiveTab(premierLeague || leagues[0]);
    }
  }, [leagues, activeTab]);

  // Don't render until we have an active tab
  if (!activeTab) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <div className="w-8 h-8 border-4 border-[#4a82b0] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const LeagueSelector = isMobile ? (
    <div className="w-full mb-4">
      <select
        value={activeTab}
        onChange={(e) => setActiveTab(e.target.value)}
        className="w-full p-2 border rounded-lg bg-white text-sm"
      >
        {leagues.map((league) => (
          <option key={league} value={league}>
            {league}
          </option>
        ))}
      </select>
    </div>
  ) : (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="w-full flex bg-[#4a82b0]/10 p-1 rounded-lg">
        {leagues.map((league) => (
          <TabsTrigger
            key={league}
            value={league}
            className="flex-1 data-[state=active]:bg-[#4a82b0] data-[state=active]:text-white"
          >
            {league}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );

  return (
    <div className="space-y-4">
      {LeagueSelector}

      <ScrollArea className="h-[400px]">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 p-4">
          {picksByLeague[activeTab].map((team) => (
            <TooltipProvider key={`${team.team}-${team.date}`}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Card
                    className={`cursor-pointer transition-all ${
                      selectedPick?.team === team.team ? "ring-2 ring-[#e01883]" : ""
                    }`}
                    onClick={() => onTeamClick(team.team, team.date)}
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
                <TooltipContent>
                  <p>
                    Pick {team.team} for {new Date(team.date).toLocaleDateString()}
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ))}
        </div>
      </ScrollArea>

      <div className="mt-6 text-center">
        <Button onClick={onSubmit} disabled={!selectedPick} className="bg-[#4a82b0] hover:bg-[#4a82b0]/90 text-white">
          Submit Pick
        </Button>
        {successMessage && <div className="text-green-500 mt-4">{successMessage}</div>}
      </div>
    </div>
  );
};

export default LeaguePicksDisplay;
