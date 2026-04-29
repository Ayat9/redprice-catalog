import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import Redis from 'ioredis'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const PROJECT_ROOT = path.resolve(__dirname, '..')

const CONDITIONS_DIR = path.join(PROJECT_ROOT, 'public', 'mock', 'conditions')
const MEMORY_KEY = '__redpricePartnerConditionsStore'

const PARTNER_CONDITIONS = {
  early: { label: 'EARLY', filename: 'early.pdf' },
  strategic: { label: 'STRATEGIC PARTNER', filename: 'strategic.pdf' },
}

let redis = null

function setJsonHeaders(res, methods = 'GET, POST, OPTIONS') {
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', methods)
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
}

function getMemoryStore() {
  if (!globalThis[MEMORY_KEY]) {
    globalThis[MEMORY_KEY] = new Map()
  }
  return globalThis[MEMORY_KEY]
}

function getRedis() {
  const url = process.env.REDIS_URL || ''
  if (!url) return null
  if (redis) return redis
  try {
    redis = new Redis(url, {
      maxRetriesPerRequest: 2,
      enableReadyCheck: true,
      lazyConnect: true,
    })
    redis.on('error', () => {})
    return redis
  } catch {
    return null
  }
}

function redisKey(planId) {
  return `redprice:partner-condition:${planId}`
}

async function readRedisCondition(planId) {
  const client = getRedis()
  if (!client) return null
  try {
    await client.ping()
    const raw = await client.get(redisKey(planId))
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!parsed?.base64) return null
    return parsed
  } catch {
    return null
  }
}

async function writeRedisCondition(planId, payload) {
  const client = getRedis()
  if (!client) return false
  try {
    await client.ping()
    await client.set(redisKey(planId), JSON.stringify(payload))
    return true
  } catch {
    return false
  }
}

function normalizePayload(raw = {}) {
  const value = String(raw.dataUrl || raw.base64 || '')
  const base64 = value.includes(',') ? value.split(',').pop() : value
  if (!base64) throw new Error('Файл не передан')

  const buffer = Buffer.from(base64, 'base64')
  if (!buffer.length) throw new Error('Файл пустой')
  if (buffer.length > 15 * 1024 * 1024) throw new Error('PDF не должен быть больше 15 МБ')
  if (!buffer.subarray(0, 5).toString('utf8').startsWith('%PDF-')) {
    throw new Error('Загрузите файл в формате PDF')
  }

  return { buffer, base64 }
}

async function readFromStaticFile(meta) {
  const filePath = path.join(CONDITIONS_DIR, meta.filename)
  try {
    const stat = await fs.stat(filePath)
    return {
      id: null,
      label: meta.label,
      filename: meta.filename,
      url: `/mock/conditions/${meta.filename}`,
      size: stat.size,
      updatedAt: stat.mtime.toISOString(),
      exists: true,
      source: 'static',
    }
  } catch {
    return {
      id: null,
      label: meta.label,
      filename: meta.filename,
      url: `/mock/conditions/${meta.filename}`,
      size: 0,
      updatedAt: null,
      exists: false,
      source: 'static',
    }
  }
}

async function readUploadedCondition(planId, meta) {
  const fromRedis = await readRedisCondition(planId)
  if (fromRedis) {
    return {
      id: planId,
      label: meta.label,
      filename: meta.filename,
      url: `/api/partner-conditions/file/${planId}`,
      size: Number(fromRedis.size || 0),
      updatedAt: fromRedis.updatedAt || null,
      exists: true,
      source: 'redis',
    }
  }

  const memory = getMemoryStore().get(planId)
  if (memory?.base64) {
    return {
      id: planId,
      label: meta.label,
      filename: meta.filename,
      url: `/api/partner-conditions/file/${planId}`,
      size: Number(memory.size || 0),
      updatedAt: memory.updatedAt || null,
      exists: true,
      source: 'memory',
    }
  }

  const fallback = await readFromStaticFile(meta)
  return { ...fallback, id: planId }
}

async function getPartnerConditionsList() {
  const items = await Promise.all(
    Object.entries(PARTNER_CONDITIONS).map(async ([id, meta]) => readUploadedCondition(id, meta)),
  )
  return { items }
}

async function writePartnerCondition(planId, payload = {}) {
  const meta = PARTNER_CONDITIONS[planId]
  if (!meta) throw new Error('Неизвестный тип условий')

  const { buffer, base64 } = normalizePayload(payload)
  const record = {
    id: planId,
    label: meta.label,
    filename: meta.filename,
    base64,
    size: buffer.length,
    updatedAt: new Date().toISOString(),
    originalName: String(payload.filename || '').trim(),
  }

  const savedToRedis = await writeRedisCondition(planId, record)
  if (!savedToRedis) {
    getMemoryStore().set(planId, record)
  }

  return {
    id: planId,
    label: meta.label,
    filename: meta.filename,
    url: `/api/partner-conditions/file/${planId}`,
    size: record.size,
    updatedAt: record.updatedAt,
    exists: true,
  }
}

async function readPartnerConditionFile(planId) {
  const meta = PARTNER_CONDITIONS[planId]
  if (!meta) return null

  const redisRecord = await readRedisCondition(planId)
  if (redisRecord?.base64) {
    return {
      buffer: Buffer.from(redisRecord.base64, 'base64'),
      filename: meta.filename,
    }
  }

  const memory = getMemoryStore().get(planId)
  if (memory?.base64) {
    return {
      buffer: Buffer.from(memory.base64, 'base64'),
      filename: meta.filename,
    }
  }

  try {
    const buffer = await fs.readFile(path.join(CONDITIONS_DIR, meta.filename))
    return { buffer, filename: meta.filename }
  } catch {
    return null
  }
}

export {
  setJsonHeaders,
  getPartnerConditionsList,
  writePartnerCondition,
  readPartnerConditionFile,
  PARTNER_CONDITIONS,
}
