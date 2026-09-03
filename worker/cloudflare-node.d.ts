// Ambient types for the Workers-only virtual module `cloudflare:node`, which
// exists at runtime in workerd but has no package on disk to resolve against.
declare module 'cloudflare:node' {
  export function httpServerHandler(options: { port: number }): ExportedHandler;
  type ExportedHandler = {
    fetch(request: Request, env: unknown, ctx: unknown): Promise<Response>;
  };
}
