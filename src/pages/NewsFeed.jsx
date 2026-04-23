import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import Header from '../components/Header'
import Footer from '../components/Footer'
import { useSeo } from '../hooks/useSeo'
import { fetchPublishedNews } from '../lib/newsApi'

const CAT_LABEL = {
  investors: 'Инвесторам',
  customers: 'Покупателям',
}

function formatDate(iso) {
  if (!iso) return ''
  try {
    return new Intl.DateTimeFormat('ru-RU', { dateStyle: 'medium', timeStyle: 'short' }).format(
      new Date(iso),
    )
  } catch {
    return iso
  }
}

function formatShortDate(iso) {
  if (!iso) return ''
  try {
    return new Intl.DateTimeFormat('ru-RU', { day: '2-digit', month: 'short', year: 'numeric' }).format(
      new Date(iso),
    )
  } catch {
    return iso
  }
}

export default function NewsFeed() {
  useSeo({
    title: 'Блог — Redprice.kz',
    description: 'Блог Redprice.kz: новости, аналитика и материалы для партнёров и инвесторов.',
  })
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

  const history = useMemo(() => {
    return [...posts]
      .sort((a, b) => {
        const ad = new Date(a.publishedAt || a.createdAt || 0).getTime()
        const bd = new Date(b.publishedAt || b.createdAt || 0).getTime()
        return bd - ad
      })
      .slice(0, 12)
  }, [posts])

  return (
    <div className="flex min-h-screen flex-col bg-white font-sans text-slate-900 antialiased">
      <Header showCart={false} />

      <main
        className="mx-auto w-full max-w-[1200px] flex-1 px-4 py-16 sm:px-6 sm:py-20 lg:px-8"
        role="main"
      >
        <header className="mb-10 border-b border-slate-200 pb-6 sm:mb-12">
          <h1 className="text-4xl font-bold tracking-tight text-slate-900">Блог</h1>
          <p className="mt-3 text-base text-slate-600">Актуальные материалы Redprice.kz</p>
        </header>

        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-12">
          {/* Основная колонка — записи блога */}
          <section>
            {loading && <p className="text-slate-500">Загрузка…</p>}
            {err && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-amber-900">
                {err}
                {err.includes('Prisma') || err.includes('БД') ? (
                  <span className="mt-2 block text-sm">
                    Подключите PostgreSQL и выполните{' '}
                    <code className="rounded bg-white px-1">npx prisma migrate deploy</code>.
                  </span>
                ) : null}
              </div>
            )}

            {!loading && !err && posts.length === 0 && (
              <p className="text-slate-500">Пока нет опубликованных записей.</p>
            )}

            <ul className="grid gap-8">
              {posts.map((post) => (
                <li key={post.id}>
                  <article className="group overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm ring-1 ring-slate-900/5 transition hover:shadow-md">
                    <Link
                      to={`/news/${encodeURIComponent(post.slug)}`}
                      className="block no-underline"
                    >
                      <div className="flex flex-col md:flex-row">
                        {post.coverImageUrl && (
                          <div className="aspect-[16/10] w-full shrink-0 md:aspect-auto md:min-h-[200px] md:max-w-[320px]">
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
                            <time dateTime={post.publishedAt || post.createdAt}>
                              {formatDate(post.publishedAt || post.createdAt)}
                            </time>
                          </div>
                          <h2 className="text-xl font-semibold tracking-tight text-slate-900 group-hover:text-[#E41C2A]">
                            {post.title}
                          </h2>
                          {post.excerpt && (
                            <p className="mt-2 line-clamp-3 text-slate-600">{post.excerpt}</p>
                          )}
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
          </section>

          {/* Сайдбар — история новостей */}
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <span className="h-2 w-2 rounded-full bg-[#E41C2A]" aria-hidden="true" />
                <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-900">
                  История новостей
                </h2>
              </div>

              {loading && <p className="mt-4 text-sm text-slate-500">Загрузка…</p>}
              {!loading && history.length === 0 && (
                <p className="mt-4 text-sm text-slate-500">Записей пока нет.</p>
              )}

              <ul className="mt-4 divide-y divide-slate-100">
                {history.map((post) => (
                  <li key={`hist-${post.id}`}>
                    <Link
                      to={`/news/${encodeURIComponent(post.slug)}`}
                      className="group flex flex-col gap-1 py-3 transition"
                    >
                      <time
                        dateTime={post.publishedAt || post.createdAt}
                        className="text-xs font-medium uppercase tracking-wide text-slate-500"
                      >
                        {formatShortDate(post.publishedAt || post.createdAt)}
                      </time>
                      <span className="text-sm font-medium leading-snug text-slate-800 transition group-hover:text-[#E41C2A]">
                        {post.title}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </div>
      </main>

      <Footer />
    </div>
  )
}
