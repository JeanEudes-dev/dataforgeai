import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../../../api/client";
import { Button } from "../../../components/ui/button";
import {
  Plus,
  Folder,
  MoreVertical,
  Clock,
  Database,
  ArrowRight,
  LayoutGrid,
  Search,
  Trash2,
  Settings,
  Loader2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { containerVariants, listItemVariants } from "../../../theme/motion";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../../components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../../../components/ui/dialog";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import { Textarea } from "../../../components/ui/textarea";
import { useToast } from "../../../hooks/use-toast";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../../components/ui/dropdown-menu";

export const ProjectsPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const { data: projects, isLoading } = useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const response = await apiClient.get("/core/projects/");
      return response.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: { name: string; description: string }) => {
      const response = await apiClient.post("/core/projects/", data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      setIsCreateOpen(false);
      setName("");
      setDescription("");
      toast({
        title: "Project created",
        description: "Your new project has been successfully created.",
      });
    },
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;
    createMutation.mutate({ name, description });
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="initial"
      animate="animate"
      className="space-y-10"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Projects
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage and organize your data analytics workspaces.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative hidden md:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search projects..."
              className="pl-9 w-64 bg-muted/50 border-none focus-visible:ring-1 focus-visible:ring-primary/20"
            />
          </div>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 shadow-sm">
                <Plus className="h-4 w-4" />
                New Project
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle className="text-xl">
                  Create New Project
                </DialogTitle>
                <DialogDescription>
                  Give your project a name and description to get started.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreate} className="space-y-6 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-semibold">
                    Project Name
                  </Label>
                  <Input
                    id="name"
                    placeholder="e.g., Marketing Analytics 2024"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="rounded-lg"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label
                    htmlFor="description"
                    className="text-sm font-semibold"
                  >
                    Description (Optional)
                  </Label>
                  <Textarea
                    id="description"
                    placeholder="Briefly describe the goals of this project..."
                    value={description}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                      setDescription(e.target.value)
                    }
                    className="rounded-lg min-h-[100px] resize-none"
                  />
                </div>
                <DialogFooter className="pt-4">
                  <Button
                    type="submit"
                    className="w-full sm:w-auto px-8"
                    disabled={createMutation.isPending || !name}
                  >
                    {createMutation.isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Create Project
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-56 bg-card/50 animate-pulse rounded-2xl border border-border"
            />
          ))}
        </div>
      ) : projects?.results?.length === 0 ? (
        <motion.div variants={listItemVariants}>
          <Card className="flex flex-col items-center justify-center py-24 text-center border-2 border-dashed border-muted bg-transparent">
            <div className="h-20 w-20 rounded-full bg-muted/50 flex items-center justify-center mb-6">
              <Folder className="h-10 w-10 text-muted-foreground/50" />
            </div>
            <CardTitle className="text-xl">No projects yet</CardTitle>
            <CardDescription className="max-w-sm mt-2 text-base">
              Create your first project to start uploading datasets and training
              models.
            </CardDescription>
            <Button
              variant="outline"
              className="mt-8 shadow-sm"
              onClick={() => setIsCreateOpen(true)}
            >
              <Plus className="mr-2 h-4 w-4" />
              Create First Project
            </Button>
          </Card>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence mode="popLayout">
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {projects?.results?.map((project: any) => (
              <motion.div key={project.id} variants={listItemVariants} layout>
                <Card
                  className="h-full flex flex-col border-none shadow-sm hover:shadow-md transition-all duration-300 group cursor-pointer overflow-hidden"
                  onClick={() =>
                    navigate(`/app/dashboard?projectId=${project.id}`)
                  }
                >
                  <div className="h-2 bg-primary/10 group-hover:bg-primary transition-colors duration-300" />
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between">
                      <div className="p-3 bg-primary/5 dark:bg-primary/10 rounded-xl text-primary group-hover:scale-110 transition-transform duration-300">
                        <Folder className="h-6 w-6" />
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          asChild
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-full"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(
                                `/app/dashboard?projectId=${project.id}`
                              );
                            }}
                          >
                            <LayoutGrid className="mr-2 h-4 w-4" /> Open
                            Dashboard
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Settings className="mr-2 h-4 w-4" /> Settings
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <CardTitle className="mt-5 text-xl font-bold group-hover:text-primary transition-colors">
                      {project.name}
                    </CardTitle>
                    <CardDescription className="line-clamp-2 mt-2 min-h-[40px]">
                      {project.description || "No description provided."}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="mt-auto pt-4 border-t border-border/50 bg-muted/5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                          <Database className="h-3.5 w-3.5" />
                          {project.dataset_count || 0} Datasets
                        </div>
                        <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                          <Clock className="h-3.5 w-3.5" />
                          {format(
                            new Date(project.updated_at || project.created_at),
                            "MMM d"
                          )}
                        </div>
                      </div>
                      <div className="h-8 w-8 rounded-full bg-primary/5 flex items-center justify-center text-primary opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
                        <ArrowRight className="h-4 w-4" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  );
};
