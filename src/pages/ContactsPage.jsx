import { useEffect, useState } from 'react'
import { Mail, MapPin, MessageCircle, Phone, Clock } from 'lucide-react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { useSeo } from '@/hooks/useSeo'
import { getContacts } from '@/lib/contactsApi'

const contactCards = [
  { key: 'phone', label: 'Телефон', Icon: Phone },
  { key: 'whatsapp', label: 'WhatsApp', Icon: MessageCircle },
  { key: 'email', label: 'Email', Icon: Mail },
  { key: 'address', label: 'Адрес', Icon: MapPin },
  { key: 'workingHours', label: 'График работы', Icon: Clock },
]

export default function ContactsPage() {
  const [contacts, setContacts] = useState(null)

  useSeo({
    title: 'Контакты Redprice',
    description: 'Контакты Redprice: партнёрство, поставки и сотрудничество.',
  })

  useEffect(() => {
    getContacts().then(setContacts)
  }, [])

  const data = contacts || {}

  return (
    <div className="flex min-h-screen flex-col bg-[#F8FAFC] text-[#0F172A]">
      <Header showCart={false} />
      <main className="contacts-page flex-1 py-16 md:py-24">
        <div className="page-container mx-auto w-full max-w-[1180px] px-4 md:px-6">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-5xl font-bold tracking-tight md:text-6xl">Контакты Redprice</h1>
            <p className="mt-5 text-lg leading-[1.6] text-[#4B5563]">
              Свяжитесь с нами по любому вопросу — партнёрство, поставки, сотрудничество.
            </p>
          </div>

          <div className="mt-12 grid gap-5 md:grid-cols-2">
            {contactCards.map(({ key, label, Icon }) => (
              <article key={key} className="rounded-[20px] bg-white p-6 shadow-sm">
                <div className="flex items-start gap-4">
                  <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-red-50 text-[#E30613]">
                    <Icon className="size-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold">{label}</h2>
                    <p className="mt-1 break-words text-base leading-[1.6] text-[#4B5563]">
                      {data[key] || '—'}
                    </p>
                  </div>
                </div>
              </article>
            ))}
          </div>

          <div className="mt-8 flex justify-center">
            <a
              href={data.whatsapp || '#'}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-12 items-center justify-center rounded-xl bg-[#25D366] px-6 font-semibold text-white shadow-sm transition hover:brightness-95"
            >
              Написать в WhatsApp
            </a>
          </div>

          {data.mapEmbed && (
            <section className="mt-12 overflow-hidden rounded-[24px] bg-white p-3 shadow-sm">
              <div
                className="overflow-hidden rounded-[18px] [&_iframe]:block [&_iframe]:min-h-[360px] [&_iframe]:w-full"
                dangerouslySetInnerHTML={{ __html: data.mapEmbed }}
              />
            </section>
          )}
        </div>
      </main>
      <Footer />
    </div>
  )
}
