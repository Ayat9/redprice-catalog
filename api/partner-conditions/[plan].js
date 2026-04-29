import {
  PARTNER_CONDITIONS,
  readPartnerConditionFile,
  setJsonHeaders,
  writePartnerCondition,
} from '../_partner-conditions.js'

export default async function handler(req, res) {
  setJsonHeaders(res)

  if (req.method === 'OPTIONS') return res.status(200).end()

  const planId = String(req.query?.plan || '').trim()
  if (!PARTNER_CONDITIONS[planId]) {
    return res.status(404).json({ ok: false, error: 'Неизвестный тип условий' })
  }

  if (req.method === 'POST') {
    try {
      const updated = await writePartnerCondition(planId, req.body || {})
      return res.status(200).json(updated)
    } catch (err) {
      return res.status(400).json({ ok: false, error: err?.message || 'Ошибка загрузки PDF' })
    }
  }

  if (req.method === 'GET') {
    const file = await readPartnerConditionFile(planId)
    if (!file) return res.status(404).json({ ok: false, error: 'Файл не найден' })
    return res.status(200).json({
      id: planId,
      label: PARTNER_CONDITIONS[planId].label,
      filename: file.filename,
      exists: true,
      url: `/api/partner-conditions/file/${planId}`,
    })
  }

  return res.status(405).json({ ok: false, error: 'Method not allowed' })
}
