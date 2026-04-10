import { eslBackendMode, getNomenclature } from '../../../lib/esl-store.js'

function cors(res) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
}

export default async function handler(req, res) {
  cors(res)
  if (req.method === 'OPTIONS') return res.status(204).end()
  if (req.method !== 'GET') {
    return res.status(405).json({ ok: false, message: 'Method not allowed' })
  }
  try {
    const items = await getNomenclature()
    return res.status(200).json({ ok: true, backend: eslBackendMode(), items })
  } catch (err) {
    return res.status(500).json({ ok: false, message: err?.message || 'Server error' })
  }
}
