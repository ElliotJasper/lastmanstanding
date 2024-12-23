"use client";

import { useState, useEffect } from "react"; // Import useState and useEffect
import { createClient } from "../../../utils/supabase/client";
import Link from "next/link"; // Assuming you're using Next.js for routing
import { Button } from "@/components/ui/button";

const Navbar = () => {
  const [user, setUser] = useState(null); // State to hold the user
  const [loading, setLoading] = useState(true); // State to track loading state

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

  useEffect(() => {
    const supabase = createClient();

    const checkAuth = async () => {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (user != null) {
        setUser(user);
      } else {
        // If no user is found, redirect to login
        window.location.href = "/login";
      }
      setLoading(false); // Set loading to false after checking authentication
    };

    checkAuth();
  }, []);

  if (loading) {
    // Optionally, you can add a loading indicator while checking auth
    return <div>Loading...</div>;
  }

  return (
    <header className="w-full">
      <nav className="flex flex-col sm:flex-row justify-between items-center w-full bg-[#4a82b0]">
        <Link href="/" className="text-2xl font-bold text-white mb-4 sm:mb-0">
          Football Last Man Standing
        </Link>
        <div className="flex space-x-4">
          {user ? (
            // If a user is logged in, show the profile link
            <>
              <Link href={`/profile/${user.id}`}>
                <Button className="bg-[#4a82b0] hover:bg-[#3b74a2] text-white">Profile</Button>
              </Link>
              <Button onClick={handleLogout} className="bg-[#e01883] hover:bg-[#d0177a] text-white">
                Logout
              </Button>
            </>
          ) : (
            // Otherwise, show the login and signup buttons
            <>
              <Link href="/login">
                <Button variant="ghost" className="text-white hover:text-[#e01883] hover:bg-white/10">
                  Login
                </Button>
              </Link>
              <Link href="/signup">
                <Button className="bg-[#e01883] hover:bg-[#e01883]/90 text-white">Sign Up</Button>
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
};

export default Navbar;
