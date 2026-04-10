import { syncFrom1CStub } from '../../../lib/esl-store.js'

function cors(res) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
}

export default async function handler(req, res) {
  cors(res)
  if (req.method === 'OPTIONS') return res.status(204).end()
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, message: 'Method not allowed' })
  }
  try {
    const result = await syncFrom1CStub()
    return res.status(200).json(result)
  } catch (err) {
    return res.status(500).json({ ok: false, message: err?.message || 'Server error' })
  }
}
