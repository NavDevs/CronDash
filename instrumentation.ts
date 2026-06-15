export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Initialize the background cron scheduler when the server starts
    await import('./lib/scheduler');
  }
}
