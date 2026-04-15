import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Header from '../components/Header'
import { useSeo } from '../hooks/useSeo'
import { fetchPublishedNews } from '../lib/newsApi'

const CAT_LABEL = {
  investors: 'Инвесторам',
  customers: 'Покупателям',
}

function formatDate(iso) {
  if (!iso) return ''
  try {
    return new Intl.DateTimeFormat('ru-RU', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(iso))
  } catch {
    return iso
  }
}

export default function NewsFeed() {
  useSeo({ title: 'Новости — Redprice.kz', description: 'Новости и материалы Redprice.kz.' })
  const [posts, setPosts] = useState([])
  const [err, setErr] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setErr(null)
      const data = await fetchPublishedNews()
      if (cancelled) return
      if (!data.ok) {
        setErr(data.error || 'Не удалось загрузить новости')
        setPosts([])
      } else {
        setPosts(data.posts || [])
      }
      setLoading(false)
    })()
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="app platform-app platform-home">
      <Header showCart={false} />
      <div className="platform-main">
        <main className="platform-content catalog-home-main max-w-[960px]" role="main">
          <header className="mb-10 border-b border-[#E41C2A]/25 pb-8">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Новости</h1>
            <p className="mt-2 text-slate-600">Актуальные материалы Redprice.kz</p>
          </header>

          {loading && <p className="text-slate-500">Загрузка…</p>}
          {err && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-amber-900">
              {err}
              {err.includes('Prisma') || err.includes('БД') ? (
                <span className="mt-2 block text-sm">
                  Подключите PostgreSQL и выполните <code className="rounded bg-white px-1">npx prisma migrate deploy</code>.
                </span>
              ) : null}
            </div>
          )}

          {!loading && !err && posts.length === 0 && (
            <p className="text-slate-500">Пока нет опубликованных новостей.</p>
          )}

          <ul className="grid gap-8 sm:grid-cols-1">
            {posts.map((post) => (
              <li key={post.id}>
                <article className="group overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm ring-1 ring-slate-900/5 transition hover:shadow-md">
                  <Link to={`/news/${encodeURIComponent(post.slug)}`} className="block no-underline">
                    <div className="flex flex-col md:flex-row">
                      {post.coverImageUrl && (
                        <div className="aspect-[16/10] w-full shrink-0 md:max-w-[320px] md:aspect-auto md:min-h-[200px]">
                          <img
                            src={post.coverImageUrl}
                            alt=""
                            className="h-full w-full object-cover transition group-hover:opacity-95"
                          />
                        </div>
                      )}
                      <div className="flex flex-1 flex-col justify-center p-6 md:p-8">
                        <div className="mb-2 flex flex-wrap items-center gap-2 text-xs font-medium uppercase tracking-wide text-slate-500">
                          <span className="rounded-full bg-[#E41C2A]/10 px-2 py-0.5 text-[#b91c1c]">
                            {CAT_LABEL[post.category] || post.category}
                          </span>
                          <time dateTime={post.publishedAt || post.createdAt}>{formatDate(post.publishedAt || post.createdAt)}</time>
                        </div>
                        <h2 className="text-xl font-semibold tracking-tight text-slate-900 group-hover:text-[#E41C2A]">
                          {post.title}
                        </h2>
                        {post.excerpt && <p className="mt-2 line-clamp-3 text-slate-600">{post.excerpt}</p>}
                        <span className="mt-4 inline-flex text-sm font-medium text-[#E41C2A]">
                          Читать далее →
                        </span>
                      </div>
                    </div>
                  </Link>
                </article>
              </li>
            ))}
          </ul>
        </main>
      </div>
    </div>
  )
}
