import {
  batchAction,
  bindTagToProduct,
  enqueuePriceUpdate,
  getBackendMode,
  getDashboard,
  getNightMode,
  getProductsTable,
  getQueueLength,
  pingEsl,
  randomizeRuntimeStatus,
  runNightQueue,
  setEslPrice,
  setNightMode,
} from './esl-admin-store.js'

function out(status, payload) {
  return {
    handled: true,
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
    },
    body: JSON.stringify(payload),
  }
}

export async function handleEslAdminRequest(pathname, method, bodyText, search = '') {
  if (!pathname.startsWith('/api/v1/esl/admin')) return { handled: false }
  const qs = new URLSearchParams((search || '').replace(/^\?/, ''))
  try {
    if (pathname === '/api/v1/esl/admin/dashboard' && method === 'GET') {
      const storeId = qs.get('storeId') || 'rp-1'
      const dashboard = await getDashboard(storeId)
      const queue = await getQueueLength()
      const backend = await getBackendMode()
      return out(200, { ok: true, backend, queue, dashboard })
    }

    if (pathname === '/api/v1/esl/admin/products' && method === 'GET') {
      const storeId = qs.get('storeId') || 'rp-1'
      const discrepancyOnly = qs.get('discrepancyOnly') === '1'
      const searchText = qs.get('q') || ''
      const rows = await getProductsTable({ storeId, discrepancyOnly, search: searchText })
      return out(200, { ok: true, rows })
    }

    if (pathname === '/api/v1/esl/admin/bind' && method === 'POST') {
      const body = JSON.parse(bodyText || '{}')
      const result = await bindTagToProduct({
        storeId: body.storeId || 'rp-1',
        mac: body.mac,
        productId: body.productId,
      })
      return out(200, { ok: true, ...result })
    }

    if (pathname === '/api/v1/esl/admin/price' && method === 'POST') {
      const body = JSON.parse(bodyText || '{}')
      const result = await setEslPrice({ mac: body.mac, priceEsl: body.priceEsl })
      return out(200, { ok: true, ...result })
    }

    if (pathname === '/api/v1/esl/admin/discrepancy/enqueue' && method === 'POST') {
      const body = JSON.parse(bodyText || '{}')
      const result = await enqueuePriceUpdate(body)
      return out(200, result)
    }

    if (pathname === '/api/v1/esl/admin/night-mode' && method === 'GET') {
      const data = await getNightMode()
      return out(200, { ok: true, ...data })
    }

    if (pathname === '/api/v1/esl/admin/night-mode' && method === 'POST') {
      const body = JSON.parse(bodyText || '{}')
      const data = await setNightMode(body)
      return out(200, data)
    }

    if (pathname === '/api/v1/esl/admin/night-mode/run' && method === 'POST') {
      const result = await runNightQueue({})
      return out(200, result)
    }

    if (pathname === '/api/v1/esl/admin/ping' && method === 'POST') {
      const body = JSON.parse(bodyText || '{}')
      const result = await pingEsl(body.mac)
      return out(200, result)
    }

    if (pathname === '/api/v1/esl/admin/batch' && method === 'POST') {
      const body = JSON.parse(bodyText || '{}')
      const result = await batchAction(body.storeId || 'rp-1', body.action || 'refresh_rack')
      return out(200, result)
    }

    if (pathname === '/api/v1/esl/admin/realtime/pulse' && method === 'POST') {
      const body = JSON.parse(bodyText || '{}')
      await randomizeRuntimeStatus(body.storeId || 'rp-1')
      return out(200, { ok: true })
    }

    return out(404, { ok: false, message: 'ESL admin route not found' })
  } catch (e) {
    return out(400, { ok: false, message: e?.message || 'Ошибка запроса' })
  }
}

