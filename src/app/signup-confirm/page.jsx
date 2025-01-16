"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function ConfirmationEmailPage() {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <main className="w-full p-4">
        <Card className="w-full max-w-md mx-auto border-t-4 border-t-[#e01883]">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center text-[#4a82b0]">Check Your Email</CardTitle>
            <CardDescription className="text-center">We've sent you a confirmation email</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-center text-muted-foreground">
              Click the link in the email to confirm your account and complete the sign-up process.
            </p>
            <p className="text-sm text-center text-muted-foreground">
              Didn't receive the email? Check your spam folder or contact support.
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
