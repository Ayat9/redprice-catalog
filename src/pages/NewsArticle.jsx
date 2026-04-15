import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import Header from '../components/Header'
import { useSeo } from '../hooks/useSeo'
import { fetchNewsBySlug } from '../lib/newsApi'
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
  const [err, setErr] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setErr(null)
      const data = await fetchNewsBySlug(slug)
      if (cancelled) return
      if (!data.ok || !data.post) {
        setErr(data.error || 'Страница не найдена')
        setPost(null)
      } else {
        setPost(data.post)
      }
      setLoading(false)
    })()
    return () => {
      cancelled = true
    }
  }, [slug])

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
            </article>
          )}
        </main>
      </div>
    </div>
  )
}
