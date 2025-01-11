import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Navbar from "@/components/custom/Navbar";

export default function Rules() {
  return (
    <div className="min-h-screen bg-gray-100">
      <main className="container mx-auto py-8 px-4">
        <Card className="w-full max-w-4xl mx-auto border-t-4 border-t-[#e01883]">
          <CardHeader>
            <CardTitle className="text-3xl font-bold text-center text-[#4a82b0]">
              Football Last Man Standing Rules
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[calc(100vh-200px)] pr-4">
              <div className="space-y-6">
                <section>
                  <h2 className="text-2xl font-semibold text-[#4a82b0] mb-2">1. Game Objective</h2>
                  <p>
                    The objective of Football Last Man Standing is to be the last player remaining in the competition by
                    correctly predicting one winning team each week from a selection of matches.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-semibold text-[#4a82b0] mb-2">2. How to Play</h2>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Each week, players must select one team they believe will win their match.</li>
                    <li>If the chosen team wins, the player advances to the next week.</li>
                    <li>If the chosen team loses or draws, the player is eliminated from the competition.</li>
                    <li>Players cannot pick the same team more than once during the season.</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-2xl font-semibold text-[#4a82b0] mb-2">3. Selection Deadlines</h2>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>
                      All selections must be made before Friday of the first match of each game week. Late selections
                      will not be accepted, and failure to make a selection will result in elimination.
                    </li>
                    <li>Selections for the following week open up on Tuesday, giving you 3 days to pick</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-2xl font-semibold text-[#4a82b0] mb-2">4. Winning the Game</h2>
                  <p>
                    The last player remaining in the competition after all other players have been eliminated is
                    declared the winner. In the event that all remaining players are eliminated in the same week, the
                    prize will be shared equally among them.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-semibold text-[#4a82b0] mb-2">6. Postponed or Abandoned Matches</h2>
                  <p>
                    If a selected match is postponed or abandoned, the selection will stand for the rescheduled match,
                    unless it falls outside the current game week. In such cases, the player will be allowed to make a
                    new selection.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-semibold text-[#4a82b0] mb-2">7. Multiple Leagues</h2>
                  <p>
                    Players can participate in multiple leagues, but each league is treated as a separate competition
                    with its own set of rules and prize pool.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-semibold text-[#4a82b0] mb-2">9. Rule Changes</h2>
                  <p>
                    The organizers reserve the right to amend these rules at any time. Any changes will be communicated
                    to all participants via email and posted on the website.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-semibold text-[#4a82b0] mb-2">10. Dispute Resolution</h2>
                  <p>In the event of any dispute, the decision of the website creators will be final and binding.</p>
                </section>
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
