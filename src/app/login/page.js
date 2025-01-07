"use client";

import { createClient } from "../../../utils/supabase/client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { login } from "./action";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FcGoogle } from "react-icons/fc";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    console.log("HI");
    const supabase = await createClient();
    if (email && password) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (data.user) {
        router.push("/");
      }
    } else {
      setError("Please enter both email and password");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#4a82b0]/10">
      <Card className="w-full max-w-md border-t-4 border-t-[#e01883]">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center text-[#4a82b0]">Login</CardTitle>
          <CardDescription className="text-center">to Football Last Man Standing</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-[#4a82b0]">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                className="border-[#4a82b0] focus-visible:ring-[#e01883]"
                value={email}
                onChange={(e) => setEmail(e.target.value)} // Update email state
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-[#4a82b0]">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                className="border-[#4a82b0] focus-visible:ring-[#e01883]"
                value={password}
                onChange={(e) => setPassword(e.target.value)} // Update password state
              />
            </div>
            {/* {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )} */}
            <Button onClick={handleLogin} type="submit" className="w-full bg-[#4a82b0] hover:bg-[#4a82b0]/90">
              Login
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <div className="relative w-full">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-[#4a82b0]/30" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
            </div>
          </div>
          <form className="w-full">
            <Button
              formAction={login}
              variant="outline"
              className="w-full border-[#4a82b0] text-[#4a82b0] hover:bg-[#4a82b0]/10"
            >
              <FcGoogle className="mr-2 h-4 w-4" />
              Login with Google
            </Button>
          </form>
        </CardFooter>
      </Card>
    </div>
  );
}
