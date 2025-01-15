"use client";
import { useAuth } from "../../../contexts/AuthContext";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const Navbar = () => {
  const { user, loading, handleLogout } = useAuth();

  if (loading) {
    return <div>Loading...</div>; // Show loading state only when loading is true
  }

  return (
    <header className="w-full">
      <nav className="flex flex-col sm:flex-row justify-between items-center w-full bg-[#4a82b0]">
        <Link href="/" className="text-2xl font-bold text-white mb-4 sm:mb-0">
          Last Man Standing
        </Link>
        <div className="flex space-x-4">
          {user ? (
            <>
              <Link href={`/profile`}>
                <Button className="bg-[#4a82b0] hover:bg-[#3b74a2] text-white">Profile</Button>
              </Link>
              <Button className="bg-[#4a82b0] hover:bg-[#3b74a2] text-white" onClick={handleLogout}>
                Logout
              </Button>
            </>
          ) : (
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
