import { v } from "convex/values";
import { mutation, query, internalQuery } from "./_generated/server";

// ===========================================
// QUERIES
// ===========================================

export const list = query({
  args: {
    workspaceId: v.id("workspaces"),
  },
  handler: async (ctx, args) => {
    const projects = await ctx.db
      .query("projects")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    // Enrich with repository links
    const enriched = await Promise.all(
      projects.map(async (project) => {
        const repoLinks = await ctx.db
          .query("projectRepositories")
          .withIndex("by_project", (q) => q.eq("projectId", project._id))
          .collect();

        const repos = await Promise.all(
          repoLinks.map(async (link) => {
            const repo = await ctx.db.get(link.repositoryId);
            return repo
              ? { id: repo._id, name: repo.name, fullName: repo.fullName, isDefault: link.isDefault }
              : null;
          })
        );

        return {
          ...project,
          repositories: repos.filter(Boolean),
        };
      })
    );

    return enriched;
  },
});

export const getById = query({
  args: { id: v.id("projects") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const getByShortCode = query({
  args: {
    workspaceId: v.id("workspaces"),
    shortCode: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("projects")
      .withIndex("by_workspace_and_code", (q) =>
        q.eq("workspaceId", args.workspaceId).eq("shortCode", args.shortCode.toUpperCase())
      )
      .first();
  },
});

// Internal query for bot context - returns all projects with keywords and repos
export const getWorkspaceContext = internalQuery({
  args: { workspaceId: v.id("workspaces") },
  handler: async (ctx, args) => {
    const projects = await ctx.db
      .query("projects")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    return Promise.all(
      projects.map(async (project) => {
        const repoLinks = await ctx.db
          .query("projectRepositories")
          .withIndex("by_project", (q) => q.eq("projectId", project._id))
          .collect();

        const repos = await Promise.all(
          repoLinks.map(async (link) => {
            const repo = await ctx.db.get(link.repositoryId);
            return repo?.fullName;
          })
        );

        return {
          id: project._id,
          name: project.name,
          shortCode: project.shortCode,
          keywords: project.keywords ?? [],
          domain: project.domain,
          repos: repos.filter(Boolean) as string[],
        };
      })
    );
  },
});

// Find project by keyword match in message text
export const findByKeyword = internalQuery({
  args: {
    workspaceId: v.id("workspaces"),
    text: v.string(),
  },
  handler: async (ctx, args) => {
    const projects = await ctx.db
      .query("projects")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    const textLower = args.text.toLowerCase();
    const matches: { project: typeof projects[0]; matchedKeywords: string[] }[] = [];

    for (const project of projects) {
      const keywords = project.keywords ?? [];
      const matchedKeywords = keywords.filter((kw) => textLower.includes(kw.toLowerCase()));

      if (matchedKeywords.length > 0) {
        matches.push({ project, matchedKeywords });
      }
    }

    // Sort by number of matched keywords (most matches first)
    matches.sort((a, b) => b.matchedKeywords.length - a.matchedKeywords.length);

    return matches;
  },
});

// ===========================================
// MUTATIONS
// ===========================================

export const create = mutation({
  args: {
    workspaceId: v.id("workspaces"),
    name: v.string(),
    shortCode: v.string(),
    description: v.optional(v.string()),
    domain: v.optional(v.string()),
    keywords: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const shortCode = args.shortCode.toUpperCase();

    // Check for duplicate short code
    const existing = await ctx.db
      .query("projects")
      .withIndex("by_workspace_and_code", (q) =>
        q.eq("workspaceId", args.workspaceId).eq("shortCode", shortCode)
      )
      .first();

    if (existing) {
      throw new Error(`Project with code "${shortCode}" already exists`);
    }

    const now = Date.now();

    return await ctx.db.insert("projects", {
      workspaceId: args.workspaceId,
      name: args.name,
      shortCode,
      description: args.description,
      domain: args.domain,
      keywords: args.keywords,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("projects"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    domain: v.optional(v.string()),
    keywords: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.id);
    if (!project) throw new Error("Project not found");

    await ctx.db.patch(args.id, {
      ...(args.name !== undefined ? { name: args.name } : {}),
      ...(args.description !== undefined ? { description: args.description } : {}),
      ...(args.domain !== undefined ? { domain: args.domain } : {}),
      ...(args.keywords !== undefined ? { keywords: args.keywords } : {}),
      updatedAt: Date.now(),
    });
  },
});

export const remove = mutation({
  args: { id: v.id("projects") },
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.id);
    if (!project) throw new Error("Project not found");

    // Soft delete
    await ctx.db.patch(args.id, {
      isActive: false,
      updatedAt: Date.now(),
    });
  },
});

// ===========================================
// PROJECT-REPOSITORY LINKS
// ===========================================

export const linkRepository = mutation({
  args: {
    projectId: v.id("projects"),
    repositoryId: v.id("repositories"),
    isDefault: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    // Check if link already exists
    const existing = await ctx.db
      .query("projectRepositories")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .filter((q) => q.eq(q.field("repositoryId"), args.repositoryId))
      .first();

    if (existing) {
      // Update isDefault if provided
      if (args.isDefault !== undefined) {
        await ctx.db.patch(existing._id, { isDefault: args.isDefault });
      }
      return existing._id;
    }

    // If this is the default, unset other defaults
    if (args.isDefault) {
      const currentLinks = await ctx.db
        .query("projectRepositories")
        .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
        .collect();

      for (const link of currentLinks) {
        if (link.isDefault) {
          await ctx.db.patch(link._id, { isDefault: false });
        }
      }
    }

    return await ctx.db.insert("projectRepositories", {
      projectId: args.projectId,
      repositoryId: args.repositoryId,
      isDefault: args.isDefault ?? false,
      createdAt: Date.now(),
    });
  },
});

export const unlinkRepository = mutation({
  args: {
    projectId: v.id("projects"),
    repositoryId: v.id("repositories"),
  },
  handler: async (ctx, args) => {
    const link = await ctx.db
      .query("projectRepositories")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .filter((q) => q.eq(q.field("repositoryId"), args.repositoryId))
      .first();

    if (link) {
      await ctx.db.delete(link._id);
    }
  },
});
