import {
  eslBackendMode,
  getNomenclature,
  getTagPayloadForMac,
  setDeviceBinding,
  syncFrom1CStub,
} from './esl-store.js'

/** @param {import('http').IncomingMessage} req */
export function readBody(req) {
  return new Promise((resolve, reject) => {
    let text = ''
    req.on('data', (chunk) => {
      text += chunk
    })
    req.on('end', () => resolve(text))
    req.on('error', reject)
  })
}

/**
 * Обработка путей ESL для dev (Vite) и прод (Express).
 * @param {string} pathname без query, с нормализованным слэшем
 * @param {string} method
 * @param {string} bodyText
 * @returns {Promise<{ handled: boolean, status?: number, headers?: Record<string,string>, body?: string }>}
 */
export async function handleEslRequest(pathname, method, bodyText) {
  const base = '/api/v1'

  if (
    method === 'OPTIONS' &&
    (pathname === `${base}/esl/nomenclature` ||
      pathname === `${base}/esl/bind` ||
      pathname === `${base}/esl/sync-1c` ||
      pathname.startsWith(`${base}/tag/`))
  ) {
    return {
      handled: true,
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
      body: '',
    }
  }

  if (pathname === `${base}/esl/nomenclature` && method === 'GET') {
    const items = await getNomenclature()
    return {
      handled: true,
      status: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ ok: true, backend: eslBackendMode(), items }),
    }
  }

  if (pathname === `${base}/esl/bind` && method === 'POST') {
    let body = {}
    try {
      body = JSON.parse(bodyText || '{}')
    } catch {
      return {
        handled: true,
        status: 400,
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({ ok: false, message: 'Некорректный JSON' }),
      }
    }
    try {
      const result = await setDeviceBinding(body.mac, body.productId)
      return {
        handled: true,
        status: 200,
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({ ok: true, ...result }),
      }
    } catch (err) {
      return {
        handled: true,
        status: 400,
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({ ok: false, message: err?.message || 'Ошибка' }),
      }
    }
  }

  if (pathname === `${base}/esl/sync-1c` && method === 'POST') {
    const result = await syncFrom1CStub()
    return {
      handled: true,
      status: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify(result),
    }
  }

  if (pathname.startsWith(`${base}/tag/`) && method === 'GET') {
    const macPart = decodeURIComponent(pathname.slice(`${base}/tag/`.length))
    const payload = await getTagPayloadForMac(macPart)
    if (payload.status === 400) {
      return {
        handled: true,
        status: 400,
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({ error: payload.error }),
      }
    }
    if (payload.status === 404) {
      return {
        handled: true,
        status: 404,
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({ error: payload.error }),
      }
    }
    return {
      handled: true,
      status: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-store',
      },
      body: JSON.stringify(payload.body),
    }
  }

  return { handled: false }
}

/**
 * @param {import('http').IncomingMessage & { body?: unknown }} req
 * @param {import('http').ServerResponse} res
 * @param {() => void} next
 */
export async function eslExpressMiddleware(req, res, next) {
  let pathname = (req.originalUrl || req.url || '').split('?')[0]
  if (pathname.length > 1) pathname = pathname.replace(/\/$/, '')
  if (
    !pathname.startsWith('/api/v1/esl') &&
    !pathname.startsWith('/api/v1/tag/')
  ) {
    next()
    return
  }
  let bodyText = ''
  if (req.method === 'POST') {
    if (req.body !== undefined && typeof req.body === 'object') {
      bodyText = JSON.stringify(req.body)
    } else {
      bodyText = await readBody(req)
    }
  }
  const out = await handleEslRequest(pathname, req.method || 'GET', bodyText)
  if (!out.handled) {
    next()
    return
  }
  res.statusCode = out.status || 200
  for (const [k, v] of Object.entries(out.headers || {})) {
    res.setHeader(k, v)
  }
  res.end(out.body)
}

