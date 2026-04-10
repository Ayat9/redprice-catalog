import { setDeviceBinding } from '../../../lib/esl-store.js'

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
    const body = typeof req.body === 'object' && req.body ? req.body : {}
    const result = await setDeviceBinding(body.mac, body.productId)
    return res.status(200).json({ ok: true, ...result })
  } catch (err) {
    return res.status(400).json({ ok: false, message: err?.message || 'Ошибка' })
  }
}
