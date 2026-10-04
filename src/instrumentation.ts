// Runs once when the server starts: a missing secret stops the server with a clear
// message instead of failing later inside a request. `next build` doesn't run this.
export async function register() {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return
  const { publicEnv, serverEnv } = await import('./lib/env')
  publicEnv()
  serverEnv()
}
