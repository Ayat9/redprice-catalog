import {
  getPartnerConditionsList,
  PARTNER_CONDITIONS,
  readPartnerConditionFile,
  setJsonHeaders,
  writePartnerCondition,
} from '../_partner-conditions.js'

export default async function handler(req, res) {
  const filePlanId = String(req.query?.file || '').trim()
  const fileRequest = req.method === 'GET' && Boolean(filePlanId)

  if (fileRequest) {
    if (!PARTNER_CONDITIONS[filePlanId]) {
      setJsonHeaders(res)
      return res.status(404).json({ ok: false, error: 'Неизвестный тип условий' })
    }
    const file = await readPartnerConditionFile(filePlanId)
    if (!file) {
      setJsonHeaders(res)
      return res.status(404).json({ ok: false, error: 'Файл не найден' })
    }
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Cache-Control', 'no-store')
    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `inline; filename="${file.filename}"`)
    return res.status(200).send(file.buffer)
  }

  setJsonHeaders(res)

  if (req.method === 'OPTIONS') return res.status(200).end()

  if (req.method === 'GET') {
    try {
      const data = await getPartnerConditionsList()
      return res.status(200).json(data)
    } catch (err) {
      return res.status(500).json({ ok: false, error: err?.message || 'Server error' })
    }
  }

  if (req.method === 'POST') {
    try {
      const planId = String(req.body?.plan || '').trim()
      if (!planId) {
        return res.status(400).json({ ok: false, error: 'Не указан тип условий' })
      }
      const updated = await writePartnerCondition(planId, req.body || {})
      return res.status(200).json(updated)
    } catch (err) {
      return res.status(400).json({ ok: false, error: err?.message || 'Ошибка загрузки PDF' })
    }
  }

  return res.status(405).json({ ok: false, error: 'Method not allowed' })
}
