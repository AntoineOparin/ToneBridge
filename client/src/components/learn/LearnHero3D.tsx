import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { colors } from '../../lib/theme'
import { PITCH_CLASSES } from '../../lib/constants'

const hex = (c: string) => parseInt(c.replace('#', ''), 16)

/**
 * Hero canvas: twelve glowing shapes orbit in a chromatic ring — one metaphor
 * per pitch class — with slowly drifting particles and bridge cables.
 */
export default function LearnHero3D() {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const width = container.clientWidth
    const height = container.clientHeight

    const scene = new THREE.Scene()
    scene.fog = new THREE.FogExp2(hex(colors.surface[900]), 0.035)

    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 100)
    camera.position.set(0, 0.6, 9)

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setSize(width, height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setClearColor(hex(colors.surface[900]), 0)
    container.appendChild(renderer.domElement)

    const ambient = new THREE.AmbientLight(hex(colors.surface[600]), 1.2)
    scene.add(ambient)
    const key = new THREE.PointLight(hex(colors.brand[500]), 2.2, 40)
    key.position.set(4, 4, 6)
    scene.add(key)
    const cool = new THREE.PointLight(hex(colors.accent[400]), 1.2, 35)
    cool.position.set(-5, -2, 4)
    scene.add(cool)

    const group = new THREE.Group()
    scene.add(group)

    const notes = PITCH_CLASSES.length
    const radius = 3.2

    for (let i = 0; i < notes; i++) {
      const t = (i / notes) * Math.PI * 2
      const hue = i / notes
      const mat = new THREE.MeshStandardMaterial({
        color: new THREE.Color().setHSL(0.08 + hue * 0.12, 0.75, 0.55),
        emissive: new THREE.Color().setHSL(0.08 + hue * 0.12, 0.9, 0.25),
        emissiveIntensity: 0.6,
        metalness: 0.5,
        roughness: 0.25,
      })
      const mesh = new THREE.Mesh(new THREE.IcosahedronGeometry(0.22, 0), mat)
      mesh.position.set(Math.cos(t) * radius, Math.sin(t * 2) * 0.25, Math.sin(t) * radius)
      mesh.userData.phase = t
      group.add(mesh)
    }

    // Central “sun” — tuning fork metaphor
    const coreGeo = new THREE.SphereGeometry(0.35, 32, 32)
    const coreMat = new THREE.MeshStandardMaterial({
      color: hex(colors.brand[400]),
      emissive: hex(colors.brand[600]),
      emissiveIntensity: 0.8,
      metalness: 0.6,
      roughness: 0.2,
    })
    const core = new THREE.Mesh(coreGeo, coreMat)
    group.add(core)

    // Ring plane
    const ringGeo = new THREE.TorusGeometry(radius + 0.4, 0.02, 8, 64)
    const ringMat = new THREE.MeshBasicMaterial({
      color: hex(colors.surface[500]),
      transparent: true,
      opacity: 0.35,
    })
    const ring = new THREE.Mesh(ringGeo, ringMat)
    ring.rotation.x = Math.PI / 2
    ring.position.y = -1.2
    scene.add(ring)

    const particlesGeo = new THREE.BufferGeometry()
    const n = 120
    const pos = new Float32Array(n * 3)
    for (let i = 0; i < n * 3; i++) pos[i] = (Math.random() - 0.5) * 14
    particlesGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    const particlesMat = new THREE.PointsMaterial({
      color: hex(colors.brand[400]),
      size: 0.045,
      transparent: true,
      opacity: 0.65,
      blending: THREE.AdditiveBlending,
    })
    const particles = new THREE.Points(particlesGeo, particlesMat)
    scene.add(particles)

    const cableMat = new THREE.LineBasicMaterial({
      color: hex(colors.surface[500]),
      transparent: true,
      opacity: 0.25,
    })
    const cablePts: THREE.Vector3[] = []
    for (let x = -8; x <= 8; x += 0.4) {
      cablePts.push(new THREE.Vector3(x, Math.sin(x * 0.35) * 0.5 - 1.8, -3))
    }
    const cable = new THREE.Line(new THREE.BufferGeometry().setFromPoints(cablePts), cableMat)
    scene.add(cable)

    const t0 = performance.now()
    let raf = 0
    const animate = () => {
      const elapsed = (performance.now() - t0) * 0.001
      group.rotation.y = elapsed * 0.15
      core.rotation.y = elapsed * 0.5
      core.position.y = Math.sin(elapsed * 1.2) * 0.08

      group.children.forEach((child) => {
        if (child instanceof THREE.Mesh && child !== core) {
          const ph = child.userData.phase as number
          child.position.y = Math.sin(elapsed * 2 + ph) * 0.12 + Math.sin(ph * 2) * 0.25
        }
      })

      particles.rotation.y = elapsed * 0.08
      particles.rotation.x = elapsed * 0.03

      renderer.render(scene, camera)
      raf = requestAnimationFrame(animate)
    }
    animate()

    const onResize = () => {
      const w = container.clientWidth
      const h = container.clientHeight
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      renderer.setSize(w, h)
    }
    window.addEventListener('resize', onResize)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', onResize)
      renderer.dispose()
      scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          obj.geometry.dispose()
          const m = obj.material
          if (Array.isArray(m)) m.forEach((x) => x.dispose())
          else m.dispose()
        }
      })
      particlesGeo.dispose()
      particlesMat.dispose()
      cable.geometry.dispose()
      cableMat.dispose()
      if (renderer.domElement.parentElement === container) container.removeChild(renderer.domElement)
    }
  }, [])

  return (
    <div
      ref={containerRef}
      className="relative h-[min(52vh,420px)] w-full overflow-hidden rounded-3xl border border-surface-700/80 bg-surface-950/40"
    />
  )
}
