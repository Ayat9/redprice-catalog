import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import Header from '../components/Header'
import { useSeo } from '../hooks/useSeo'
import { createNewsComment, fetchNewsBySlug, fetchNewsComments } from '../lib/newsApi'
import { NewsArticleLayouts } from '../components/news/NewsArticleLayouts'

const CAT_LABEL = {
  investors: 'Инвесторам',
  customers: 'Покупателям',
}

function formatDate(iso) {
  if (!iso) return ''
  try {
    return new Intl.DateTimeFormat('ru-RU', { dateStyle: 'long', timeStyle: 'short' }).format(new Date(iso))
  } catch {
    return iso
  }
}

export default function NewsArticle() {
  const { slug } = useParams()
  const [post, setPost] = useState(null)
  const [comments, setComments] = useState([])
  const [err, setErr] = useState(null)
  const [loading, setLoading] = useState(true)
  const [commentAuthor, setCommentAuthor] = useState('')
  const [commentBody, setCommentBody] = useState('')
  const [commentMsg, setCommentMsg] = useState(null)
  const [commentSaving, setCommentSaving] = useState(false)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setErr(null)
      const data = await fetchNewsBySlug(slug)
      if (cancelled) return
      if (!data.ok || !data.post) {
        setErr(data.error || 'Страница не найдена')
        setPost(null)
        setComments([])
      } else {
        setPost(data.post)
        const commentsData = await fetchNewsComments(slug)
        if (commentsData.ok) setComments(commentsData.comments || [])
        else setComments([])
      }
      setLoading(false)
    })()
    return () => {
      cancelled = true
    }
  }, [slug])

  async function onCommentSubmit(e) {
    e.preventDefault()
    if (!slug) return
    setCommentMsg(null)
    setCommentSaving(true)
    const out = await createNewsComment(slug, {
      author: commentAuthor,
      body: commentBody,
    })
    setCommentSaving(false)
    if (!out.ok) {
      setCommentMsg({ type: 'err', text: out.error || 'Не удалось отправить комментарий' })
      return
    }
    setCommentAuthor('')
    setCommentBody('')
    setCommentMsg({ type: 'ok', text: 'Комментарий добавлен' })
    const commentsData = await fetchNewsComments(slug)
    if (commentsData.ok) setComments(commentsData.comments || [])
  }

  useSeo({
    title: post ? `${post.title} — Redprice.kz` : 'Новость — Redprice.kz',
    description: post?.excerpt || 'Redprice.kz',
  })

  return (
    <div className="app platform-app platform-home">
      <Header showCart={false} />
      <div className="platform-main">
        <main className="platform-content catalog-home-main max-w-[880px]" role="main">
          <nav className="mb-8 text-sm text-slate-500">
            <Link to="/news" className="text-[#E41C2A] hover:underline">
              ← Все новости
            </Link>
          </nav>

          {loading && <p className="text-slate-500">Загрузка…</p>}
          {err && !loading && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-900">{err}</div>
          )}

          {post && (
            <article>
              <header className="mb-10 border-b border-slate-200 pb-8">
                <div className="mb-3 flex flex-wrap items-center gap-2 text-xs font-medium uppercase tracking-wide text-slate-500">
                  <span className="rounded-full bg-[#E41C2A]/10 px-2 py-0.5 text-[#b91c1c]">
                    {CAT_LABEL[post.category] || post.category}
                  </span>
                  <time dateTime={post.publishedAt || post.createdAt}>{formatDate(post.publishedAt || post.createdAt)}</time>
                </div>
                <h1 className="text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">{post.title}</h1>
                {post.excerpt && <p className="mt-4 text-lg text-slate-600">{post.excerpt}</p>}
              </header>
              <NewsArticleLayouts post={post} />

              <section className="mt-12 border-t border-slate-200 pt-8">
                <h2 className="text-2xl font-semibold tracking-tight text-slate-900">Комментарии</h2>
                <p className="mt-1 text-sm text-slate-500">Посетители могут оставить отзыв под этой новостью.</p>

                <form className="mt-5 space-y-3 rounded-xl border border-slate-200 bg-white p-4" onSubmit={onCommentSubmit}>
                  <input
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm"
                    placeholder="Ваше имя"
                    value={commentAuthor}
                    onChange={(e) => setCommentAuthor(e.target.value)}
                    maxLength={80}
                    required
                  />
                  <textarea
                    className="min-h-[110px] w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm"
                    placeholder="Ваш комментарий"
                    value={commentBody}
                    onChange={(e) => setCommentBody(e.target.value)}
                    maxLength={3000}
                    required
                  />
                  {commentMsg && (
                    <p className={commentMsg.type === 'ok' ? 'text-sm text-emerald-700' : 'text-sm text-red-700'}>
                      {commentMsg.text}
                    </p>
                  )}
                  <button
                    type="submit"
                    disabled={commentSaving}
                    className="rounded-lg bg-[#E41C2A] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#c91822] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {commentSaving ? 'Отправка...' : 'Оставить комментарий'}
                  </button>
                </form>

                <div className="mt-6 space-y-3">
                  {comments.length === 0 ? (
                    <p className="text-sm text-slate-500">Комментариев пока нет. Будьте первым.</p>
                  ) : (
                    comments.map((c) => (
                      <article key={c.id} className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="font-medium text-slate-900">{c.author}</p>
                          <time className="text-xs text-slate-500" dateTime={c.createdAt}>
                            {formatDate(c.createdAt)}
                          </time>
                        </div>
                        <p className="mt-2 whitespace-pre-wrap text-slate-700">{c.body}</p>
                      </article>
                    ))
                  )}
                </div>
              </section>
            </article>
          )}
        </main>
      </div>
    </div>
  )
}
