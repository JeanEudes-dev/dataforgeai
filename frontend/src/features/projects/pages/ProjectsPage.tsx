import React from "react";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../../../api/client";
import { Button } from "../../../components/ui/button";
import { Plus, Folder, MoreVertical } from "lucide-react";
import { motion } from "framer-motion";
import { containerVariants, listItemVariants } from "../../../theme/motion";

export const ProjectsPage: React.FC = () => {
  const { data: projects, isLoading } = useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const response = await apiClient.get("/core/projects/");
      return response.data;
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Projects</h1>
          <p className="text-muted-foreground">
            Manage your data analytics projects
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          New Project
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-48 bg-card animate-pulse rounded-xl border border-border"
            />
          ))}
        </div>
      ) : (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {projects?.results?.map(
            (project: {
              id: string;
              name: string;
              description: string;
              created_at: string;
              updated_at?: string;
              dataset_count?: number;
            }) => (
              <motion.div
                key={project.id}
                variants={listItemVariants}
                className="group bg-card p-6 rounded-xl border border-border hover:border-primary/50 transition-all hover:shadow-md cursor-pointer"
              >
                <div className="flex items-start justify-between">
                  <div className="p-2 bg-primary/10 rounded-lg text-primary">
                    <Folder className="h-6 w-6" />
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </div>
                <div className="mt-4">
                  <h3 className="font-semibold text-lg">{project.name}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                    {project.description || "No description provided."}
                  </p>
                </div>
                <div className="mt-6 flex items-center justify-between text-xs text-muted-foreground">
                  <span>
                    Updated{" "}
                    {new Date(
                      project.updated_at || project.created_at
                    ).toLocaleDateString()}
                  </span>
                  <span className="px-2 py-1 bg-neutral-100 rounded-full">
                    {project.dataset_count || 0} Datasets
                  </span>
                </div>
              </motion.div>
            )
          )}
        </motion.div>
      )}

      {!isLoading && projects?.results?.length === 0 && (
        <div className="text-center py-20 bg-card rounded-xl border border-dashed border-border">
          <Folder className="mx-auto h-12 w-12 text-muted-foreground/50" />
          <h3 className="mt-4 text-lg font-medium">No projects yet</h3>
          <p className="text-muted-foreground">
            Create your first project to get started.
          </p>
          <Button variant="outline" className="mt-6">
            <Plus className="mr-2 h-4 w-4" />
            Create Project
          </Button>
        </div>
      )}
    </div>
  );
};
