import { useEffect } from 'react'

const DEFAULT_TITLE = 'Redprice.kz — оптовый каталог товаров'
const DEFAULT_DESCRIPTION = 'Redprice.kz — каталог товаров для оптовых покупателей. Выберите категорию, оформите заявку. Казахстан.'

export function useSeo({ title, description } = {}) {
  useEffect(() => {
    const prevTitle = document.title
    const prevMeta = document.querySelector('meta[name="description"]')
    const prevContent = prevMeta?.getAttribute('content') || ''

    document.title = title ? `${title} | Redprice.kz` : DEFAULT_TITLE
    if (description) {
      let meta = document.querySelector('meta[name="description"]')
      if (!meta) {
        meta = document.createElement('meta')
        meta.name = 'description'
        document.head.appendChild(meta)
      }
      meta.setAttribute('content', description)
    }

    return () => {
      document.title = prevTitle
      if (prevMeta) prevMeta.setAttribute('content', prevContent)
    }
  }, [title, description])
}
