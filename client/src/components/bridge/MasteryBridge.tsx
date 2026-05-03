import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import * as THREE from 'three'
import { colors } from '../../lib/theme'
import { prettyNote } from '../../lib/noteUtils'
import type { NoteName } from '../../types'

const hex = (color: string) => parseInt(color.replace('#', ''), 16)

interface MasteryBridgeProps {
  /** The level the user just cleared. */
  fromLevel: number
  fromTitle: string
  /** The level they are advancing to (null if they finished the curriculum). */
  toLevel: number | null
  toTitle: string | null
  /** Notes added by the next level — shown as glyphs floating in. */
  newNotes: NoteName[]
  /** Called once the full sequence finishes. */
  onComplete: () => void
}

/**
 * Level-up celebration. Side-on Three.js scene with two stone pillars (the
 * level you just cleared on the left, the next level on the right). A low-poly
 * Forte walks across with a believable step cycle and lights up the next pillar.
 * Glowing glyphs of the newly unlocked notes float up around it.
 */
export default function MasteryBridge({
  fromLevel,
  fromTitle,
  toLevel,
  toTitle,
  newNotes,
  onComplete,
}: MasteryBridgeProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const completedRef = useRef(false)
  const [replayCount, setReplayCount] = useState(0)

  useEffect(() => {
    completedRef.current = false
    const container = containerRef.current
    if (!container) return

    const width = container.clientWidth
    const height = container.clientHeight

    const scene = new THREE.Scene()
    scene.fog = new THREE.FogExp2(hex(colors.surface[900]), 0.04)

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100)
    camera.position.set(0, 1.6, 11.5)
    camera.lookAt(0, 0.3, 0)

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setSize(width, height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setClearColor(hex(colors.surface[900]), 0)
    container.appendChild(renderer.domElement)

    // --- Lighting -------------------------------------------------------
    scene.add(new THREE.AmbientLight(hex(colors.surface[600]), 1.4))
    const keyLight = new THREE.DirectionalLight(0xffffff, 1.2)
    keyLight.position.set(4, 6, 4)
    scene.add(keyLight)
    const leftPillarLight = new THREE.PointLight(hex(colors.brand[500]), 4, 8, 1.6)
    leftPillarLight.position.set(-4, 1.6, 0.8)
    scene.add(leftPillarLight)
    const rightPillarLight = new THREE.PointLight(hex(colors.surface[500]), 0.6, 8, 1.6)
    rightPillarLight.position.set(4, 1.6, 0.8)
    scene.add(rightPillarLight)

    // --- Water / mist plane --------------------------------------------
    const water = new THREE.Mesh(
      new THREE.PlaneGeometry(40, 20),
      new THREE.MeshStandardMaterial({
        color: hex(colors.surface[900]),
        roughness: 0.4,
        metalness: 0.6,
        transparent: true,
        opacity: 0.7,
      }),
    )
    water.rotation.x = -Math.PI / 2
    water.position.y = -2.5
    scene.add(water)

    // --- Pillars --------------------------------------------------------
    const stoneMat = new THREE.MeshStandardMaterial({
      color: hex(colors.surface[700]),
      roughness: 0.85,
      metalness: 0.1,
    })
    const buildPillar = (x: number) => {
      const group = new THREE.Group()
      const base = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.6, 1.6), stoneMat)
      base.position.y = -2.2
      const shaft = new THREE.Mesh(new THREE.BoxGeometry(1.1, 3.2, 1.1), stoneMat)
      shaft.position.y = -0.3
      const cap = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.25, 1.4), stoneMat)
      cap.position.y = 1.45
      group.add(base, shaft, cap)
      group.position.x = x
      return group
    }
    const leftPillar = buildPillar(-4)
    const rightPillar = buildPillar(4)
    scene.add(leftPillar, rightPillar)

    // --- Pillar glyphs (level numerals) --------------------------------
    const makeLabel = (text: string, color: string, fontSize = 160) => {
      const canvas = document.createElement('canvas')
      canvas.width = 256
      canvas.height = 256
      const ctx = canvas.getContext('2d')!
      ctx.font = `bold ${fontSize}px Inter, system-ui, sans-serif`
      ctx.fillStyle = color
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(text, 128, 138)
      const texture = new THREE.CanvasTexture(canvas)
      texture.colorSpace = THREE.SRGBColorSpace
      const sprite = new THREE.Sprite(
        new THREE.SpriteMaterial({ map: texture, transparent: true }),
      )
      sprite.scale.set(1.6, 1.6, 1)
      return sprite
    }

    const leftLevelLabel = makeLabel(`L${fromLevel}`, '#fbbf24', 110)
    leftLevelLabel.position.set(-4, 2.4, 0)
    scene.add(leftLevelLabel)

    const rightLevelLabel = toLevel
      ? makeLabel(`L${toLevel}`, '#94a3b8', 110)
      : null
    if (rightLevelLabel) {
      rightLevelLabel.position.set(4, 2.4, 0)
      scene.add(rightLevelLabel)
    }

    // --- Cables (parallel suspension) ----------------------------------
    const cableMat = new THREE.LineBasicMaterial({
      color: hex(colors.surface[500]),
      transparent: true,
      opacity: 0.55,
    })
    const cablePoints = (yOffset: number) => {
      const pts: THREE.Vector3[] = []
      for (let t = 0; t <= 1; t += 0.04) {
        const x = -4 + t * 8
        const sag = Math.sin(t * Math.PI) * 0.6
        pts.push(new THREE.Vector3(x, 1.6 + yOffset - sag, 0.4))
      }
      return pts
    }
    const cable1 = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(cablePoints(0.4)),
      cableMat,
    )
    const cable2 = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(cablePoints(0.0)),
      cableMat,
    )
    scene.add(cable1, cable2)

    // --- Parabolic bridge deck ------------------------------------------
    const deckMat = new THREE.MeshStandardMaterial({
      color: hex(colors.surface[600]),
      roughness: 0.9,
      metalness: 0.05,
    })
    const railMat = new THREE.MeshStandardMaterial({
      color: hex(colors.surface[500]),
      roughness: 0.7,
      metalness: 0.3,
    })

    const PILLAR_TOP = 1.45
    const SAG = 0.55
    const deckY = (x: number) => PILLAR_TOP - Math.sin(((x + 4) / 8) * Math.PI) * SAG
    const deckSlope = (x: number) => {
      const dt = 0.001
      return (deckY(x + dt) - deckY(x - dt)) / (2 * dt)
    }

    const SEGMENTS = 20
    const segWidth = 7.0 / SEGMENTS
    const deckSegments: THREE.Mesh[] = []
    for (let i = 0; i < SEGMENTS; i++) {
      const x = -3.5 + (i + 0.5) * segWidth
      const y = deckY(x)
      const slope = deckSlope(x)
      const seg = new THREE.Mesh(new THREE.BoxGeometry(segWidth + 0.02, 0.08, 1.2), deckMat)
      seg.position.set(x, y, 0.2)
      seg.rotation.z = Math.atan(slope)
      scene.add(seg)
      deckSegments.push(seg)

      const railH = 0.06
      const railYOffset = 0.06 + railH / 2
      const railLX = new THREE.Mesh(new THREE.BoxGeometry(segWidth + 0.02, railH, 0.04), railMat)
      railLX.position.set(
        x - Math.sin(Math.atan(slope)) * railYOffset,
        y + Math.cos(Math.atan(slope)) * railYOffset,
        0.74,
      )
      railLX.rotation.z = Math.atan(slope)
      scene.add(railLX)

      const railRX = new THREE.Mesh(new THREE.BoxGeometry(segWidth + 0.02, railH, 0.04), railMat)
      railRX.position.set(
        x - Math.sin(Math.atan(slope)) * railYOffset,
        y + Math.cos(Math.atan(slope)) * railYOffset,
        -0.34,
      )
      railRX.rotation.z = Math.atan(slope)
      scene.add(railRX)
    }

    // --- Forte (low-poly with leg meshes for a real step cycle) --------
    const forte = new THREE.Group()
    const forkMat = new THREE.MeshStandardMaterial({
      color: hex(colors.brand[400]),
      emissive: hex(colors.brand[700]),
      emissiveIntensity: 0.4,
      roughness: 0.3,
      metalness: 0.7,
    })
    const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.22, 0.5, 6, 16), forkMat)
    body.position.y = 0.55
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.26, 24, 24), forkMat)
    head.position.y = 1.1
    const prongMat = new THREE.MeshStandardMaterial({
      color: hex(colors.brand[300]),
      metalness: 0.9,
      roughness: 0.2,
    })
    const prongL = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.45), prongMat)
    prongL.position.set(-0.1, 1.45, 0)
    const prongR = prongL.clone()
    prongR.position.x = 0.1
    const eyeMat = new THREE.MeshStandardMaterial({ color: 0x0f172a })
    const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.04, 16, 16), eyeMat)
    eyeL.position.set(-0.08, 1.13, 0.22)
    const eyeR = eyeL.clone()
    eyeR.position.x = 0.08
    const bowtie = new THREE.Mesh(
      new THREE.BoxGeometry(0.22, 0.1, 0.05),
      new THREE.MeshStandardMaterial({ color: hex(colors.accent[400]) }),
    )
    bowtie.position.y = 0.85
    bowtie.position.z = 0.24

    // Legs anchored at hips (y=0.3) so they swing forward/back like a pendulum.
    const legMat = new THREE.MeshStandardMaterial({
      color: hex(colors.brand[700]),
      roughness: 0.6,
    })
    const legGeo = new THREE.BoxGeometry(0.1, 0.32, 0.1)
    const legL = new THREE.Group()
    const legLMesh = new THREE.Mesh(legGeo, legMat)
    legLMesh.position.y = -0.16
    legL.add(legLMesh)
    legL.position.set(-0.09, 0.3, 0)
    const legR = legL.clone()
    legR.position.x = 0.09

    forte.add(body, head, prongL, prongR, eyeL, eyeR, bowtie, legL, legR)
    forte.position.set(-4, deckY(-4) + 0.02, 0)
    forte.scale.setScalar(0.85)
    scene.add(forte)

    // --- Sparkles for the ignite moment --------------------------------
    const sparkleGeo = new THREE.BufferGeometry()
    const sparkleCount = 120
    const sparklePos = new Float32Array(sparkleCount * 3)
    const sparkleVel: { x: number; y: number; z: number }[] = []
    for (let i = 0; i < sparkleCount; i++) {
      sparklePos[i * 3 + 0] = 4
      sparklePos[i * 3 + 1] = 2.4
      sparklePos[i * 3 + 2] = 0
      sparkleVel.push({
        x: (Math.random() - 0.5) * 5,
        y: 2 + Math.random() * 4,
        z: (Math.random() - 0.5) * 2.5,
      })
    }
    sparkleGeo.setAttribute('position', new THREE.BufferAttribute(sparklePos, 3))
    const sparkleMat = new THREE.PointsMaterial({
      color: hex(colors.brand[300]),
      size: 0.08,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
    })
    const sparkles = new THREE.Points(sparkleGeo, sparkleMat)
    scene.add(sparkles)

    // --- Note glyphs that fly up around the right pillar ---------------
    const noteSprites: { sprite: THREE.Sprite; offsetX: number; phase: number }[] = []
    newNotes.slice(0, 5).forEach((note, i) => {
      const sprite = makeLabel(prettyNote(note).replace(/\d+$/, ''), '#fbbf24', 120)
      sprite.scale.set(0.9, 0.9, 1)
      sprite.position.set(4, -2, 0.4)
      sprite.material.opacity = 0
      scene.add(sprite)
      noteSprites.push({
        sprite,
        offsetX: (i - newNotes.length / 2) * 0.7,
        phase: i * 0.18,
      })
    })

    // --- Timeline -------------------------------------------------------
    const walkStartMs = 800
    const walkDurationMs = 2000
    const igniteAtMs = walkStartMs + walkDurationMs
    const finishAtMs = igniteAtMs + 1800

    const t0 = performance.now()
    let raf = 0

    const animate = () => {
      const now = performance.now()
      const elapsed = now - t0

      // -- Forte standing / walking / arrived --------------------------
      const stridePeriod = 0.45
      if (elapsed < walkStartMs) {
        const x0 = forte.position.x
        const y0 = deckY(x0)
        forte.position.y = y0 + 0.02 + Math.sin(elapsed * 0.005) * 0.04
        legL.rotation.x = 0
        legR.rotation.x = 0
      } else if (elapsed < igniteAtMs) {
        const t = (elapsed - walkStartMs) / walkDurationMs
        // ease-in-out cubic for smooth start/stop
        const eased = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
        const x = -4 + 8 * eased
        forte.position.x = x

        // Follow the parabolic deck height.
        const deckHeight = deckY(x)

        // Step bounce — quick vertical hop on each stride.
        const strideT = ((elapsed - walkStartMs) / 1000) % stridePeriod
        const stride = strideT / stridePeriod
        const stepLift = Math.abs(Math.sin(stride * Math.PI)) * 0.12
        forte.position.y = deckHeight + 0.02 + stepLift

        // Slight forward lean into the slope.
        const slope = deckSlope(x)
        forte.rotation.z = slope * 0.3 + Math.sin(elapsed * 0.013) * 0.02

        // Leg swing — opposing pendulum.
        const swing = Math.sin(stride * Math.PI * 2) * 0.55
        legL.rotation.x = swing
        legR.rotation.x = -swing
      } else {
        forte.position.x = 4
        const yEnd = deckY(4)
        forte.position.y = yEnd + 0.02 + Math.sin(elapsed * 0.005) * 0.04
        forte.rotation.z = 0
        legL.rotation.x = 0
        legR.rotation.x = 0
      }

      // -- Cap lighting ramps with progress ----------------------------
      leftPillarLight.intensity = 4 + Math.sin(elapsed * 0.004) * 0.3
      const fromCol = (leftLevelLabel.material as THREE.SpriteMaterial).color
      fromCol.set(hex(colors.brand[400]))

      // -- Ignite the right pillar -------------------------------------
      if (elapsed >= igniteAtMs) {
        const k = Math.min(1, (elapsed - igniteAtMs) / 700)
        rightPillarLight.intensity = 0.6 + k * 4
        if (rightLevelLabel) {
          ;(rightLevelLabel.material as THREE.SpriteMaterial).color.set(
            hex(colors.brand[400]),
          )
        }

        // Sparkles
        sparkleMat.opacity = Math.max(0, 1 - (elapsed - igniteAtMs) / 1500)
        const positions = sparkleGeo.attributes.position as THREE.BufferAttribute
        const dts = (elapsed - igniteAtMs) / 1000
        for (let i = 0; i < sparkleCount; i++) {
          positions.setXYZ(
            i,
            4 + sparkleVel[i].x * dts,
            2.4 + sparkleVel[i].y * dts - 1.5 * dts * dts,
            sparkleVel[i].z * dts,
          )
        }
        positions.needsUpdate = true

        // Float new note glyphs up around the pillar.
        noteSprites.forEach((n) => {
          const ns = (elapsed - igniteAtMs) / 1000 - n.phase
          if (ns < 0) return
          const opacity = Math.max(0, Math.min(1, ns * 1.4) * (1 - ns / 1.6))
          ;(n.sprite.material as THREE.SpriteMaterial).opacity = opacity
          n.sprite.position.set(4 + n.offsetX, 2.4 + ns * 1.4, 0.4)
        })
      } else {
        // Gentle idle glow on right pillar before ignite.
        const preIgnite = Math.min(1, elapsed / walkStartMs)
        rightPillarLight.intensity = 0.6 + preIgnite * 0.4
      }

      leftLevelLabel.position.y = 2.4 + Math.sin(elapsed * 0.002) * 0.06
      if (rightLevelLabel) {
        rightLevelLabel.position.y = 2.4 + Math.sin(elapsed * 0.002 + 1.2) * 0.06
      }

      renderer.render(scene, camera)

      if (elapsed >= finishAtMs && !completedRef.current) {
        completedRef.current = true
        onComplete()
      }
      raf = requestAnimationFrame(animate)
    }
    raf = requestAnimationFrame(animate)

    const handleResize = () => {
      const w = container.clientWidth
      const h = container.clientHeight
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      renderer.setSize(w, h)
    }
    window.addEventListener('resize', handleResize)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', handleResize)
      renderer.dispose()
      scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          obj.geometry.dispose()
          if (Array.isArray(obj.material)) obj.material.forEach((m) => m.dispose())
          else obj.material.dispose()
        }
      })
      if (renderer.domElement.parentElement === container) {
        container.removeChild(renderer.domElement)
      }
    }
  }, [fromLevel, toLevel, newNotes, onComplete, replayCount])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-surface-950/90 backdrop-blur-sm"
    >
      {/* Dev replay control */}
      <button
        onClick={() => setReplayCount((c) => c + 1)}
        className="absolute top-4 right-4 z-20 rounded-lg border border-surface-700 bg-surface-800/80 px-3 py-1.5 text-xs font-semibold text-surface-300 backdrop-blur transition-colors hover:border-brand-500 hover:text-brand-400"
      >
        Replay animation
      </button>

      <AnimatePresence>
        <motion.div
          key="banner"
          initial={{ opacity: 0, y: -30, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          className="absolute top-10 z-10 text-center"
        >
          <div className="inline-block rounded-2xl border border-surface-800 bg-surface-900/60 px-8 py-4 backdrop-blur">
            <span className="block text-sm uppercase tracking-[0.4em] text-brand-400">
              Level {fromLevel} cleared
            </span>
            <span className="mt-2 block text-5xl font-black tracking-tight text-white">
              {fromTitle}
            </span>
          </div>
        </motion.div>

        {toLevel && toTitle && (
          <motion.div
            key="next"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1.6 }}
            className="absolute bottom-12 z-10 text-center"
          >
            <div className="inline-block rounded-2xl border border-surface-800 bg-surface-900/60 px-8 py-4 backdrop-blur">
              <span className="block text-xs uppercase tracking-[0.3em] text-surface-400">
                Up next — Level {toLevel}
              </span>
              <span className="mt-1 block text-2xl font-bold text-brand-400">{toTitle}</span>
              {newNotes.length > 0 && (
                <span className="mt-1 block text-xs text-surface-400">
                  Adding {newNotes.map((n) => prettyNote(n)).join(', ')}
                </span>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div ref={containerRef} className="h-[60vh] w-full max-w-5xl" />
    </motion.div>
  )
}
