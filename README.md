# Hotel Oasis Modern Website

Modern React + Vite frontend for Hotel Oasis with:

- Home, Rooms, Gallery, About, Contact sections
- Room-specific booking forms with dynamic guest ranges and real-time price calculation
- English/Hindi toggle using JSON translations
- Contact + booking submission via EmailJS (with mailto fallback)
- WhatsApp floating action button

## Development

```bash
npm install
npm run dev
```

## Build & Lint

```bash
npm run lint
npm run build
```

## EmailJS Configuration

Add environment variables in a `.env` file:

```bash
VITE_EMAILJS_SERVICE_ID=your_service_id
VITE_EMAILJS_TEMPLATE_ID=your_template_id
VITE_EMAILJS_PUBLIC_KEY=your_public_key
```

If these values are not set, forms open the default mail client with a prefilled email to:
`marediasalman0@gmail.com`.
