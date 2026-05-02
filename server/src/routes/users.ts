import { Router } from 'express'

const router = Router()

router.get('/:id', (_req, res) => {
  res.json({ id: _req.params.id })
})

router.patch('/:id', (_req, res) => {
  res.json({ ok: true })
})

export default router
