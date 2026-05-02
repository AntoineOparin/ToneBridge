import { Router } from 'express'

const router = Router()

router.get('/verify', (_req, res) => {
  res.json({ ok: true })
})

export default router
