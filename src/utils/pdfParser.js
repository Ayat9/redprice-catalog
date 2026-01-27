// Утилита для парсинга PDF каталогов
import * as pdfjsLib from 'pdfjs-dist'

// Настройка worker для pdf.js
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`
}

export async function parsePDFCatalog(file) {
  try {
    const arrayBuffer = await file.arrayBuffer()
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
    const products = []
    const allImages = []
    
    // Извлекаем изображения из PDF
    try {
      const extractedImages = await extractImagesFromPDF(file)
      allImages.push(...extractedImages)
    } catch (imgError) {
      console.warn('Could not extract images from PDF:', imgError)
    }
    
    // Парсим все страницы
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum)
      const textContent = await page.getTextContent()
      
      // Извлекаем текст со страницы
      const pageText = textContent.items.map(item => item.str).join(' ')
      
      // Пытаемся найти товары в тексте
      const extractedProducts = extractProductsFromText(pageText, pageNum)
      
      // Пытаемся связать изображения с товарами
      // Упрощенная логика: распределяем изображения по товарам
      if (allImages.length > 0 && extractedProducts.length > 0) {
        const imagesPerProduct = Math.floor(allImages.length / extractedProducts.length)
        extractedProducts.forEach((product, index) => {
          const startIdx = index * imagesPerProduct
          const endIdx = index === extractedProducts.length - 1 
            ? allImages.length 
            : (index + 1) * imagesPerProduct
          product.images = allImages.slice(startIdx, endIdx)
        })
      }
      
      products.push(...extractedProducts)
    }
    
    return { success: true, products }
  } catch (error) {
    console.error('Error parsing PDF:', error)
    return { success: false, error: error.message }
  }
}

function extractProductsFromText(text, pageNum) {
  const products = []
  
  // Улучшенный парсер для каталогов
  // Разбиваем текст на строки
  const lines = text.split(/\n|\r\n/).filter(line => line.trim().length > 0)
  
  let currentProduct = null
  let productLines = []
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    
    // Ищем цену (различные форматы)
    const pricePatterns = [
      /(\d+(?:\s?\d+)*(?:[.,]\d+)?)\s*[₸т]/i,
      /цена[:\s]+(\d+(?:\s?\d+)*(?:[.,]\d+)?)/i,
      /(\d+(?:\s?\d+)*(?:[.,]\d+)?)\s*тенге/i
    ]
    
    let priceMatch = null
    for (const pattern of pricePatterns) {
      priceMatch = line.match(pattern)
      if (priceMatch) break
    }
    
    // Ищем количество в упаковке
    const quantityPatterns = [
      /(\d+)\s*(?:шт|шт\/уп|в упак|шт\.)/i,
      /упак[:\s]+(\d+)/i,
      /в коробке[:\s]+(\d+)/i
    ]
    
    let quantityMatch = null
    for (const pattern of quantityPatterns) {
      quantityMatch = line.match(pattern)
      if (quantityMatch) break
    }
    
    // Ищем объем/размер
    const volumeMatch = line.match(/(\d+(?:[.,]\d+)?)\s*л/i)
    
    if (priceMatch) {
      const price = parseFloat(priceMatch[1].replace(/\s/g, '').replace(',', '.'))
      
      // Если есть текущий товар, завершаем его
      if (currentProduct) {
        if (!currentProduct.price) {
          currentProduct.price = price
        }
        // Сохраняем товар если есть название и цена
        if (currentProduct.name && currentProduct.price) {
          products.push(currentProduct)
        }
      }
      
      // Создаем новый товар
      const prevLine = i > 0 ? lines[i - 1].trim() : ''
      const name = prevLine.length > 5 && !prevLine.match(/\d+[₸т]/) 
        ? prevLine 
        : `Товар ${products.length + 1}`
      
        currentProduct = {
          name: name,
          price: price,
          quantityPerBox: quantityMatch ? parseInt(quantityMatch[1]) : null,
          description: productLines.join(' ').substring(0, 100) || '',
          images: [],
          variants: volumeMatch ? [{ volume: `${volumeMatch[1]}л` }] : null
        }
      productLines = []
    } else if (quantityMatch && currentProduct) {
      currentProduct.quantityPerBox = parseInt(quantityMatch[1])
    } else if (line.length > 5 && line.length < 100) {
      // Возможно, это название товара или описание
      if (!currentProduct && line.match(/^[А-Яа-яЁёA-Za-z]/)) {
        currentProduct = {
          name: line,
          price: null,
          quantityPerBox: null,
          description: '',
          images: [],
          variants: null
        }
        productLines = []
      } else if (currentProduct && !currentProduct.price) {
        productLines.push(line)
      }
    }
  }
  
  // Сохраняем последний товар
  if (currentProduct && currentProduct.name) {
    if (currentProduct.price || currentProduct.name.length > 5) {
      products.push(currentProduct)
    }
  }
  
  // Фильтруем дубликаты и невалидные товары
  const uniqueProducts = []
  const seenNames = new Set()
  
  for (const product of products) {
    if (product.name && product.name.length > 2 && !seenNames.has(product.name.toLowerCase())) {
      seenNames.add(product.name.toLowerCase())
      uniqueProducts.push(product)
    }
  }
  
  return uniqueProducts
}

// Извлечение изображений из PDF
export async function extractImagesFromPDF(file) {
  try {
    const arrayBuffer = await file.arrayBuffer()
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
    const images = []
    
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum)
      const ops = await page.getOperatorList()
      
      // Извлекаем изображения из операторов
      for (let i = 0; i < ops.fnArray.length; i++) {
        if (ops.fnArray[i] === pdfjsLib.OPS.paintImageXObject || 
            ops.fnArray[i] === pdfjsLib.OPS.paintJpegXObject) {
          const imageName = ops.argsArray[i][0]
          try {
            const imageObj = await page.objs.get(imageName)
            if (imageObj && imageObj.data) {
              // Конвертируем в base64
              const base64 = arrayBufferToBase64(imageObj.data)
              images.push(`data:image/jpeg;base64,${base64}`)
            }
          } catch (e) {
            console.warn('Could not extract image:', e)
          }
        }
      }
    }
    
    return images
  } catch (error) {
    console.error('Error extracting images:', error)
    return []
  }
}

function arrayBufferToBase64(buffer) {
  let binary = ''
  const bytes = new Uint8Array(buffer)
  const len = bytes.byteLength
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return window.btoa(binary)
}
