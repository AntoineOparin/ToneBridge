import { useEffect, useRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import * as THREE from 'three'
import { colors } from '../../lib/theme'
import { prettyNote } from '../../lib/noteUtils'
import type { NoteName } from '../../types'

const hex = (color: string) => parseInt(color.replace('#', ''), 16)

interface MasteryBridgeProps {
  /** The note that was just mastered. Shown glowing on the left pillar. */
  fromNote: NoteName
  /** The next note in the curriculum. Lights up when Forte arrives. */
  toNote: NoteName | null
  /** Called once the full sequence (build + walk + ignite) finishes. */
  onComplete: () => void
}

/**
 * The "Mastered!" celebration. A side-on Three.js scene with two stone
 * pillars labelled with the just-mastered note (left) and next note (right).
 * The bridge between them is broken: planks fall into place one at a time,
 * then Forte walks across and ignites the next pillar.
 */
export default function MasteryBridge({ fromNote, toNote, onComplete }: MasteryBridgeProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const completedRef = useRef(false)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const width = container.clientWidth
    const height = container.clientHeight

    const scene = new THREE.Scene()
    scene.fog = new THREE.FogExp2(hex(colors.surface[900]), 0.04)

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100)
    camera.position.set(0, 1.6, 11)
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

    // --- Ground / water -------------------------------------------------
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

    // --- Note glyphs (glowing spheres above each pillar) ---------------
    const buildGlyph = (color: number, intensity: number) => {
      const mesh = new THREE.Mesh(
        new THREE.SphereGeometry(0.45, 32, 32),
        new THREE.MeshStandardMaterial({
          color,
          emissive: color,
          emissiveIntensity: intensity,
          roughness: 0.2,
          metalness: 0.7,
        }),
      )
      return mesh
    }

    const leftGlyph = buildGlyph(hex(colors.brand[400]), 1.2)
    leftGlyph.position.set(-4, 2.4, 0)
    scene.add(leftGlyph)

    const rightGlyph = buildGlyph(hex(colors.surface[500]), 0.05)
    rightGlyph.position.set(4, 2.4, 0)
    scene.add(rightGlyph)

    // Label sprites — generated from a 2D canvas so we don't need a font loader.
    const makeLabel = (text: string, color: string) => {
      const canvas = document.createElement('canvas')
      canvas.width = 256
      canvas.height = 256
      const ctx = canvas.getContext('2d')!
      ctx.fillStyle = 'rgba(0,0,0,0)'
      ctx.fillRect(0, 0, 256, 256)
      ctx.font = 'bold 160px Inter, system-ui, sans-serif'
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

    const fromLabel = makeLabel(prettyNote(fromNote).replace(/\d+$/, ''), '#fbbf24')
    fromLabel.position.set(-4, 3.6, 0)
    scene.add(fromLabel)

    const toLabel = toNote ? makeLabel(prettyNote(toNote).replace(/\d+$/, ''), '#94a3b8') : null
    if (toLabel) {
      toLabel.position.set(4, 3.6, 0)
      scene.add(toLabel)
    }

    // --- Cables ---------------------------------------------------------
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

    // --- Planks (start hidden / fallen, then build up) -----------------
    const PLANK_COUNT = 9
    const plankMat = new THREE.MeshStandardMaterial({
      color: hex(colors.brand[700]),
      roughness: 0.7,
    })
    const plankGeo = new THREE.BoxGeometry(0.85, 0.12, 1.2)
    const planks: { mesh: THREE.Mesh; targetY: number; placedAt: number }[] = []
    const buildStartMs = 600 // delay before planks start placing
    const plankIntervalMs = 220
    for (let i = 0; i < PLANK_COUNT; i++) {
      const mesh = new THREE.Mesh(plankGeo, plankMat)
      const x = -3.4 + (i / (PLANK_COUNT - 1)) * 6.8
      mesh.position.set(x, -3, 0)
      mesh.rotation.z = (Math.random() - 0.5) * 0.4
      mesh.visible = false
      scene.add(mesh)
      planks.push({
        mesh,
        targetY: 0.15,
        placedAt: buildStartMs + i * plankIntervalMs,
      })
    }

    // --- Forte (low-poly tuning fork) ----------------------------------
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
    forte.add(body, head, prongL, prongR, eyeL, eyeR, bowtie)
    forte.position.set(-4, 1.6, 0)
    forte.scale.setScalar(0.85)
    scene.add(forte)

    // --- Sparkle particles for the "ignite next note" moment -----------
    const sparkleGeo = new THREE.BufferGeometry()
    const sparkleCount = 80
    const sparklePos = new Float32Array(sparkleCount * 3)
    const sparkleVel: { x: number; y: number; z: number }[] = []
    for (let i = 0; i < sparkleCount; i++) {
      sparklePos[i * 3 + 0] = 4
      sparklePos[i * 3 + 1] = 2.4
      sparklePos[i * 3 + 2] = 0
      sparkleVel.push({
        x: (Math.random() - 0.5) * 4,
        y: Math.random() * 4,
        z: (Math.random() - 0.5) * 2,
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

    // --- Animation timeline --------------------------------------------
    const t0 = performance.now()
    const walkStartMs = buildStartMs + PLANK_COUNT * plankIntervalMs + 250
    const walkDurationMs = 1800
    const igniteAtMs = walkStartMs + walkDurationMs
    const finishAtMs = igniteAtMs + 1400

    let raf = 0
    const animate = () => {
      const elapsed = performance.now() - t0

      // Plank placement.
      for (const p of planks) {
        if (elapsed >= p.placedAt) {
          if (!p.mesh.visible) {
            p.mesh.visible = true
            p.mesh.position.y = -2
          }
          const k = Math.min(1, (elapsed - p.placedAt) / 350)
          const eased = 1 - Math.pow(1 - k, 3)
          p.mesh.position.y = -2 + (p.targetY + 2) * eased
          p.mesh.rotation.z *= 1 - k * 0.15
        }
      }

      // Forte bobbing while standing on left.
      if (elapsed < walkStartMs) {
        forte.position.y = 1.6 + Math.sin(elapsed * 0.005) * 0.04
      } else if (elapsed < igniteAtMs) {
        const k = Math.min(1, (elapsed - walkStartMs) / walkDurationMs)
        const eased = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2
        forte.position.x = -4 + 8 * eased
        forte.position.y = 1.6 + Math.abs(Math.sin(elapsed * 0.02)) * 0.18
        forte.rotation.y = Math.sin(elapsed * 0.02) * 0.12
      } else {
        forte.position.x = 4
        forte.position.y = 1.6 + Math.sin(elapsed * 0.005) * 0.04
        forte.rotation.y = 0
      }

      // Ignite the right pillar.
      if (elapsed >= igniteAtMs) {
        const k = Math.min(1, (elapsed - igniteAtMs) / 700)
        ;(rightGlyph.material as THREE.MeshStandardMaterial).color.lerp(
          new THREE.Color(hex(colors.brand[400])),
          k * 0.05,
        )
        ;(rightGlyph.material as THREE.MeshStandardMaterial).emissive.set(hex(colors.brand[400]))
        ;(rightGlyph.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.05 + k * 1.2
        rightPillarLight.intensity = 0.6 + k * 4
        if (toLabel) {
          ;(toLabel.material as THREE.SpriteMaterial).color.set(hex(colors.brand[400]))
        }

        // Sparkles
        sparkleMat.opacity = Math.max(0, 1 - (elapsed - igniteAtMs) / 1200)
        const positions = sparkleGeo.attributes.position as THREE.BufferAttribute
        for (let i = 0; i < sparkleCount; i++) {
          const dt = (elapsed - igniteAtMs) / 1000
          positions.setXYZ(
            i,
            4 + sparkleVel[i].x * dt,
            2.4 + sparkleVel[i].y * dt - 1.5 * dt * dt,
            sparkleVel[i].z * dt,
          )
        }
        positions.needsUpdate = true
      }

      // Spin the left glyph for that "mastered" feel.
      leftGlyph.rotation.y = elapsed * 0.0015
      rightGlyph.rotation.y = elapsed * 0.0010

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
  }, [fromNote, toNote, onComplete])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-surface-950/90 backdrop-blur-sm"
    >
      <AnimatePresence>
        <motion.h2
          key="banner"
          initial={{ opacity: 0, y: -30, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          className="absolute top-12 z-10 text-center"
        >
          <span className="block text-sm uppercase tracking-[0.4em] text-brand-400">Mastered</span>
          <span className="mt-2 block text-7xl font-black tracking-tight text-white">
            {prettyNote(fromNote)}
          </span>
        </motion.h2>

        {toNote && (
          <motion.p
            key="next"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1.6 }}
            className="absolute bottom-16 text-center text-surface-300"
          >
            <span className="block text-xs uppercase tracking-[0.3em] text-surface-400">Up next</span>
            <span className="mt-1 block text-2xl font-bold text-brand-400">{prettyNote(toNote)}</span>
          </motion.p>
        )}
      </AnimatePresence>

      <div ref={containerRef} className="h-[60vh] w-full max-w-5xl" />
    </motion.div>
  )
}
