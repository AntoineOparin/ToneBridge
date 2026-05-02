import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import * as THREE from 'three'
import { Link } from 'react-router-dom'
import tailwindConfig from '../../tailwind.config.js'

const hex = (color: string) => parseInt(color.replace('#', ''), 16)
const colors = tailwindConfig.theme.extend.colors

export default function Landing() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const scene = new THREE.Scene()
    scene.fog = new THREE.FogExp2(hex(colors.surface[900]), 0.02)

    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    )
    camera.position.z = 5

    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
    })
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setClearColor(hex(colors.surface[900]), 1)

    // Floating particles
    const particlesGeometry = new THREE.BufferGeometry()
    const particlesCount = 200
    const posArray = new Float32Array(particlesCount * 3)

    for (let i = 0; i < particlesCount * 3; i++) {
      posArray[i] = (Math.random() - 0.5) * 15
    }

    particlesGeometry.setAttribute(
      'position',
      new THREE.BufferAttribute(posArray, 3)
    )

    const particlesMaterial = new THREE.PointsMaterial({
      size: 0.02,
      color: hex(colors.brand[500]),
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
    })

    const particlesMesh = new THREE.Points(particlesGeometry, particlesMaterial)
    scene.add(particlesMesh)

    // Floating note shapes
    const notes: THREE.Mesh[] = []
    const noteGeometry = new THREE.IcosahedronGeometry(0.15, 0)
    const noteMaterial = new THREE.MeshStandardMaterial({
      color: hex(colors.brand[400]),
      emissive: hex(colors.brand[700]),
      emissiveIntensity: 0.4,
      roughness: 0.2,
      metalness: 0.8,
    })

    for (let i = 0; i < 8; i++) {
      const note = new THREE.Mesh(noteGeometry, noteMaterial)
      note.position.set(
        (Math.random() - 0.5) * 10,
        (Math.random() - 0.5) * 6,
        (Math.random() - 0.5) * 4
      )
      note.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0)
      notes.push(note)
      scene.add(note)
    }

    // Bridge cables
    const cableMaterial = new THREE.LineBasicMaterial({
      color: hex(colors.surface[500]),
      transparent: true,
      opacity: 0.3,
    })

    const createCable = (yOffset: number, amplitude: number) => {
      const points: THREE.Vector3[] = []
      for (let i = -10; i <= 10; i += 0.5) {
        points.push(
          new THREE.Vector3(
            i,
            yOffset + Math.sin(i * 0.3) * amplitude,
            -2
          )
        )
      }
      const geometry = new THREE.BufferGeometry().setFromPoints(points)
      return new THREE.Line(geometry, cableMaterial)
    }

    const cable1 = createCable(2, 1.5)
    const cable2 = createCable(-2, 1.5)
    scene.add(cable1, cable2)

    // Lighting
    const ambientLight = new THREE.AmbientLight(hex(colors.surface[600]), 2)
    scene.add(ambientLight)

    const pointLight = new THREE.PointLight(hex(colors.brand[500]), 2, 20)
    pointLight.position.set(5, 5, 5)
    scene.add(pointLight)

    const pointLight2 = new THREE.PointLight(hex(colors.accent[400]), 1.5, 20)
    pointLight2.position.set(-5, -3, 3)
    scene.add(pointLight2)

    // Animation loop
    let animationId: number
    const startTime = Date.now()

    const animate = () => {
      animationId = requestAnimationFrame(animate)
      const elapsed = (Date.now() - startTime) * 0.001

      particlesMesh.rotation.y += 0.0005
      particlesMesh.rotation.x += 0.0002

      notes.forEach((note, i) => {
        note.rotation.x += 0.005 + i * 0.001
        note.rotation.y += 0.003 + i * 0.001
        note.position.y += Math.sin(elapsed + i * 1.5) * 0.002
      })

      renderer.render(scene, camera)
    }

    animate()

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight
      camera.updateProjectionMatrix()
      renderer.setSize(window.innerWidth, window.innerHeight)
    }

    window.addEventListener('resize', handleResize)

    return () => {
      cancelAnimationFrame(animationId)
      window.removeEventListener('resize', handleResize)
      renderer.dispose()
      particlesGeometry.dispose()
      particlesMaterial.dispose()
      noteGeometry.dispose()
      noteMaterial.dispose()
      cable1.geometry.dispose()
      ;(cable2 as THREE.Line).geometry.dispose()
      cableMaterial.dispose()
    }
  }, [])

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.3,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] as const },
    },
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-surface-900">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 z-0"
        style={{ width: '100%', height: '100%' }}
      />

      <div className="relative z-10 flex flex-col min-h-screen pointer-events-none">
        {/* Navigation */}
        <motion.nav
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="flex items-center justify-between px-8 py-6 pointer-events-auto"
        >
          <Link to="/" className="text-2xl font-bold text-brand-400 tracking-tight">
            ToneBridge
          </Link>
          <div className="flex items-center gap-6">
            <Link to="/learn" className="text-surface-300 hover:text-brand-400 transition-colors">
              Learn
            </Link>
            <Link to="/practice" className="text-surface-300 hover:text-brand-400 transition-colors">
              Practice
            </Link>
            <Link to="/multiplayer" className="text-surface-300 hover:text-brand-400 transition-colors">
              Multiplayer
            </Link>
            <Link
              to="/login"
              className="px-4 py-2 rounded-lg bg-brand-500 text-white font-semibold hover:bg-brand-400 transition-colors"
            >
              Sign In
            </Link>
          </div>
        </motion.nav>

        {/* Hero */}
        <div className="flex-1 flex items-center justify-center px-8">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="text-center max-w-4xl pointer-events-auto"
          >

            <motion.h1
              variants={itemVariants}
              className="text-6xl md:text-8xl font-black text-white mb-6 tracking-tight leading-tight"
            >
              Bridge the gap to{' '}
              <span className="text-brand-400">
                Perfect Pitch
              </span>
            </motion.h1>

            <motion.p
              variants={itemVariants}
              className="text-xl md:text-2xl text-surface-400 mb-10 max-w-2xl mx-auto leading-relaxed"
            >
              Train your ears with real-time pitch detection, earn XP, and duel
              players worldwide in the ultimate perfect pitch battleground.
            </motion.p>

            <motion.div
              variants={itemVariants}
              className="flex flex-wrap justify-center gap-4"
            >
              <Link to="/practice">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-8 py-4 rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 text-white font-bold text-lg shadow-lg shadow-brand-500/25 hover:shadow-brand-500/40 transition-shadow"
                >
                  Start Training
                </motion.button>
              </Link>
              <Link to="/multiplayer">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-8 py-4 rounded-xl bg-surface-800 text-white font-bold text-lg border border-surface-700 hover:border-surface-600 hover:bg-surface-700 transition-colors"
                >
                  1v1 Duel
                </motion.button>
              </Link>
            </motion.div>
          </motion.div>
        </div>

        {/* Footer */}
        <motion.footer
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="py-6 text-center text-surface-400 text-sm pointer-events-auto"
        >
          ToneBridge 2026
        </motion.footer>
      </div>
    </div>
  )
}
