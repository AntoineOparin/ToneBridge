import { supabase } from '../lib/supabaseClient'

export default function Home() {
  async function handleSignOut() {
    await supabase.auth.signOut()
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <button
        onClick={handleSignOut}
        className="text-gray-400 hover:text-white text-sm transition"
      >
        Sign out
      </button>
    </div>
  )
}
