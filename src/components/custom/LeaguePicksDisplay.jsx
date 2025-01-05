import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TooltipProvider, Tooltip, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";

const LeaguePicksDisplay = ({ picks, selectedPick, onTeamClick, onSubmit, successMessage }) => {
  // State for the active tab
  const [activeTab, setActiveTab] = useState(null);

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

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full flex overflow-x-auto">
          {leagues.map((league) => (
            <TabsTrigger key={league} value={league} className="flex-1 min-w-fit">
              {league}
            </TabsTrigger>
          ))}
        </TabsList>

        {leagues.map((league) => (
          <TabsContent key={league} value={league}>
            <ScrollArea className="h-[400px]">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 p-8">
                {picksByLeague[league].map((team) => (
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
                    </Tooltip>
                  </TooltipProvider>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>
        ))}
      </Tabs>

      <div className="mt-6 text-center">
        <Button onClick={onSubmit} disabled={!selectedPick} className="bg-[#4a82b0] hover:bg-[#4a82b0]/90">
          Submit Pick
        </Button>
        {successMessage && <div className="text-green-500 mt-4">{successMessage}</div>}
      </div>
    </div>
  );
};

export default LeaguePicksDisplay;
