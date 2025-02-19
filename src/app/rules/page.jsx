import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Navbar from "@/components/custom/Navbar";

export default function Rules() {
  return (
    <div className="min-h-screen bg-gray-100">
      <main className="container mx-auto py-8 px-4">
        <Card className="w-full max-w-4xl mx-auto border-t-4 border-t-[#e01883]">
          <CardHeader>
            <CardTitle className="text-3xl font-bold text-center text-[#4a82b0]">Last Man Standing Rules</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <section>
                <h2 className="text-2xl font-semibold text-[#4a82b0] mb-2">1. Game Objective</h2>
                <p>
                  The objective of Last Man Standing is to be the last player remaining in the competition by correctly
                  predicting one winning team each week from a selection of matches.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-[#4a82b0] mb-2">2. How to Play</h2>
                <ul className="list-disc pl-6 space-y-2">
                  <li>
                    First, either join a league by using the code the league creator has shared with you, or create your
                    own league and share the code with your friends.{" "}
                    <strong>Do not activate the league until everyone has joined.</strong>
                  </li>
                  <li>Each week, players must select one team they believe will win their match.</li>
                  <li>Valid games lie on or between Friday to Monday.</li>
                  <li>If the chosen team wins, the player advances to the next week.</li>
                  <li>If the chosen team loses or draws, the player is eliminated from the competition.</li>
                  <li>Players cannot pick the same team more than once during the season.</li>
                  <li>Valid leagues are from the Premier League down to League Two</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-[#4a82b0] mb-2">3. Selection Deadlines</h2>
                <ul className="list-disc pl-6 space-y-2">
                  <li>
                    There are no strict deadlines, but selections can only be made to games that have not kicked off
                    yet.
                  </li>
                  <li>Selections for the following week open up on Tuesday.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-[#4a82b0] mb-2">4. Winning the Game</h2>
                <p>
                  The last player remaining in the competition after all other players have been eliminated is declared
                  the winner. In the event that all remaining players are eliminated in the same week, no one wins.
                  Typically at this point a new league is started.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-[#4a82b0] mb-2">6. Postponed or Abandoned Matches</h2>
                <p>
                  If a selected match is postponed or abandoned, the selection will be removed and the player has until
                  the rest of the gameweek to make a new selection. If the player fails to make a new selection, or
                  there are no more valid selections, they will be eliminated from the competition.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-[#4a82b0] mb-2">7. Multiple Leagues</h2>
                <p>
                  Players can participate in multiple leagues, but each league is treated as a separate competition with
                  its own picks and eliminations.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-[#4a82b0] mb-2">9. Rule Changes</h2>
                <p>
                  The organizers reserve the right to amend these rules at any time. Any changes will be communicated to
                  all participants via email and posted on the website.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-[#4a82b0] mb-2">10. Dispute Resolution</h2>
                <p>In the event of any dispute, the decision of the website creators will be final and binding.</p>
              </section>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
