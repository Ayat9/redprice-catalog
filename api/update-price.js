import { writePrice } from './_supabase.js'

function setCommonHeaders(res) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
}

export default async function handler(req, res) {
  setCommonHeaders(res)

  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ success: false, message: 'Method not allowed' })

  try {
    const updated = await writePrice(req.body || {})
    return res.status(200).json(updated)
  } catch (err) {
    return res.status(400).json({ success: false, message: err?.message || 'Server error' })
  }
}

