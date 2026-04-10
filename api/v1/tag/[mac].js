import { getTagPayloadForMac } from '../../../lib/esl-store.js'

function cors(res) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  res.setHeader('Cache-Control', 'no-store')
}

export default async function handler(req, res) {
  cors(res)
  if (req.method === 'OPTIONS') return res.status(204).end()
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'method_not_allowed' })
  }
  const mac = req.query?.mac
  const payload = await getTagPayloadForMac(String(mac ?? ''))
  if (payload.status === 400) {
    return res.status(400).json({ error: payload.error })
  }
  if (payload.status === 404) {
    return res.status(404).json({ error: payload.error })
  }
  return res.status(200).json(payload.body)
}
