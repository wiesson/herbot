"use client";

import { use, useEffect, useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { ArrowLeft, Slack, Trash2, UserMinus } from "lucide-react";
import type { Id } from "@convex/_generated/dataModel";

interface WorkspaceSettingsPageProps {
  params: Promise<{ slug: string }>;
}

type Priority = "critical" | "high" | "medium" | "low";
type Role = "admin" | "member" | "viewer";

export default function WorkspaceSettingsPage({ params }: WorkspaceSettingsPageProps) {
  const { slug } = use(params);
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const router = useRouter();

  // Form state
  const [workspaceName, setWorkspaceName] = useState("");
  const [aiExtractionEnabled, setAiExtractionEnabled] = useState(true);
  const [defaultPriority, setDefaultPriority] = useState<Priority | "">("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Queries
  const workspace = useQuery(api.workspaces.getBySlug, { slug });
  const members = useQuery(
    api.workspaces.getMembers,
    workspace ? { workspaceId: workspace._id } : "skip"
  );
  const userMembership = useQuery(
    api.workspaces.getUserMembership,
    workspace && user ? { workspaceId: workspace._id, userId: user._id } : "skip"
  );

  // Mutations
  const updateWorkspace = useMutation(api.workspaces.update);
  const updateMemberRole = useMutation(api.workspaces.updateMemberRole);
  const removeMember = useMutation(api.workspaces.removeMember);
  const deleteWorkspace = useMutation(api.workspaces.deleteWorkspace);

  // Derived state
  const isAdmin = userMembership?.role === "admin";
  const validMembers = members?.filter((m): m is NonNullable<typeof m> => m !== null) ?? [];
  const adminCount = validMembers.filter((m) => m.role === "admin").length;

  // Sync form state with workspace data
  useEffect(() => {
    if (workspace) {
      setWorkspaceName(workspace.name);
      setAiExtractionEnabled(workspace.settings?.aiExtractionEnabled ?? true);
      setDefaultPriority(workspace.settings?.defaultTaskPriority ?? "");
    }
  }, [workspace]);

  // Auth redirect
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [authLoading, isAuthenticated, router]);

  // Handlers
  const handleNameBlur = async () => {
    if (workspace && workspaceName !== workspace.name && workspaceName.trim()) {
      await updateWorkspace({
        id: workspace._id,
        name: workspaceName.trim(),
      });
    }
  };

  const handleAiExtractionChange = async (checked: boolean) => {
    setAiExtractionEnabled(checked);
    if (workspace) {
      await updateWorkspace({
        id: workspace._id,
        settings: {
          aiExtractionEnabled: checked,
          defaultTaskPriority: defaultPriority || undefined,
        },
      });
    }
  };

  const handlePriorityChange = async (value: string | null) => {
    if (value === null) return;
    const priority = value as Priority | "";
    setDefaultPriority(priority);
    if (workspace) {
      await updateWorkspace({
        id: workspace._id,
        settings: {
          aiExtractionEnabled,
          defaultTaskPriority: priority || undefined,
        },
      });
    }
  };

  const handleRoleChange = async (userId: Id<"users">, role: Role) => {
    if (workspace) {
      await updateMemberRole({
        workspaceId: workspace._id,
        userId,
        role,
      });
    }
  };

  const handleRemoveMember = async (userId: Id<"users">) => {
    if (workspace) {
      await removeMember({
        workspaceId: workspace._id,
        userId,
      });
    }
  };

  const handleDeleteWorkspace = async () => {
    if (workspace) {
      await deleteWorkspace({ id: workspace._id });
      router.push("/");
    }
  };

  // Loading state
  if (authLoading || !workspace) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Link
          href={`/w/${slug}`}
          className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "mb-6")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Workspace
        </Link>

        <h1 className="text-2xl font-bold mb-6">Workspace Settings</h1>

        {/* General Section */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>General</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="workspace-name">Workspace Name</Label>
              <Input
                id="workspace-name"
                value={workspaceName}
                onChange={(e) => setWorkspaceName(e.target.value)}
                onBlur={handleNameBlur}
                placeholder="Workspace name"
              />
            </div>

            <div className="space-y-2">
              <Label>Slack Team</Label>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">
                  <Slack className="h-3 w-3 mr-1" />
                  {workspace.slackTeamName}
                </Badge>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Created</Label>
              <p className="text-sm text-muted-foreground">
                {new Date(workspace.createdAt).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Settings Section */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>AI Extraction</Label>
                <p className="text-sm text-muted-foreground">
                  Automatically extract task details from Slack messages
                </p>
              </div>
              <Switch
                checked={aiExtractionEnabled}
                onCheckedChange={handleAiExtractionChange}
              />
            </div>

            <div className="space-y-2">
              <Label>Default Task Priority</Label>
              <Select
                value={defaultPriority || null}
                onValueChange={handlePriorityChange}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue>
                    {defaultPriority
                      ? defaultPriority.charAt(0).toUpperCase() + defaultPriority.slice(1)
                      : "Select priority"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Members Section */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Members</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {validMembers.map((member) => {
                const isCurrentUser = member.userId === user._id;
                const isLastAdmin = member.role === "admin" && adminCount === 1;
                const canChangeRole = isAdmin && !isCurrentUser && !isLastAdmin;
                const canRemove = isAdmin && !isCurrentUser && !isLastAdmin;

                return (
                  <div
                    key={member.membershipId}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={member.avatarUrl} alt={member.name} />
                        <AvatarFallback>{member.name?.[0] ?? "?"}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">
                          {member.name}
                          {isCurrentUser && (
                            <span className="text-muted-foreground ml-1">(you)</span>
                          )}
                        </p>
                        <p className="text-sm text-muted-foreground">{member.email}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {canChangeRole ? (
                        <Select
                          value={member.role}
                          onValueChange={(value) => {
                            if (value) handleRoleChange(member.userId, value as Role);
                          }}
                        >
                          <SelectTrigger className="w-[120px]" size="sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="admin">Admin</SelectItem>
                            <SelectItem value="member">Member</SelectItem>
                            <SelectItem value="viewer">Viewer</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <Badge variant="secondary" className="capitalize">
                          {member.role}
                        </Badge>
                      )}

                      {canRemove && (
                        <AlertDialog>
                          <AlertDialogTrigger
                            render={<Button variant="ghost" size="icon-sm" />}
                          >
                            <UserMinus className="h-4 w-4" />
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Remove member?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to remove {member.name} from this
                                workspace? They will lose access to all tasks and data.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleRemoveMember(member.userId)}
                              >
                                Remove
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        {isAdmin && (
          <Card className="border-destructive/50">
            <CardHeader>
              <CardTitle className="text-destructive">Danger Zone</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Delete Workspace</p>
                  <p className="text-sm text-muted-foreground">
                    Permanently delete this workspace and all its data
                  </p>
                </div>
                <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                  <AlertDialogTrigger render={<Button variant="destructive" />}>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete "{workspace.name}"?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently delete this workspace, including all tasks,
                        repositories, and channel mappings. This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDeleteWorkspace}
                        className={buttonVariants({ variant: "destructive" })}
                      >
                        Delete Workspace
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
