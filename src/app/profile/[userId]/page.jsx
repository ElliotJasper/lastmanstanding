"use client";

import { useAuth } from "../../../../contexts/AuthContext";
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

const getAvatar = async (userId) => {
  const response = await fetch(`/api/get-user-avatar/${userId}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });
  if (!response.ok) {
    throw new Error("Failed to fetch user avatar");
  }

  return response.text();
};

export default function ProfilePage({ params }) {
  const [displayName, setDisplayName] = useState("");
  const { user, loading } = useAuth();
  const [profilePicture, setProfilePicture] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [profile, setProfile] = useState(null);
  const [hasUpdatedAvatar, setHasUpdatedAvatar] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      window.location.href = "/login";
      return;
    }

    if (user) {
      fetchUserData();
    }
  }, [user, loading]);

  const fetchUserData = async () => {
    try {
      setIsLoading(true);
      // Fetch user data and avatar in parallel
      const [userData, avatarUrl] = await Promise.all([getUserInfo(params.userId), getAvatar(params.userId)]);

      setDisplayName(userData.display_name);
      setProfilePicture(avatarUrl);
    } catch (error) {
      console.error("Error fetching user data:", error);
      setError("Failed to load user profile");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisplayNameChange = (e) => {
    setDisplayName(e.target.value);
  };

  const handleProfilePictureChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePicture(reader.result);
      };
      reader.readAsDataURL(file);
      setHasUpdatedAvatar(true);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsLoading(true);

    try {
      const body = {
        display_name: displayName,
        profile_picture: hasUpdatedAvatar ? profilePicture : null,
      };

      const response = await fetch(`/api/update-user-info/${params.userId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update profile");
      }

      setSuccess("Profile updated successfully!");

      // Optionally refresh the data
      await fetchUserData();
    } catch (err) {
      setError(err.message || "An error occurred while updating the profile");
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading state while checking auth or fetching initial data
  if (loading || isLoading) {
    return (
      <div className="min-h-screen bg-background w-full flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // If not loading and no user, return null (page will redirect)
  if (!user) {
    return null;
  }

  return (
    <div className="mx-auto">
      <Card className="max-w-2xl mx-auto border-t-4 border-t-[#e01883] mt-8">
        <CardHeader>
          <CardTitle className="text-2xl text-[#4a82b0]">Your Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex flex-col items-center space-y-4">
              <Avatar className="w-32 h-32">
                <AvatarImage src={profilePicture} alt="Profile picture" />
                {/* <AvatarFallback>{displayName.slice(0, 2).toUpperCase()}</AvatarFallback> */}
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
            </div>
            <div className="space-y-2">
              <Label htmlFor="display-name">Display Name</Label>
              <Input
                id="display-name"
                type="text"
                placeholder={profile?.display_name ?? "Enter display name"}
                value={displayName}
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
            <Button type="submit" className="w-full bg-[#4a82b0] hover:bg-[#4a82b0]/90" disabled={isLoading}>
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
