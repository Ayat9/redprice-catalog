// Данные поставщиков с товарами
export const suppliersData = [
  {
    id: 1,
    name: 'ТОО "TurPlast"',
    address: 'г. Алматы, ул. Абая, 150',
    phone: '+7 (708) 691-02-43',
    email: 'info@turplast.kz',
    website: 'https://turplast.kz',
    logo: null,
    whatsapp: '+77086910243',
    products: [
      {
        name: 'Контейнер DP колёсик',
        description: 'Пластиковый контейнер с колёсиками',
        price: 4500,
        quantityPerBox: 6,
        image: null,
        variants: [
          { volume: '60л', quantityPerBox: 6 },
          { volume: '40л', quantityPerBox: 6 },
          { volume: '30л', quantityPerBox: 6 }
        ]
      },
      {
        name: 'Органайзер заморозки',
        description: 'Контейнер для заморозки продуктов',
        price: 850,
        quantityPerBox: 34,
        image: null,
        variants: [
          { size: '29х20,5х5см', quantityPerBox: 34 }
        ]
      },
      {
        name: 'Для сыпучих 1л',
        description: 'Контейнер для сыпучих продуктов',
        price: 320,
        quantityPerBox: 40,
        image: null
      },
      {
        name: 'Банка',
        description: 'Пластиковая банка',
        price: 280,
        quantityPerBox: 20,
        image: null,
        variants: [
          { volume: '0,5л', quantityPerBox: 20 },
          { volume: '1л', quantityPerBox: 15 }
        ]
      },
      {
        name: 'Савок+веник ORIGINAL',
        description: 'Набор для уборки',
        price: 1200,
        quantityPerBox: 12,
        image: null,
        variants: [
          { color: 'Совок (белый)', quantityPerBox: 12 },
          { color: 'Совок (розовый)', quantityPerBox: 12 },
          { color: 'Совок (серый)', quantityPerBox: 12 }
        ]
      },
      {
        name: 'Таз авал билол',
        description: 'Пластиковый таз овальной формы',
        price: 1800,
        quantityPerBox: 25,
        image: null,
        variants: [
          { volume: '21л', quantityPerBox: 25 },
          { volume: '28л', quantityPerBox: 25 },
          { volume: '40л', quantityPerBox: 25 }
        ]
      },
      {
        name: 'Горшки для цветов',
        description: 'Пластиковые горшки для растений',
        price: 450,
        quantityPerBox: 20,
        image: null,
        variants: [
          { volume: '1,25л', quantityPerBox: 20 },
          { volume: '4л', quantityPerBox: 20 },
          { volume: '8л', quantityPerBox: 20 },
          { volume: '2,5л', quantityPerBox: 20 },
          { volume: '14л', quantityPerBox: 20 },
          { volume: '20л', quantityPerBox: 20 }
        ]
      }
    ]
  },
  {
    id: 2,
    name: 'ТОО "ПластТорг"',
    address: 'г. Астана, пр. Кабанбай батыра, 45',
    phone: '+7 (717) 234-56-78',
    email: 'sales@plasttorg.kz',
    website: 'https://plasttorg.kz',
    logo: null,
    whatsapp: '+77172345678',
    products: [
      {
        name: 'Ведро пластиковое',
        description: 'Пластиковое ведро для хозяйственных нужд',
        price: 650,
        quantityPerBox: 24,
        image: null,
        variants: [
          { volume: '10л', quantityPerBox: 24 },
          { volume: '12л', quantityPerBox: 24 },
          { volume: '15л', quantityPerBox: 20 }
        ]
      },
      {
        name: 'Корзина для белья',
        description: 'Пластиковая корзина для белья',
        price: 2200,
        quantityPerBox: 10,
        image: null,
        variants: [
          { volume: '37л', quantityPerBox: 10 },
          { volume: '55л', quantityPerBox: 10 }
        ]
      },
      {
        name: 'Урна мусорная',
        description: 'Пластиковая урна для мусора',
        price: 1500,
        quantityPerBox: 15,
        image: null,
        variants: [
          { type: 'Круглая', quantityPerBox: 15 },
          { type: 'Квадратная', quantityPerBox: 15 }
        ]
      },
      {
        name: 'Хлебница',
        description: 'Пластиковая хлебница',
        price: 950,
        quantityPerBox: 20,
        image: null
      }
    ]
  },
  {
    id: 3,
    name: 'ИП "БытПласт"',
    address: 'г. Шымкент, ул. Тауке хана, 78',
    phone: '+7 (725) 345-67-89',
    email: 'bytplast@mail.kz',
    website: null,
    logo: null,
    whatsapp: '+77253456789',
    products: [
      {
        name: 'Тазик круглый',
        description: 'Пластиковый тазик круглой формы',
        price: 1200,
        quantityPerBox: 25,
        image: null,
        variants: [
          { volume: '9л', quantityPerBox: 25 },
          { volume: '12л', quantityPerBox: 25 },
          { volume: '16л', quantityPerBox: 25 },
          { volume: '21л', quantityPerBox: 25 }
        ]
      },
      {
        name: 'Кувшин пластиковый',
        description: 'Пластиковый кувшин для воды',
        price: 750,
        quantityPerBox: 18,
        image: null,
        variants: [
          { volume: '2л', quantityPerBox: 18 },
          { volume: '3л', quantityPerBox: 18 }
        ]
      },
      {
        name: 'Поднос',
        description: 'Пластиковый поднос',
        price: 550,
        quantityPerBox: 15,
        image: null,
        variants: [
          { type: 'Глубокий', quantityPerBox: 15 },
          { type: 'Плоский', quantityPerBox: 12 }
        ]
      },
      {
        name: 'Чашка пластиковая',
        description: 'Пластиковая чашка',
        price: 180,
        quantityPerBox: 50,
        image: null
      }
    ]
  },
  {
    id: 4,
    name: 'ТОО "ПластикСервис"',
    address: 'г. Караганда, ул. Бухар жырау, 32',
    phone: '+7 (721) 456-78-90',
    email: 'info@plastikservice.kz',
    website: 'https://plastikservice.kz',
    logo: null,
    whatsapp: '+77214567890',
    products: [
      {
        name: 'Бочка для муки',
        description: 'Пластиковая бочка для хранения муки',
        price: 8500,
        quantityPerBox: 5,
        image: null,
        variants: [
          { volume: '60л', quantityPerBox: 5 },
          { volume: '80л', quantityPerBox: 5 },
          { volume: '120л', quantityPerBox: 5 },
          { volume: '65л', quantityPerBox: 5 },
          { volume: '85л', quantityPerBox: 5 },
          { volume: '110л', quantityPerBox: 5 },
          { volume: '40л', quantityPerBox: 5 },
          { volume: '50л', quantityPerBox: 5 }
        ]
      },
      {
        name: 'Контейнер для сыпучих',
        description: 'Контейнер для хранения сыпучих продуктов',
        price: 420,
        quantityPerBox: 40,
        image: null,
        variants: [
          { volume: '1л', quantityPerBox: 40 },
          { volume: '1,5л', quantityPerBox: 40 },
          { volume: '2л', quantityPerBox: 40 },
          { volume: '2,5л', quantityPerBox: 40 }
        ]
      },
      {
        name: 'Графин',
        description: 'Пластиковый графин',
        price: 680,
        quantityPerBox: 12,
        image: null,
        variants: [
          { volume: '1,5л', quantityPerBox: 12 },
          { volume: '2л', quantityPerBox: 20 }
        ]
      },
      {
        name: 'Мерный кружка',
        description: 'Пластиковая мерная кружка',
        price: 250,
        quantityPerBox: 60,
        image: null,
        variants: [
          { volume: '1л', quantityPerBox: 60 },
          { volume: '2л', quantityPerBox: 30 },
          { volume: '0,5л', quantityPerBox: 80 }
        ]
      }
    ]
  },
  {
    id: 5,
    name: 'ИП "ХозТовары Плюс"',
    address: 'г. Актобе, ул. Айтеке би, 56',
    phone: '+7 (713) 567-89-01',
    email: 'hozplus@mail.kz',
    website: null,
    logo: null,
    whatsapp: '+77135678901',
    products: [
      {
        name: 'Щётка с веником',
        description: 'Щётка с веником для уборки',
        price: 450,
        quantityPerBox: 12,
        image: null
      },
      {
        name: 'Швабра ORIGINAL',
        description: 'Пластиковая швабра',
        price: 1800,
        quantityPerBox: 5,
        image: null
      },
      {
        name: 'Веник щётка',
        description: 'Веник-щётка для уборки',
        price: 380,
        quantityPerBox: 12,
        image: null
      },
      {
        name: 'Щётка для авто',
        description: 'Щётка для мытья автомобиля',
        price: 550,
        quantityPerBox: 24,
        image: null
      },
      {
        name: 'Ковш',
        description: 'Пластиковый ковш',
        price: 320,
        quantityPerBox: 25,
        image: null
      }
    ]
  }
]
