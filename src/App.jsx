import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import emailjs from '@emailjs/browser'
import en from './i18n/en.json'
import hi from './i18n/hi.json'

const TRANSLATIONS = { en, hi }

const HOTEL_INFO = {
  about:
    "Welcome to Hotel Oasis... Hotel Oasis founded in 1985, ideally located in the heart of Mumbai city, the commercial capital of India. You'll find everything more than your expectations. All rooms are well designed with vibrant colours and furniture. A perfect place for relaxation in luxury. Hotel Oasis has evolved over time to cater to global and domestic travellers while maintaining affordability.",
  contact: {
    tel: '+91-22-3022 7886 / 2269 7887',
    fax: '+91-22-2269 7889',
    cell: '+91-82864 70877',
    emails: ['info@hoteloasisindia.in', 'hoteloasismumbai@gmail.com'],
    address: '276, Shaheed Bhagat Singh Road, Near GPO, Fort, Mumbai – 400001',
    website: 'http://www.hoteloasisindia.in',
  },
}

const ROOM_TYPES = [
  {
    id: 'economy-ac',
    title: 'Economy A/C',
    displayPrices: 'Single ₹1900',
    basePrice: 1900,
    baseGuests: 1,
    maxGuests: 3,
    extraCharge: 500,
    image:
      'https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'standard-non-ac',
    title: 'Standard Non A/C',
    displayPrices: 'Double ₹1900',
    basePrice: 1900,
    baseGuests: 2,
    maxGuests: 4,
    extraCharge: 400,
    image:
      'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'deluxe-ac',
    title: 'Deluxe A/C',
    displayPrices: 'Single ₹2200 / Double ₹2500',
    basePrice: 2500,
    baseGuests: 2,
    maxGuests: 4,
    extraCharge: 500,
    image:
      'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'executive-ac',
    title: 'Executive A/C',
    displayPrices: 'Single ₹3000 / Double ₹3200 / Triple ₹3700',
    basePrice: 3700,
    baseGuests: 3,
    maxGuests: 5,
    extraCharge: 500,
    image:
      'https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=1200&q=80',
  },
]

const GALLERY_IMAGES = [
  'https://images.unsplash.com/photo-1468824357306-a439d58ccb1c?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1595576508898-0ad5c879a061?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1445019980597-93fa8acb246c?auto=format&fit=crop&w=1200&q=80',
]

const NEARBY = [
  {
    name: 'Gateway of India',
    img: 'https://images.unsplash.com/photo-1595658658481-d53d3f999875?auto=format&fit=crop&w=1200&q=80',
  },
  {
    name: 'Marine Drive',
    img: 'https://images.unsplash.com/photo-1526481280695-3c4694f38f20?auto=format&fit=crop&w=1200&q=80',
  },
  {
    name: 'CST Railway Station',
    img: 'https://images.unsplash.com/photo-1627308595229-7830a5c91f9f?auto=format&fit=crop&w=1200&q=80',
  },
]

const FACILITIES = [
  '24 Hour Room Service',
  'Luggage Room',
  'Laundry Service',
  'Free WiFi',
  'Cable TV',
  'Currency Exchange',
  'Doctor on Call',
  'Car Rentals',
  'Travel Arrangements',
  'Airport Pickup & Drop',
]

const RATE_LIMIT_KEY = 'hotel_oasis_submissions'
const MotionArticle = motion.article
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PHONE_REGEX = /^\+\d{10,15}$/

const todayISO = () => new Date().toISOString().split('T')[0]

const escapeHtml = (value) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')

const checkRateLimit = () => {
  const now = Date.now()
  const oneMinuteAgo = now - 60_000
  const saved = JSON.parse(localStorage.getItem(RATE_LIMIT_KEY) || '[]')
  const fresh = saved.filter((ts) => Number.isFinite(ts) && ts > oneMinuteAgo)
  if (fresh.length >= 3) {
    localStorage.setItem(RATE_LIMIT_KEY, JSON.stringify(fresh))
    return false
  }
  fresh.push(now)
  localStorage.setItem(RATE_LIMIT_KEY, JSON.stringify(fresh))
  return true
}

const buildEmailBody = (payload) =>
  [
    `Name: ${escapeHtml(payload.name)}`,
    `Email: ${escapeHtml(payload.email)}`,
    `Phone: ${escapeHtml(payload.phone)}`,
    `Room Type: ${escapeHtml(payload.roomType || 'General Inquiry')}`,
    `Guests: ${escapeHtml(payload.guests || '-')}`,
    `Arrival Date: ${escapeHtml(payload.arrivalDate || '-')}`,
    `Departure Date: ${escapeHtml(payload.departureDate || '-')}`,
    `Total Price: ${escapeHtml(payload.totalPrice || '-')}`,
    `Message: ${escapeHtml(payload.message || '-')}`,
  ].join('\n')

const fallbackMailto = (payload, t) => {
  const subject = encodeURIComponent(t.newInquirySubject)
  const body = encodeURIComponent(buildEmailBody(payload))
  window.location.href = `mailto:marediasalman0@gmail.com?subject=${subject}&body=${body}`
}

function ImageCard({ src, alt, className }) {
  const [loaded, setLoaded] = useState(false)

  return (
    <div className={`image-shell ${className ?? ''}`}>
      {!loaded ? <div className="skeleton" aria-hidden="true" /> : null}
      <img
        src={src}
        alt={alt}
        loading="lazy"
        onLoad={() => setLoaded(true)}
        className={loaded ? 'loaded' : 'hidden'}
      />
    </div>
  )
}

function RoomCard({ room, t }) {
  const [open, setOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [status, setStatus] = useState('idle')
  const [errors, setErrors] = useState({})
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    guests: String(room.baseGuests),
    arrivalDate: '',
    departureDate: '',
    message: '',
    company: '',
  })

  const guests = Number(form.guests)
  const extraGuests = Math.max(0, guests - room.baseGuests)
  const totalPrice = room.basePrice + extraGuests * room.extraCharge

  const guestOptions = useMemo(
    () =>
      Array.from({ length: room.maxGuests - room.baseGuests + 1 }, (_, index) =>
        String(room.baseGuests + index),
      ),
    [room.baseGuests, room.maxGuests],
  )

  const validate = () => {
    const nextErrors = {}
    if (!form.name.trim()) nextErrors.name = 'Name is required.'
    if (!EMAIL_REGEX.test(form.email)) nextErrors.email = 'Enter a valid email.'
    if (!PHONE_REGEX.test(form.phone)) nextErrors.phone = 'Use +countrycode format, e.g. +919876543210.'
    if (!form.arrivalDate) nextErrors.arrivalDate = 'Arrival date is required.'
    if (!form.departureDate) nextErrors.departureDate = 'Departure date is required.'

    const minDate = todayISO()
    if (form.arrivalDate && form.arrivalDate < minDate) {
      nextErrors.arrivalDate = 'Arrival date cannot be in the past.'
    }
    if (form.arrivalDate && form.departureDate && form.departureDate <= form.arrivalDate) {
      nextErrors.departureDate = 'Departure must be after arrival.'
    }
    if (form.company) nextErrors.company = 'Spam detected.'

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setStatus('idle')
    if (!validate()) return

    if (!checkRateLimit()) {
      setStatus('rate_limited')
      return
    }

    const payload = {
      ...form,
      roomType: room.title,
      totalPrice: `₹${totalPrice}`,
    }

    setSubmitting(true)
    try {
      const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID
      const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID
      const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY
      if (serviceId && templateId && publicKey) {
        await emailjs.send(
          serviceId,
          templateId,
          {
            to_email: 'marediasalman0@gmail.com',
            subject: t.newInquirySubject,
            message: buildEmailBody(payload),
          },
          { publicKey },
        )
      } else {
        fallbackMailto(payload, t)
      }
      setStatus('success')
      setForm({
        name: '',
        email: '',
        phone: '',
        guests: String(room.baseGuests),
        arrivalDate: '',
        departureDate: '',
        message: '',
        company: '',
      })
      setErrors({})
    } catch {
      setStatus('network_error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <MotionArticle
      className="room-card"
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4 }}
    >
      <ImageCard src={room.image} alt={room.title} />
      <h3>{room.title}</h3>
      <p>{room.displayPrices}</p>
      <p>Capacity: {room.baseGuests} to {room.maxGuests} guests</p>
      <div className="price-box" aria-live="polite">
        <p>Room Price: ₹{room.basePrice}</p>
        <p>Extra Guest: ₹{room.extraCharge}</p>
        <motion.p key={totalPrice} initial={{ scale: 1.04 }} animate={{ scale: 1 }}>
          Total Price: ₹{totalPrice}
        </motion.p>
      </div>
      <button type="button" className="btn" onClick={() => setOpen((prev) => !prev)}>
        {t.bookRoom}
      </button>

      {open ? (
        <form className="form" onSubmit={handleSubmit} noValidate>
          <label>
            Name *
            <input
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              required
            />
            {errors.name ? <small>{errors.name}</small> : null}
          </label>
          <label>
            Email *
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
              required
            />
            {errors.email ? <small>{errors.email}</small> : null}
          </label>
          <label>
            Phone *
            <input
              value={form.phone}
              onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
              placeholder="+919876543210"
              required
            />
            {errors.phone ? <small>{errors.phone}</small> : null}
          </label>
          <label>
            Guests
            <select
              value={form.guests}
              onChange={(e) => setForm((prev) => ({ ...prev, guests: e.target.value }))}
            >
              {guestOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
          <label>
            Arrival Date *
            <input
              type="date"
              value={form.arrivalDate}
              min={todayISO()}
              onChange={(e) => setForm((prev) => ({ ...prev, arrivalDate: e.target.value }))}
              required
            />
            {errors.arrivalDate ? <small>{errors.arrivalDate}</small> : null}
          </label>
          <label>
            Departure Date *
            <input
              type="date"
              value={form.departureDate}
              min={form.arrivalDate || todayISO()}
              onChange={(e) => setForm((prev) => ({ ...prev, departureDate: e.target.value }))}
              required
            />
            {errors.departureDate ? <small>{errors.departureDate}</small> : null}
          </label>
          <label>
            Message
            <textarea
              value={form.message}
              onChange={(e) => setForm((prev) => ({ ...prev, message: e.target.value }))}
              rows={3}
            />
          </label>
          <label className="honeypot" aria-hidden="true">
            Company
            <input
              tabIndex={-1}
              autoComplete="off"
              value={form.company}
              onChange={(e) => setForm((prev) => ({ ...prev, company: e.target.value }))}
            />
          </label>
          {status === 'rate_limited' ? <small>Max 3 submissions per minute reached.</small> : null}
          {status === 'network_error' ? <small>Could not submit due to network error.</small> : null}
          {status === 'success' ? <small>Booking request sent successfully.</small> : null}
          <button type="submit" className="btn" disabled={submitting}>
            {submitting ? 'Sending...' : t.submitBooking}
          </button>
        </form>
      ) : null}
    </MotionArticle>
  )
}

function ContactForm({ t }) {
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    message: '',
    company: '',
  })
  const [status, setStatus] = useState('idle')
  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState({})

  const validate = () => {
    const nextErrors = {}
    if (!form.name.trim()) nextErrors.name = 'Name is required.'
    if (!EMAIL_REGEX.test(form.email)) nextErrors.email = 'Enter a valid email.'
    if (!PHONE_REGEX.test(form.phone)) nextErrors.phone = 'Use +countrycode format, e.g. +919876543210.'
    if (!form.message.trim()) nextErrors.message = 'Message is required.'
    if (form.company) nextErrors.company = 'Spam detected.'
    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setStatus('idle')

    if (!validate()) return
    if (!checkRateLimit()) {
      setStatus('rate_limited')
      return
    }

    const payload = {
      ...form,
      roomType: '-',
      guests: '-',
      arrivalDate: '-',
      departureDate: '-',
      totalPrice: '-',
    }

    setSubmitting(true)
    try {
      const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID
      const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID
      const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY
      if (serviceId && templateId && publicKey) {
        await emailjs.send(
          serviceId,
          templateId,
          {
            to_email: 'marediasalman0@gmail.com',
            subject: t.newInquirySubject,
            message: buildEmailBody(payload),
          },
          { publicKey },
        )
      } else {
        fallbackMailto(payload, t)
      }
      setStatus('success')
      setForm({ name: '', email: '', phone: '', message: '', company: '' })
      setErrors({})
    } catch {
      setStatus('network_error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form className="form" onSubmit={handleSubmit} noValidate>
      <label>
        Name *
        <input
          value={form.name}
          onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
          required
        />
        {errors.name ? <small>{errors.name}</small> : null}
      </label>
      <label>
        Email *
        <input
          type="email"
          value={form.email}
          onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
          required
        />
        {errors.email ? <small>{errors.email}</small> : null}
      </label>
      <label>
        Phone *
        <input
          value={form.phone}
          onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
          placeholder="+919876543210"
          required
        />
        {errors.phone ? <small>{errors.phone}</small> : null}
      </label>
      <label>
        Message *
        <textarea
          rows={4}
          value={form.message}
          onChange={(e) => setForm((prev) => ({ ...prev, message: e.target.value }))}
          required
        />
        {errors.message ? <small>{errors.message}</small> : null}
      </label>
      <label className="honeypot" aria-hidden="true">
        Company
        <input
          tabIndex={-1}
          autoComplete="off"
          value={form.company}
          onChange={(e) => setForm((prev) => ({ ...prev, company: e.target.value }))}
        />
      </label>
      {status === 'rate_limited' ? <small>Max 3 submissions per minute reached.</small> : null}
      {status === 'network_error' ? <small>Could not submit due to network error.</small> : null}
      {status === 'success' ? <small>Message sent successfully.</small> : null}
      <button type="submit" className="btn" disabled={submitting}>
        {submitting ? 'Sending...' : t.sendMessage}
      </button>
    </form>
  )
}

function App() {
  const [language, setLanguage] = useState('en')
  const [lightbox, setLightbox] = useState(null)
  const t = TRANSLATIONS[language]

  return (
    <div className="site">
      <header className="hero-section" id="home">
        <nav className="navbar" aria-label="Main">
          <a href="#home">Hotel Oasis</a>
          <div className="nav-links">
            <a href="#rooms">{t.rooms}</a>
            <a href="#gallery">{t.gallery}</a>
            <a href="#about">{t.about}</a>
            <a href="#contact">{t.contact}</a>
            <button
              type="button"
              className="lang-btn"
              onClick={() => setLanguage((prev) => (prev === 'en' ? 'hi' : 'en'))}
              aria-label="Toggle language"
            >
              {t.lang}
            </button>
          </div>
        </nav>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="hero-content"
        >
          <h1>{t.welcome}</h1>
          <p>{t.tagline}</p>
          <div className="cta-row">
            <a className="btn" href="#rooms">{t.viewRooms}</a>
            <a className="btn" href="#rooms">{t.bookNow}</a>
            <a className="btn" href="#contact">{t.contactUs}</a>
          </div>
          <div className="highlights">
            <span>32 Rooms</span>
            <span>Free WiFi</span>
            <span>24/7 Service</span>
            <span>Prime Location</span>
          </div>
        </motion.div>
      </header>

      <main>
        <section className="section" id="nearby">
          <h2>{t.nearby}</h2>
          <div className="grid three">
            {NEARBY.map((place) => (
              <motion.article
                key={place.name}
                className="place-card"
                whileHover={{ scale: 1.02 }}
                transition={{ type: 'spring', stiffness: 220, damping: 18 }}
              >
                <ImageCard src={place.img} alt={place.name} />
                <h3>{place.name}</h3>
                <a className="btn" href="https://www.google.com/maps" target="_blank" rel="noreferrer">
                  {t.exploreNearby}
                </a>
              </motion.article>
            ))}
          </div>
        </section>

        <section className="section" id="rooms">
          <h2>{t.rooms}</h2>
          <p className="muted">Fully Air-Conditioned Rooms Available • Free WiFi Internet • Cable TV with Satellite Channels • Intercom Facility • 24/7 Room Service</p>
          <div className="grid two">
            {ROOM_TYPES.map((room) => (
              <RoomCard key={room.id} room={room} t={t} />
            ))}
          </div>
        </section>

        <section className="section" id="gallery">
          <h2>{t.gallery}</h2>
          <div className="grid three">
            {GALLERY_IMAGES.map((src, idx) => (
              <button
                type="button"
                key={src}
                className="gallery-btn"
                onClick={() => setLightbox({ src, idx })}
                aria-label={`Preview image ${idx + 1}`}
              >
                <ImageCard src={src} alt={`Hotel gallery ${idx + 1}`} />
              </button>
            ))}
          </div>
        </section>

        <section className="section" id="about">
          <h2>{t.about}</h2>
          <p>{HOTEL_INFO.about}</p>
          <div className="timeline">Founded 1985</div>
          <h3>Facilities</h3>
          <ul className="facilities">
            {FACILITIES.map((facility) => (
              <li key={facility}>{facility}</li>
            ))}
          </ul>
          <h3>Policies</h3>
          <ul className="facilities">
            <li>Checkout Time: 12 Noon</li>
            <li>Complimentary Breakfast: 8:30 AM – 10:30 AM</li>
            <li>Taxes applicable</li>
            <li>Rates subject to change</li>
            <li>Late checkout on request</li>
          </ul>
        </section>

        <section className="section" id="contact">
          <h2>{t.contactUs}</h2>
          <p>Tel: {HOTEL_INFO.contact.tel}</p>
          <p>Fax: {HOTEL_INFO.contact.fax}</p>
          <p>Cell: {HOTEL_INFO.contact.cell}</p>
          <p>Email: {HOTEL_INFO.contact.emails.join(' / ')}</p>
          <p>Address: {HOTEL_INFO.contact.address}</p>
          <p>
            Website:{' '}
            <a href={HOTEL_INFO.contact.website} target="_blank" rel="noreferrer">
              {HOTEL_INFO.contact.website}
            </a>
          </p>
          <ContactForm t={t} />
        </section>
      </main>

      <a
        href="https://wa.me/919999999999?text=Hello,%20I%20want%20to%20book%20a%20room%20at%20Hotel%20Oasis"
        target="_blank"
        rel="noreferrer"
        className="whatsapp"
        aria-label="Chat on WhatsApp"
      >
        WhatsApp
      </a>

      {lightbox ? (
        <button
          type="button"
          className="lightbox"
          onClick={() => setLightbox(null)}
          aria-label="Close image preview"
        >
          <img src={lightbox.src} alt={`Lightbox ${lightbox.idx + 1}`} />
        </button>
      ) : null}
    </div>
  )
}

export default App
