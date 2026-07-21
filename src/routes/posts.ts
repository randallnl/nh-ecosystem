import { Hono } from "hono";

type User = {
  id: string;
  email: string;
  name: string | null;
  site_role: "member" | "site_admin";
  status: "invited" | "active" | "suspended";
};

type PostsRouterDeps<Env> = {
  assertSameOrigin(request: Request): void;
  currentUser(request: Request, env: Env): Promise<User>;
  renderEventEditPage(env: Env, user: User, postId: string): Promise<string>;
  renderPostDetail(env: Env, user: User, postId: string): Promise<string>;
  handleApprovePost(request: Request, env: Env, user: User, postId: string): Promise<Response>;
  handleCreateComment(request: Request, env: Env, user: User, postId: string): Promise<Response>;
  handleCreatePost(request: Request, env: Env, user: User): Promise<Response>;
  handleRejectPost(request: Request, env: Env, user: User, postId: string): Promise<Response>;
  handleRemovePost(env: Env, user: User, postId: string): Promise<Response>;
  handleUpdatePost(request: Request, env: Env, user: User, postId: string): Promise<Response>;
  html(body: string, status?: number, headers?: HeadersInit): Response;
};

export function createPostsRouter<Env>(deps: PostsRouterDeps<Env>) {
  const posts = new Hono<{ Bindings: Env }>();

  posts.post("/", async (c) => {
    const request = c.req.raw;
    deps.assertSameOrigin(request);
    const user = await deps.currentUser(request, c.env);
    return deps.handleCreatePost(request, c.env, user);
  });

  posts.post("/:postId/approve", async (c) => {
    const request = c.req.raw;
    deps.assertSameOrigin(request);
    const user = await deps.currentUser(request, c.env);
    return deps.handleApprovePost(request, c.env, user, routeParam(c.req.param("postId")));
  });

  posts.post("/:postId/reject", async (c) => {
    const request = c.req.raw;
    deps.assertSameOrigin(request);
    const user = await deps.currentUser(request, c.env);
    return deps.handleRejectPost(request, c.env, user, routeParam(c.req.param("postId")));
  });

  posts.get("/:postId/edit", async (c) => {
    const user = await deps.currentUser(c.req.raw, c.env);
    return deps.html(await deps.renderEventEditPage(c.env, user, routeParam(c.req.param("postId"))));
  });

  posts.post("/:postId/edit", async (c) => {
    const request = c.req.raw;
    deps.assertSameOrigin(request);
    const user = await deps.currentUser(request, c.env);
    return deps.handleUpdatePost(request, c.env, user, routeParam(c.req.param("postId")));
  });

  posts.post("/:postId/delete", async (c) => {
    const request = c.req.raw;
    deps.assertSameOrigin(request);
    const user = await deps.currentUser(request, c.env);
    return deps.handleRemovePost(c.env, user, routeParam(c.req.param("postId")));
  });

  posts.post("/:postId/comments", async (c) => {
    const request = c.req.raw;
    deps.assertSameOrigin(request);
    const user = await deps.currentUser(request, c.env);
    return deps.handleCreateComment(request, c.env, user, routeParam(c.req.param("postId")));
  });

  posts.get("/:postId", async (c) => {
    const user = await deps.currentUser(c.req.raw, c.env);
    return deps.html(await deps.renderPostDetail(c.env, user, routeParam(c.req.param("postId"))));
  });

  return posts;
}

function routeParam(value: string) {
  return decodeURIComponent(value).split("/")[0];
}
