/**
 * Техподдержка инвесторского портала: автоответ через OpenAI при наличии OPENAI_API_KEY.
 */
export async function handleInvestorSupportRequest(body) {
  const message = String(body?.message ?? '').trim()
  const email = String(body?.email ?? '').trim()
  const name = String(body?.name ?? '').trim()
  const role = String(body?.role ?? '').trim()

  if (!message) {
    return {
      status: 400,
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({ ok: false, error: 'Введите сообщение' }),
    }
  }

  const key = process.env.OPENAI_API_KEY || ''
  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini'

  if (!key) {
    return {
      status: 200,
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({
        ok: true,
        fallback: true,
        reply: `Здравствуйте${name ? `, ${name}` : ''}! Мы получили ваше обращение${email ? ` (${email})` : ''}${role ? `, роль: ${role}` : ''}.\n\nКратко: вопросы по доступу и интеграциям можно уточнить в разделе «Панель API» или у вашего менеджера. Полный ответ даст оператор в рабочее время.\n\nИИ-автоответчик не настроен: на сервере не задана переменная OPENAI_API_KEY.`,
      }),
    }
  }

  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: 'system',
            content:
              'Ты помощник первой линии техподдержки RedPrice Group для инвесторского веб-портала. Отвечай кратко, вежливо, по делу, на русском языке. Не придумывай точные финансовые цифры и внутренние данные. Если вопрос про пароль — напомни, что смена пароля доступна в меню профиля в правом верхнем углу после входа. Если не хватает данных — предложи написать на корпоративную почту или дождаться оператора.',
          },
          {
            role: 'user',
            content: `Имя: ${name || '—'}\nEmail: ${email || '—'}\nРоль: ${role || '—'}\n\nСообщение пользователя:\n${message}`,
          },
        ],
        max_tokens: 600,
        temperature: 0.35,
      }),
    })

    const data = await res.json()
    if (!res.ok) {
      const errMsg = data?.error?.message || `HTTP ${res.status}`
      throw new Error(errMsg)
    }
    const reply = String(data?.choices?.[0]?.message?.content ?? '').trim()
    return {
      status: 200,
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({
        ok: true,
        fallback: false,
        reply: reply || 'Не удалось сформировать ответ. Оператор свяжется с вами по email.',
      }),
    }
  } catch (err) {
    return {
      status: 200,
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({
        ok: true,
        fallback: true,
        reply: `Не удалось получить ответ ИИ (${err?.message || 'ошибка'}). Ваше обращение учтено; оператор ответит по указанному email.`,
      }),
    }
  }
}
