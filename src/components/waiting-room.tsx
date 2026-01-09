"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Clock, LogOut, Github } from "lucide-react";

interface User {
  _id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  githubUsername: string;
}

interface WaitingRoomProps {
  user: User;
}

export function WaitingRoom({ user }: WaitingRoomProps) {
  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      {/* Header */}
      <header className="border-b bg-white dark:bg-neutral-900">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-xl font-bold text-emerald-600">Norbot</h1>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user.avatarUrl} alt={user.name} />
                <AvatarFallback>{user.name[0]}</AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium hidden sm:inline">
                {user.name}
              </span>
            </div>
            <form action="/api/auth/logout" method="POST" className="inline">
              <button
                type="submit"
                className={cn(
                  buttonVariants({ variant: "ghost", size: "icon" })
                )}
              >
                <LogOut className="h-5 w-5" />
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-16">
        <Card className="max-w-md mx-auto">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
              <Clock className="h-8 w-8 text-amber-600 dark:text-amber-400" />
            </div>
            <CardTitle>Waiting for Invitation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-center">
            <p className="text-muted-foreground">
              Your account has been created, but you need to be invited to a
              workspace before you can use Norbot.
            </p>

            <div className="p-4 rounded-lg bg-muted/50 space-y-2">
              <p className="text-sm font-medium">Your GitHub username:</p>
              <div className="flex items-center justify-center gap-2">
                <Github className="h-4 w-4" />
                <span className="font-mono">{user.githubUsername}</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Share this with a workspace admin to receive an invitation
              </p>
            </div>

            <p className="text-sm text-muted-foreground">
              Contact your team admin to request access.
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
