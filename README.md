# Movixy - Your Private Netflix

<p align="center">
  <img src="public/favicon.svg" alt="Movixy Logo" width="64" height="64" />
  <br>
  <a href="https://movixy.app">movixy.app</a>
</p>

Movixy is a modern, Netflix-style streaming interface for your personal media library powered by [Jellyfin](https://jellyfin.org/). Browse your movies, series, and continue watching your content with a beautiful, responsive UI.

![React](https://img.shields.io/badge/React-19-61DAFB?style=flat&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-6-3178C6?style=flat&logo=typescript)
![Vite](https://img.shields.io/badge/Vite-8-646CFF?style=flat&logo=vite)
![License](https://img.shields.io/badge/license-MIT-green)

## Features

- **Library Browsing** - Netflix-style horizontal scroll rows for Movies, Series, and Popular content
- **Hero Section** - Featured content with immersive backdrop images
- **Search** - Real-time search across your entire media library
- **Media Details** - Modal view with synopsis, ratings, and episode list for series
- **Video Player** - HLS streaming with transcoding support and auto-recovery
- **Continue Watching** - Resume playback from where you left off
- **PWA Support** - Install as a desktop or mobile app, works offline
- **Dark Theme** - Cinema-like dark experience

## Requirements

- [Jellyfin Server](https://jellyfin.org/downloads/) (v10.8+)
- A Jellyfin account with access to your media library
- Node.js 18+ and npm

## Quick Start

### 1. Clone and Install

```bash
git clone https://github.com/yourusername/movixy.git
cd movixy
npm install
```

### 2. Configure Environment

Create a `.env` file in the root directory:

```env
VITE_JELLYFIN_URL=http://localhost:8096
VITE_JELLYFIN_API_KEY=your_api_key
VITE_JELLYFIN_USER_ID=your_user_id
```

#### Getting Your Credentials

1. **Jellyfin URL**: The address where your Jellyfin server is running (e.g., `http://192.168.1.100:8096`)

2. **API Key**: 
   - Log into your Jellyfin web interface
   - Go to Dashboard → Advanced → API Keys
   - Create a new API key for Movixy

3. **User ID**:
   - Go to Dashboard → Users
   - Click on your user and copy the User ID from the URL or use the API `/users` endpoint

### 3. Run

```bash
npm run dev
```

Open `http://localhost:5173` in your browser.

### 4. Docker (Optional)

If you don't have Jellyfin running, use the included docker-compose:

```bash
docker-compose up -d
```

This starts Jellyfin at `http://localhost:8096` with default credentials (admin/admin).

## Project Structure

```
src/
├── core/config/           # App configuration
│   └── jellyfin.config.ts
├── domain/               # Business logic layer
│   ├── models/           # TypeScript interfaces
│   └── repositories/     # Repository interfaces
├── data/                 # Data layer
│   ├── sources/          # API clients
│   └── repositories/    # Repository implementations
└── presentation/         # UI layer
    ├── pages/           # Page components
    └── components/     # Reusable components
```

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run lint` | Run ESLint |
| `npm run preview` | Preview production build |

## Tech Stack

- **React 19** - UI Framework
- **TypeScript 6** - Type safety
- **Vite 8** - Build tool
- **CSS Modules** - Scoped styling
- **HLS.js** - Video streaming
- **Jellyfin API** - Media server
- **Vite PWA** - Progressive Web App

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT License - see [LICENSE](LICENSE) for details.

---

Built with ❤️ for private media enthusiasts.