# SEO-оптимизация Redprice.kz

## Что сделано

- **Мета-теги**: title, description, keywords, robots, author, theme-color
- **Open Graph**: для соцсетей и превью в поиске
- **JSON-LD**: Organization и WebSite в `index.html`, ItemList с товарами на главной (до 100 позиций)
- **Динамический title/description** по страницам (Каталог, Отдел закупок)
- **robots.txt**: разрешены `/` и `/zakup`, закрыты `/admin`, указан sitemap
- **sitemap.xml**: главная и раздел закупок
- **Семантика**: один h1 на странице, `role="main"`, скрытый заголовок для каталога

## Что сделать вам

1. **Заменить домен**  
   Домен сайта задан: **https://red-price.kz** (уже прописан в index.html, robots.txt, sitemap.xml).

2. **Яндекс**  
   - Зайдите в [Яндекс.Вебмастер](https://webmaster.yandex.ru), добавьте сайт.  
   - Скопируйте код верификации и вставьте в `index.html` в тег:
     ```html
     <meta name="yandex-verification" content="ВАШ_КОД" />
     ```

3. **Google**  
   - [Google Search Console](https://search.google.com/search-console) → добавьте ресурс.  
   - Подтвердите владение (HTML-тег или файл — при необходимости добавьте тег в `index.html`).

4. **Sitemap**  
   После публикации отправьте в Яндекс.Вебмастер и в Search Console URL вашего sitemap, например:  
   `https://red-price.kz/sitemap.xml`

5. **Контент**  
   Для лучших позиций по запросам товаров добавляйте в админке названия и типы товаров, которые ищут люди (например: «контейнер 60л», «тазик круглый», «органайзер для сыпучих»).
