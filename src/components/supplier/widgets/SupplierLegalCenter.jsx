import { useCallback, useEffect, useState } from 'react'
import { CheckCircle2, Clock, FileText, History } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { SignaturePad } from '@/components/shared/SignaturePad'
import { fetchSupplierDocuments, signSupplierDocument } from '../api/supplierApi'

function formatDate(iso) {
  if (!iso) return '—'
  try {
    return new Intl.DateTimeFormat('ru-RU', { dateStyle: 'medium', timeStyle: 'short' }).format(
      new Date(iso)
    )
  } catch {
    return iso
  }
}

/**
 * Legal Center: список документов и онлайн-подпись с историей.
 */
export function SupplierLegalCenter({ session }) {
  const [documents, setDocuments] = useState([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState('')
  const [active, setActive] = useState(null)
  const [fullName, setFullName] = useState(session?.name || '')
  const [dataUrl, setDataUrl] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState('')

  const reload = useCallback(async () => {
    const out = await fetchSupplierDocuments({ supplierProfileId: session.supplierProfileId })
    if (!out.ok) {
      setErr(out.error || 'Не удалось загрузить документы')
      return
    }
    setErr('')
    setDocuments(out.documents)
  }, [session.supplierProfileId])

  useEffect(() => {
    setLoading(true)
    reload().finally(() => setLoading(false))
  }, [reload])

  async function onSign() {
    setFormError('')
    if (!active) return
    setSubmitting(true)
    const out = await signSupplierDocument({
      session,
      assignmentId: active.assignmentId,
      fullName,
      signatureDataUrl: dataUrl,
    })
    setSubmitting(false)
    if (!out.ok) {
      setFormError(out.error || 'Ошибка подписания')
      return
    }
    setActive(null)
    setDataUrl(null)
    await reload()
  }

  if (!session.permissions?.canSignDocuments) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Документы</CardTitle>
          <CardDescription>Для этой учётной записи подписание отключено администратором.</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {err && <p className="text-sm text-red-600">{err}</p>}
      {loading && <p className="text-sm text-slate-500">Загрузка…</p>}
      {!loading && !documents.length && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <FileText className="size-4" />
              Документы
            </CardTitle>
            <CardDescription>
              У вас ещё нет документов на подпись. Администратор назначит шаблоны договоров.
            </CardDescription>
          </CardHeader>
        </Card>
      )}
      {!loading && documents.length > 0 && (
        <div className="grid gap-3">
          {documents.map((d) => (
            <Card key={d.assignmentId}>
              <CardContent className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-900">
                    {d.template?.title || 'Документ'}
                  </p>
                  {d.template?.description && (
                    <p className="mt-1 truncate text-xs text-slate-500">{d.template.description}</p>
                  )}
                  <p className="mt-2 flex items-center gap-2 text-[11px] text-slate-500">
                    <StatusBadge status={d.status} />
                    {d.lastSignedAt && (
                      <span className="inline-flex items-center gap-1 text-slate-500">
                        <History className="size-3" />
                        последняя подпись: {formatDate(d.lastSignedAt)}
                      </span>
                    )}
                  </p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setActive(d)
                      setDataUrl(null)
                      setFormError('')
                    }}
                  >
                    {d.status === 'SIGNED' ? 'Подписать снова' : 'Открыть и подписать'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!active} onOpenChange={(open) => !open && setActive(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{active?.template?.title || 'Документ'}</DialogTitle>
            <DialogDescription>
              Ознакомьтесь с текстом, введите ФИО и нарисуйте подпись. История всех подписей сохраняется.
            </DialogDescription>
          </DialogHeader>
          {active?.template && (
            <div className="space-y-4">
              <div className="max-h-[40vh] overflow-y-auto rounded-xl border border-slate-200 bg-slate-50/50 p-4 text-sm">
                {active.template.mimeKind === 'url' ? (
                  <a
                    href={active.template.content}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[#E41C2A] underline"
                  >
                    Открыть документ
                  </a>
                ) : (
                  <div
                    className="prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: active.template.content }}
                  />
                )}
              </div>
              <input
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-slate-300 focus:ring-2 focus:ring-slate-200/70"
                placeholder="Ваше ФИО как подписанта"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
              <SignaturePad onChange={setDataUrl} />
              {formError && <p className="text-sm text-red-600">{formError}</p>}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="text-xs text-slate-500">
                  История: {active.history?.length || 0} подпис
                  {(active.history?.length || 0) % 10 === 1 ? 'ь' : 'ей'}
                </div>
                <div className="flex gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => setActive(null)}>
                    Отмена
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    className="bg-[#E41C2A] hover:bg-[#c91822]"
                    disabled={submitting}
                    onClick={onSign}
                  >
                    {submitting ? 'Подпись…' : 'Подписать'}
                  </Button>
                </div>
              </div>
              {active.history?.length > 0 && (
                <div className="rounded-xl border border-slate-200 bg-white">
                  <div className="border-b border-slate-100 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    История подписей
                  </div>
                  <ul className="divide-y divide-slate-100 text-sm">
                    {active.history.map((h) => (
                      <li key={h.id} className="flex items-center justify-between gap-3 px-3 py-2">
                        <span className="truncate">{h.fullName}</span>
                        <span className="text-xs text-slate-500">{formatDate(h.signedAt)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

function StatusBadge({ status }) {
  if (status === 'SIGNED') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700 ring-1 ring-emerald-200">
        <CheckCircle2 className="size-3" /> подписан
      </span>
    )
  }
  if (status === 'DECLINED') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-medium text-red-700 ring-1 ring-red-200">
        отказ
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-800 ring-1 ring-amber-200">
      <Clock className="size-3" /> ожидает подписи
    </span>
  )
}
