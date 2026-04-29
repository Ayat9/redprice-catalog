import {
  PARTNER_CONDITIONS,
  readPartnerConditionFile,
} from '../../_partner-conditions.js'

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
    return res.status(200).end()
  }

  if (req.method !== 'GET') {
    res.setHeader('Content-Type', 'application/json; charset=utf-8')
    return res.status(405).json({ ok: false, error: 'Method not allowed' })
  }

  const planId = String(req.query?.plan || '').trim()
  if (!PARTNER_CONDITIONS[planId]) {
    res.setHeader('Content-Type', 'application/json; charset=utf-8')
    return res.status(404).json({ ok: false, error: 'Неизвестный тип условий' })
  }

  const file = await readPartnerConditionFile(planId)
  if (!file) {
    res.setHeader('Content-Type', 'application/json; charset=utf-8')
    return res.status(404).json({ ok: false, error: 'Файл не найден' })
  }

  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Cache-Control', 'no-store')
  res.setHeader('Content-Type', 'application/pdf')
  res.setHeader('Content-Disposition', `inline; filename=\"${file.filename}\"`)
  return res.status(200).send(file.buffer)
}
