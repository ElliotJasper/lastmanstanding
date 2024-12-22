"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trophy, Users, Calendar, ArrowRight } from "lucide-react";
import Navbar from "@/components/custom/navbar";

export default function LandingPage() {
  const [email, setEmail] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    // Handle email submission logic here
    console.log("Email submitted:", email);
    setEmail("");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#4a82b0] to-[#2c5282]">
      <Navbar />

      <main className="container mx-auto px-4 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h1 className="text-5xl font-bold text-white mb-6">The Ultimate Football Survival Game</h1>
          <p className="text-xl text-white/80 mb-8">
            Test your football knowledge, make weekly picks, and be the last one standing!
          </p>
          <Link href="/home">
            <Button size="lg" className="bg-[#e01883] hover:bg-[#e01883]/90 text-white">
              Start Playing Now <ArrowRight className="ml-2" />
            </Button>
          </Link>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <Card className="bg-white/10 border-none text-white">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Trophy className="mr-2" /> Last Man Standing
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-white/80">
                Pick one team each week to win. If your team wins, you advance. Last player remaining wins it all!
              </CardDescription>
            </CardContent>
          </Card>
          <Card className="bg-white/10 border-none text-white">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="mr-2" /> Compete with Friends
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-white/80">
                Create or join leagues with your friends, family, or colleagues. Climb the leaderboard and claim
                bragging rights!
              </CardDescription>
            </CardContent>
          </Card>
          <Card className="bg-white/10 border-none text-white">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="mr-2" /> Weekly Challenges
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-white/80">
                Face new challenges every week as you navigate through the football season. Strategy and knowledge are
                key!
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl font-bold text-white mb-4">How It Works</h2>
          <div className="max-w-2xl mx-auto">
            <ol className="list-decimal list-inside text-white/80 text-left space-y-4">
              <li>Sign up and create or join a league</li>
              <li>Each week, pick one team you think will win their match</li>
              <li>If your team wins, you advance to the next week</li>
              <li>If your team loses or draws, you're eliminated</li>
              <li>You can't pick the same team twice in a season</li>
              <li>The last player remaining in the league wins!</li>
            </ol>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="text-center"
        >
          <h2 className="text-3xl font-bold text-white mb-4">Stay Updated</h2>
          <p className="text-white/80 mb-4">Sign up for our newsletter to get the latest news and updates!</p>
          <form onSubmit={handleSubmit} className="flex justify-center">
            <div className="flex w-full max-w-sm items-center space-x-2">
              <Input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
              />
              <Button type="submit" className="bg-[#e01883] hover:bg-[#e01883]/90 text-white">
                Subscribe
              </Button>
            </div>
          </form>
        </motion.div>
      </main>

      <footer className="container mx-auto px-4 py-8 text-center text-white/60">
        <p>&copy; 2023 Football Last Man Standing. All rights reserved.</p>
      </footer>
    </div>
  );
}
