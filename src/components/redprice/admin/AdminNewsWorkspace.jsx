import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import ReactQuill from 'react-quill'
import 'react-quill/dist/quill.snow.css'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  deleteNewsPost,
  createNewsPost,
  fetchNewsAll,
  newsWriteHeaders,
  updateNewsPost,
  uploadNewsMedia,
} from '@/lib/newsApi'
import { NewsArticleLayouts } from '@/components/news/NewsArticleLayouts'
import { FileText, ImagePlus, Loader2, Newspaper, RefreshCw, Upload, Video } from 'lucide-react'

const LAYOUTS = [
  { id: 'stack', label: 'Фото сверху — текст снизу' },
  { id: 'split-left', label: 'Текст слева — фото справа' },
  { id: 'split-right', label: 'Фото слева — текст справа' },
  { id: 'video', label: 'Видео (превью) + текст' },
]

const CATEGORIES = [
  { id: 'investors', label: 'Инвесторам' },
  { id: 'customers', label: 'Покупателям' },
]

const emptyForm = () => ({
  id: null,
  title: '',
  slug: '',
  excerpt: '',
  body: '',
  coverImageUrl: '',
  videoUrl: '',
  layoutType: 'stack',
  category: 'customers',
  published: false,
  publishedAt: '',
})

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => resolve(r.result)
    r.onerror = () => reject(new Error('Не удалось прочитать файл'))
    r.readAsDataURL(file)
  })
}

export default function AdminNewsWorkspace() {
  const quillRef = useRef(null)
  const coverInputRef = useRef(null)
  const videoFieldInputRef = useRef(null)
  const videoBodyInputRef = useRef(null)
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState(null)
  const [form, setForm] = useState(emptyForm)
  /** 'cover' | 'videoField' | 'videoBody' | null */
  const [uploading, setUploading] = useState(null)

  const loadList = useCallback(async () => {
    setLoading(true)
    setMsg(null)
    const data = await fetchNewsAll()
    if (!data.ok) {
      setMsg({ type: 'err', text: data.error || 'Не удалось загрузить список' })
      setList([])
    } else {
      setList(data.posts || [])
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    loadList()
  }, [loadList])

  const uploadLocalFile = async (file, kind) => {
    if (!file) return
    setUploading(kind)
    setMsg(null)
    try {
      const dataUrl = await readFileAsDataUrl(file)
      const res = await uploadNewsMedia(dataUrl, file.name)
      if (!res.ok || !res.url) {
        setMsg({ type: 'err', text: res.error || 'Ошибка загрузки файла' })
        return
      }
      return res.url
    } catch (e) {
      setMsg({ type: 'err', text: e?.message || 'Ошибка чтения файла' })
      return null
    } finally {
      setUploading(null)
    }
  }

  const onPickCover = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file || !file.type.startsWith('image/')) {
      setMsg({ type: 'err', text: 'Выберите файл изображения' })
      return
    }
    const url = await uploadLocalFile(file, 'cover')
    if (url) setForm((f) => ({ ...f, coverImageUrl: url }))
  }

  const onPickVideoForField = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file || !file.type.startsWith('video/')) {
      setMsg({ type: 'err', text: 'Выберите видеофайл (mp4, webm, mov…)' })
      return
    }
    const url = await uploadLocalFile(file, 'videoField')
    if (url) setForm((f) => ({ ...f, videoUrl: url }))
  }

  /** Вставка загруженного видео в HTML статьи (на публичной странице отрисуется тегом &lt;video&gt;) */
  const onPickVideoForBody = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file || !file.type.startsWith('video/')) {
      setMsg({ type: 'err', text: 'Выберите видеофайл' })
      return
    }
    const url = await uploadLocalFile(file, 'videoBody')
    if (!url) return
    const snippet = `<p><video src="${url}" controls playsinline style="max-width:100%;border-radius:12px"></video></p>`
    setForm((f) => ({ ...f, body: (f.body || '') + snippet }))
    setMsg({
      type: 'ok',
      text: 'Видео добавлено в конец текста. На сайте оно отобразится в статье; в редакторе иногда не видно — это ограничение Quill.',
    })
  }

  const modules = useMemo(
    () => ({
      toolbar: {
        container: [
          [{ header: [1, 2, 3, false] }],
          ['bold', 'italic', 'underline', 'strike'],
          [{ list: 'ordered' }, { list: 'bullet' }],
          [{ align: [] }],
          ['blockquote', 'link'],
          ['image', 'clean'],
        ],
        handlers: {
          image: function imageHandler() {
            const input = document.createElement('input')
            input.setAttribute('type', 'file')
            input.setAttribute('accept', 'image/*')
            input.click()
            input.onchange = async () => {
              const file = input.files?.[0]
              if (!file) return
              const reader = new FileReader()
              reader.onload = async () => {
                const dataUrl = reader.result
                const res = await uploadNewsMedia(dataUrl, file.name)
                if (res.ok && res.url) {
                  const q = quillRef.current?.getEditor?.()
                  if (q) {
                    const range = q.getSelection(true)
                    q.insertEmbed(range.index, 'image', res.url, 'user')
                  }
                } else {
                  setMsg({ type: 'err', text: res.error || 'Ошибка загрузки изображения' })
                }
              }
              reader.readAsDataURL(file)
            }
          },
        },
      },
      clipboard: { matchVisual: false },
    }),
    []
  )

  const previewPost = useMemo(
    () => ({
      title: form.title,
      body: form.body,
      coverImageUrl: form.coverImageUrl,
      videoUrl: form.videoUrl,
      layoutType: form.layoutType,
      category: form.category,
      excerpt: form.excerpt,
      publishedAt: form.publishedAt || null,
      createdAt: new Date().toISOString(),
    }),
    [form]
  )
  const publishedPosts = useMemo(
    () => list.filter((p) => p.published).sort((a, b) => String(b.publishedAt || b.createdAt).localeCompare(String(a.publishedAt || a.createdAt))),
    [list]
  )

  const editPost = (p) => {
    setForm({
      id: p.id,
      title: p.title || '',
      slug: p.slug || '',
      excerpt: p.excerpt || '',
      body: p.body || '',
      coverImageUrl: p.coverImageUrl || '',
      videoUrl: p.videoUrl || '',
      layoutType: p.layoutType || 'stack',
      category: p.category || 'customers',
      published: Boolean(p.published),
      publishedAt: p.publishedAt ? p.publishedAt.slice(0, 16) : '',
    })
    setMsg(null)
  }

  const newDraft = () => {
    setForm(emptyForm())
    setMsg(null)
  }

  const handleSave = async () => {
    if (!form.title.trim()) {
      setMsg({ type: 'err', text: 'Укажите заголовок' })
      return
    }
    setSaving(true)
    setMsg(null)
    let contentJson
    try {
      const ed = quillRef.current?.getEditor?.()
      if (ed) contentJson = ed.getContents()
    } catch {
      contentJson = undefined
    }
    const payload = {
      title: form.title.trim(),
      slug: form.slug.trim() || undefined,
      excerpt: form.excerpt.trim() || undefined,
      body: form.body,
      contentJson: contentJson || undefined,
      coverImageUrl: form.coverImageUrl.trim() || null,
      videoUrl: form.videoUrl.trim() || null,
      layoutType: form.layoutType,
      category: form.category,
      published: form.published,
      publishedAt: form.publishedAt ? new Date(form.publishedAt).toISOString() : null,
    }
    let data
    if (form.id) {
      data = await updateNewsPost(form.id, payload)
    } else {
      data = await createNewsPost(payload)
    }
    setSaving(false)
    if (!data.ok) {
      setMsg({ type: 'err', text: data.error || 'Ошибка сохранения' })
      return
    }
    setMsg({ type: 'ok', text: 'Сохранено' })
    if (data.post?.id) {
      setForm((f) => ({ ...f, id: data.post.id, slug: data.post.slug }))
    }
    loadList()
  }

  const handleDeletePost = async (post) => {
    const ok = window.confirm(`Удалить новость "${post.title}"? Это действие необратимо.`)
    if (!ok) return
    setMsg(null)
    const out = await deleteNewsPost(post.id)
    if (!out.ok) {
      setMsg({ type: 'err', text: out.error || 'Не удалось удалить новость' })
      return
    }
    if (form.id === post.id) setForm(emptyForm())
    setMsg({ type: 'ok', text: 'Новость удалена' })
    loadList()
  }

  const keyHint = import.meta.env.VITE_NEWS_WRITE_KEY ? null : (
    <p className="text-xs text-amber-800">
      Для production задайте <code className="rounded bg-white px-1">NEWS_WRITE_KEY</code> и{' '}
      <code className="rounded bg-white px-1">VITE_NEWS_WRITE_KEY</code> в .env и перезапустите сервер.
    </p>
  )

  return (
    <div className="admin-section min-h-0 flex-1">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="admin-section-title flex items-center gap-2">
            <Newspaper className="size-6 text-slate-500" strokeWidth={1.5} aria-hidden />
            Редактор новостей (CMS)
          </h2>
          <p className="admin-section-desc mt-1 max-w-2xl">
            Черновики и публикации хранятся в PostgreSQL. Превью справа повторяет вид страницы на сайте.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={loadList} disabled={loading}>
            <RefreshCw className={cn('size-4', loading && 'animate-spin')} aria-hidden />
            Обновить список
          </Button>
          <Button type="button" size="sm" className="gap-1.5 bg-[#E41C2A] hover:bg-[#c91822]" onClick={newDraft}>
            <FileText className="size-4" aria-hidden />
            Новая новость
          </Button>
        </div>
      </div>

      {keyHint && (
        <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">{keyHint}</div>
      )}

      {msg && (
        <div
          className={cn(
            'mb-4 rounded-xl border px-4 py-3 text-sm',
            msg.type === 'ok' ? 'border-emerald-200 bg-emerald-50 text-emerald-900' : 'border-red-200 bg-red-50 text-red-900'
          )}
        >
          {msg.text}
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="space-y-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm ring-1 ring-slate-900/5">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Параметры</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium text-slate-700">Заголовок</span>
              <input
                className="rounded-lg border border-slate-200 px-3 py-2 text-slate-900 shadow-sm"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium text-slate-700">Slug (URL)</span>
              <input
                className="rounded-lg border border-slate-200 px-3 py-2 font-mono text-sm text-slate-900 shadow-sm"
                placeholder="авто из заголовка"
                value={form.slug}
                onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
              />
            </label>
          </div>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-slate-700">Краткое описание (превью в ленте)</span>
            <textarea
              className="min-h-[72px] rounded-lg border border-slate-200 px-3 py-2 text-slate-900 shadow-sm"
              value={form.excerpt}
              onChange={(e) => setForm((f) => ({ ...f, excerpt: e.target.value }))}
            />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium text-slate-700">Макет</span>
              <select
                className="rounded-lg border border-slate-200 px-3 py-2 text-slate-900 shadow-sm"
                value={form.layoutType}
                onChange={(e) => setForm((f) => ({ ...f, layoutType: e.target.value }))}
              >
                {LAYOUTS.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium text-slate-700">Категория</span>
              <select
                className="rounded-lg border border-slate-200 px-3 py-2 text-slate-900 shadow-sm"
                value={form.category}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
              >
                {CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2 text-sm">
              <span className="inline-flex items-center gap-1 font-medium text-slate-700">
                <ImagePlus className="size-4 text-slate-400" aria-hidden />
                Обложка (URL или файл с компьютера)
              </span>
              <input
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm"
                placeholder="https://… или загрузите ниже"
                value={form.coverImageUrl}
                onChange={(e) => setForm((f) => ({ ...f, coverImageUrl: e.target.value }))}
              />
              <input
                ref={coverInputRef}
                type="file"
                accept="image/*,.heic,.heif,.avif,.bmp,.tif,.tiff,.svg"
                className="sr-only"
                aria-hidden
                onChange={onPickCover}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-fit gap-1.5"
                disabled={uploading === 'cover'}
                onClick={() => coverInputRef.current?.click()}
              >
                {uploading === 'cover' ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                ) : (
                  <Upload className="size-4" aria-hidden />
                )}
                Загрузить фото с компьютера
              </Button>
              {form.coverImageUrl && /^https?:|^\/uploads\//i.test(form.coverImageUrl) && (
                <img
                  src={form.coverImageUrl}
                  alt=""
                  className="mt-1 max-h-32 max-w-full rounded-lg border border-slate-100 object-cover"
                />
              )}
            </div>
            <div className="flex flex-col gap-2 text-sm">
              <span className="inline-flex items-center gap-1 font-medium text-slate-700">
                <Video className="size-4 text-slate-400" aria-hidden />
                Видео блока (YouTube, ссылка или файл)
              </span>
              <input
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm"
                placeholder="https://youtube.com/… или загрузите видео"
                value={form.videoUrl}
                onChange={(e) => setForm((f) => ({ ...f, videoUrl: e.target.value }))}
              />
              <input
                ref={videoFieldInputRef}
                type="file"
                accept="video/mp4,video/webm,video/ogg,video/quicktime,.mp4,.webm,.mov"
                className="sr-only"
                aria-hidden
                onChange={onPickVideoForField}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-fit gap-1.5"
                disabled={uploading === 'videoField'}
                onClick={() => videoFieldInputRef.current?.click()}
              >
                {uploading === 'videoField' ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                ) : (
                  <Upload className="size-4" aria-hidden />
                )}
                Загрузить видео с компьютера
              </Button>
              <p className="text-xs text-slate-500">До 100 МБ · mp4, webm, mov</p>
            </div>
          </div>
          <div className="flex flex-wrap items-end gap-4">
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium text-slate-700">Дата публикации</span>
              <input
                type="datetime-local"
                className="rounded-lg border border-slate-200 px-3 py-2 text-slate-900 shadow-sm"
                value={form.publishedAt}
                onChange={(e) => setForm((f) => ({ ...f, publishedAt: e.target.value }))}
              />
            </label>
            <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
              <input
                type="checkbox"
                checked={form.published}
                onChange={(e) => setForm((f) => ({ ...f, published: e.target.checked }))}
              />
              Опубликовано на сайте
            </label>
          </div>

          <div className="border-t border-slate-100 pt-4">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-medium text-slate-700">Текст статьи</p>
              <div className="flex flex-wrap gap-2">
                <input
                  ref={videoBodyInputRef}
                  type="file"
                  accept="video/mp4,video/webm,video/ogg,video/quicktime,.mp4,.webm,.mov"
                  className="sr-only"
                  aria-hidden
                  onChange={onPickVideoForBody}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-1.5 text-xs"
                  disabled={!!uploading}
                  onClick={() => videoBodyInputRef.current?.click()}
                >
                  {uploading === 'videoBody' ? (
                    <Loader2 className="size-3.5 animate-spin" aria-hidden />
                  ) : (
                    <Video className="size-3.5" aria-hidden />
                  )}
                  Видео в текст (файл)
                </Button>
                <span className="self-center text-xs text-slate-400">Фото в текст — кнопка картинки на панели редактора</span>
              </div>
            </div>
            <div className="news-editor-quill rounded-xl border border-slate-200 bg-white">
              <ReactQuill
                ref={quillRef}
                theme="snow"
                value={form.body}
                onChange={(html) => setForm((f) => ({ ...f, body: html }))}
                modules={modules}
                className="min-h-[220px]"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-4">
            <Button
              type="button"
              className="bg-[#E41C2A] hover:bg-[#c91822]"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? <Loader2 className="size-4 animate-spin" /> : null}
              {form.id ? 'Сохранить изменения' : 'Создать новость'}
            </Button>
            <span className="self-center text-xs text-slate-500">
              Заголовок <code className="rounded bg-slate-100 px-1">X-News-Write-Key</code>:{' '}
              {newsWriteHeaders()['X-News-Write-Key'] ? 'задан' : 'не задан (dev допускается)'}
            </span>
          </div>
        </div>

        <div className="space-y-3 rounded-2xl border border-slate-200/80 bg-[#F9FAFB] p-5 shadow-sm ring-1 ring-slate-900/5">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Превью (как на сайте)</h3>
          <div className="rounded-xl border border-dashed border-slate-200 bg-white p-6 shadow-inner">
            <header className="mb-6 border-b border-slate-100 pb-4">
              <p className="text-xs uppercase tracking-wide text-slate-400">
                {CATEGORIES.find((c) => c.id === form.category)?.label || form.category}
              </p>
              <h4 className="mt-1 text-xl font-bold text-slate-900">{form.title || 'Заголовок'}</h4>
              {form.excerpt && <p className="mt-2 text-slate-600">{form.excerpt}</p>}
            </header>
            <NewsArticleLayouts post={previewPost} />
          </div>
        </div>
      </div>

      <div className="mt-8 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm ring-1 ring-slate-900/5">
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">Опубликованные новости</h3>
        {loading ? (
          <p className="text-sm text-slate-500">Загрузка…</p>
        ) : publishedPosts.length === 0 ? (
          <p className="text-sm text-slate-500">Опубликованных новостей пока нет.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {publishedPosts.map((p) => (
              <li key={p.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                <div>
                  <span className="font-medium text-slate-900">{p.title}</span>
                  <span className="ml-2 text-xs text-slate-400">{p.slug}</span>
                </div>
                <div className="flex gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => editPost(p)}>
                    Редактировать
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="border-red-200 text-red-700 hover:bg-red-50"
                    onClick={() => handleDeletePost(p)}
                  >
                    Удалить
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="mt-8 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm ring-1 ring-slate-900/5">
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">Все материалы</h3>
        {loading ? (
          <p className="text-sm text-slate-500">Загрузка…</p>
        ) : list.length === 0 ? (
          <p className="text-sm text-slate-500">Пока пусто</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {list.map((p) => (
              <li key={p.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                <div>
                  <span className="font-medium text-slate-900">{p.title}</span>
                  <span className="ml-2 text-xs text-slate-400">
                    {p.published ? 'опубликовано' : 'черновик'} · {p.slug}
                  </span>
                </div>
                <Button type="button" variant="outline" size="sm" onClick={() => editPost(p)}>
                  Редактировать
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
