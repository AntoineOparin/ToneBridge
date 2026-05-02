import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import * as THREE from 'three'
import { Link } from 'react-router-dom'
import { colors } from '../lib/theme'
import { supabase } from '../lib/supabaseClient'

const hex = (color: string) => parseInt(color.replace('#', ''), 16)

interface Player {
  rank: number
  username: string
  elo: number
  streak: number
}

const PODIUM_COLORS: Record<number, string> = {
  1: '#fbbf24',
  2: '#94a3b8',
  3: '#b45309',
}

const PODIUM_HEIGHTS: Record<number, string> = {
  1: 'h-28',
  2: 'h-20',
  3: 'h-14',
}

export default function Leaderboard() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [players, setPlayers] = useState<Player[]>([])
  const [loading, setLoading] = useState(true)
  const [myUserId, setMyUserId] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setMyUserId(data.user.id)
    })

    supabase
      .from('users')
      .select('id, email, elo, streak')
      .order('elo', { ascending: false })
      .limit(50)
      .then(({ data }) => {
        if (data) {
          setPlayers(
            data.map((u, i) => ({
              rank: i + 1,
              username: u.email?.split('@')[0] ?? 'Unknown',
              elo: u.elo ?? 1000,
              streak: u.streak ?? 0,
              id: u.id,
            })),
          )
        }
        setLoading(false)
      })
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
    camera.position.z = 5

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true })
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setClearColor(hex(colors.surface[900]), 1)

    const barGroup = new THREE.Group()
    const barMaterial = new THREE.MeshStandardMaterial({
      color: hex(colors.brand[700]),
      emissive: hex(colors.brand[700]),
      emissiveIntensity: 0.3,
      transparent: true,
      opacity: 0.15,
    })

    for (let i = 0; i < 30; i++) {
      const height = Math.random() * 3 + 0.5
      const geo = new THREE.BoxGeometry(0.15, height, 0.15)
      const bar = new THREE.Mesh(geo, barMaterial)
      bar.position.set((Math.random() - 0.5) * 20, -4 + height / 2, (Math.random() - 0.5) * 8 - 4)
      barGroup.add(bar)
    }
    scene.add(barGroup)

    const particleGeo = new THREE.BufferGeometry()
    const count = 150
    const pos = new Float32Array(count * 3)
    for (let i = 0; i < count * 3; i++) pos[i] = (Math.random() - 0.5) * 20
    particleGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    const particleMat = new THREE.PointsMaterial({
      size: 0.03,
      color: hex(colors.brand[500]),
      transparent: true,
      opacity: 0.5,
      blending: THREE.AdditiveBlending,
    })
    const particles = new THREE.Points(particleGeo, particleMat)
    scene.add(particles)

    scene.add(new THREE.AmbientLight(0xffffff, 1))
    const point = new THREE.PointLight(hex(colors.brand[500]), 3, 15)
    point.position.set(0, 3, 3)
    scene.add(point)

    let id: number
    const start = Date.now()
    const animate = () => {
      id = requestAnimationFrame(animate)
      const t = (Date.now() - start) * 0.001
      particles.rotation.y = t * 0.03
      barGroup.children.forEach((bar, i) => {
        bar.position.y += Math.sin(t + i * 0.4) * 0.001
      })
      renderer.render(scene, camera)
    }
    animate()

    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight
      camera.updateProjectionMatrix()
      renderer.setSize(window.innerWidth, window.innerHeight)
    }
    window.addEventListener('resize', onResize)

    return () => {
      cancelAnimationFrame(id)
      window.removeEventListener('resize', onResize)
      renderer.dispose()
      particleGeo.dispose()
      particleMat.dispose()
    }
  }, [])

  const top3 = players.slice(0, 3)
  const rest = players.slice(3)
  const podiumOrder = top3.length === 3 ? [top3[1], top3[0], top3[2]] : top3

  return (
    <div className="relative min-h-screen overflow-hidden bg-surface-900">
      <canvas ref={canvasRef} className="absolute inset-0 z-0" style={{ width: '100%', height: '100%' }} />

      <div className="relative z-10 min-h-screen flex flex-col">
        <motion.nav
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="flex items-center justify-between px-8 py-6"
        >
          <Link to="/" className="text-2xl font-bold text-brand-400 tracking-tight">ToneBridge</Link>
          <Link to="/home" className="text-surface-300 hover:text-brand-400 transition-colors text-sm">← Back</Link>
        </motion.nav>

        <div className="flex-1 px-4 md:px-8 pb-12 max-w-3xl mx-auto w-full">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight">
              Global <span className="text-brand-400">Leaderboard</span>
            </h1>
            <p className="text-surface-400 mt-2">Top players ranked by ELO</p>
          </motion.div>

          {loading ? (
            <div className="flex justify-center py-20">
              <motion.div
                className="h-10 w-10 rounded-full border-2 border-brand-500 border-t-transparent"
                animate={{ rotate: 360 }}
                transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
              />
            </div>
          ) : (
            <>
              {/* Podium — only show if we have at least 3 players */}
              {top3.length === 3 && (
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.7, delay: 0.2 }}
                  className="flex items-end justify-center gap-4 mb-12"
                >
                  {podiumOrder.map((player) => (
                    <div key={player.rank} className="flex flex-col items-center gap-2">
                      <div className="text-2xl">
                        {player.rank === 1 ? '👑' : player.rank === 2 ? '🥈' : '🥉'}
                      </div>
                      <span className="text-white font-bold text-sm max-w-[80px] truncate">{player.username}</span>
                      <span className="font-black text-lg" style={{ color: PODIUM_COLORS[player.rank] }}>
                        {player.elo}
                      </span>
                      <div
                        className={`w-20 ${PODIUM_HEIGHTS[player.rank]} rounded-t-lg flex items-center justify-center`}
                        style={{ background: `${PODIUM_COLORS[player.rank]}22`, border: `1px solid ${PODIUM_COLORS[player.rank]}44` }}
                      >
                        <span className="text-2xl font-black" style={{ color: PODIUM_COLORS[player.rank] }}>
                          {player.rank}
                        </span>
                      </div>
                    </div>
                  ))}
                </motion.div>
              )}

              {/* Rank list */}
              <motion.div
                initial="hidden"
                animate="visible"
                variants={{ visible: { transition: { staggerChildren: 0.06 } } }}
                className="flex flex-col gap-2"
              >
                {(top3.length < 3 ? players : rest).map((player) => {
                  const isMe = (player as Player & { id?: string }).id === myUserId
                  return (
                    <motion.div
                      key={player.rank}
                      variants={{
                        hidden: { opacity: 0, x: -20 },
                        visible: { opacity: 1, x: 0, transition: { duration: 0.4 } },
                      }}
                      whileHover={{ scale: 1.01, x: 4 }}
                      className={`flex items-center gap-4 px-5 py-4 rounded-xl border backdrop-blur-sm ${
                        isMe
                          ? 'bg-brand-500/10 border-brand-500/40'
                          : 'bg-surface-800/60 border-surface-700/50'
                      }`}
                    >
                      <span className="text-surface-400 font-bold w-6 text-right text-sm">#{player.rank}</span>
                      <div className="flex-1">
                        <span className={`font-semibold ${isMe ? 'text-brand-400' : 'text-white'}`}>
                          {player.username}{isMe ? ' (you)' : ''}
                        </span>
                        {player.streak > 0 && (
                          <span className="ml-2 text-xs text-brand-400">🔥 {player.streak}</span>
                        )}
                      </div>
                      <div className="text-right">
                        <span className="text-brand-400 font-black">{player.elo}</span>
                        <span className="text-surface-500 text-xs ml-1">ELO</span>
                      </div>
                    </motion.div>
                  )
                })}

                {players.length === 0 && (
                  <p className="text-center text-surface-500 py-12">No players yet. Be the first!</p>
                )}
              </motion.div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
