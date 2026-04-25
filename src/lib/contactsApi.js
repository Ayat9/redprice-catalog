const DEFAULT_CONTACTS = {
  phone: '+7 777 123 45 67',
  whatsapp: 'https://wa.me/77771234567',
  email: 'info@redprice.kz',
  address: 'Алматы, Казахстан',
  workingHours: 'Пн-Вс 09:00-21:00',
  mapEmbed:
    '<iframe src="https://www.google.com/maps?q=Almaty%2C%20Kazakhstan&output=embed" width="100%" height="360" style="border:0;" allowfullscreen="" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>',
}

export async function getContacts() {
  try {
    const res = await fetch('/api/contacts')
    if (!res.ok) throw new Error('Contacts request failed')
    return { ...DEFAULT_CONTACTS, ...(await res.json()) }
  } catch (_) {
    return { ...DEFAULT_CONTACTS }
  }
}

export async function saveContacts(payload) {
  const res = await fetch('/api/contacts', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error('Не удалось сохранить контакты')
  return await res.json()
}
