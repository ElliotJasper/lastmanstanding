"use client";

import { createClient } from "../../../../utils/supabase/client";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import { AlertCircle, Loader2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const getUserInfo = async (userId) => {
  const response = await fetch(`/api/get-user-info/${userId}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch user profile");
  }

  return response.json();
};

export default function ProfilePage({ params }) {
  const [displayName, setDisplayName] = useState("John Doe");
  const [user, setUser] = useState(null);
  const [newDisplayName, setNewDisplayName] = useState("");
  const [profilePicture, setProfilePicture] = useState("/placeholder.svg?height=128&width=128");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    const supabase = createClient();

    const checkAuth = async () => {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (user != null) {
        setUser(user);
        getUserData();
      } else {
        // If there's no user, redirect to login
        window.location.href = "/login";
      }
    };

    checkAuth();
  }, []);

  const getUserData = async () => {
    try {
      const data = await getUserInfo(params.userId);
      console.log(data);
      setProfile(data);
    } catch (error) {
      console.error(error);
    }
  };

  const handleDisplayNameChange = (e) => {
    setNewDisplayName(e.target.value);
  };

  const handleProfilePictureChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePicture(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const updateProfile = async (userId, displayName) => {
    const response = await fetch(`/api/update-user-info/${userId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ display_name: displayName }),
    });

    if (!response.ok) {
      throw new Error("Failed to update user profile");
    }

    window.location.reload();
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);
    updateProfile(params.userId, newDisplayName);
    // Simulate API call
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6 text-center text-[#4a82b0]">
        Football Last Man Standing
      </h1>
      <Card className="max-w-2xl mx-auto border-t-4 border-t-[#e01883]">
        <CardHeader>
          <CardTitle className="text-2xl text-[#4a82b0]">Your Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* <div className="flex flex-col items-center space-y-4">
              <Avatar className="w-32 h-32">
                <AvatarImage src={profilePicture} alt="Profile picture" />
                <AvatarFallback>{displayName.slice(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <Label
                htmlFor="profile-picture"
                className="cursor-pointer bg-[#4a82b0] text-white py-2 px-4 rounded hover:bg-[#4a82b0]/90 transition-colors"
              >
                Change Profile Picture
              </Label>
              <Input
                id="profile-picture"
                type="file"
                accept="image/*"
                onChange={handleProfilePictureChange}
                className="hidden"
              />
            </div> */}
            <div className="space-y-2">
              <Label htmlFor="display-name">Display Name</Label>
              <Input
                id="display-name"
                type="text"
                placeholder={profile?.display_name ?? "Enter display name"}
                value={newDisplayName}
                onChange={handleDisplayNameChange}
              />
            </div>
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            {success && (
              <Alert variant="default" className="bg-green-100 text-green-800 border-green-300">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Success</AlertTitle>
                <AlertDescription>{success}</AlertDescription>
              </Alert>
            )}
            <Button
              type="submit"
              className="w-full bg-[#4a82b0] hover:bg-[#4a82b0]/90"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                "Update Profile"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
