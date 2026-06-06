# Xplore - Talk to Strangers

A minimalist, anonymous video and text chat application — an Omegle-inspired clone built with Next.js, WebRTC, and Socket.io.

## Features

- **Anonymous video chat** with random strangers via WebRTC peer-to-peer connections
- **Real-time text chat** powered by Socket.io
- **Responsive UI** that works on desktop and mobile devices
- **Dark / Light theme** toggle support
- **Media controls** — mute/unmute audio, toggle video on/off
- **Skip and find a new partner** instantly
- **Built with modern stack**: Next.js, React, TypeScript, Tailwind CSS

## Tech Stack

| Technology | Purpose |
|-----------|---------|
| [Next.js](https://nextjs.org/) | React framework (frontend) |
| [React](https://react.dev/) | UI library |
| [TypeScript](https://www.typescriptlang.org/) | Type safety |
| [Tailwind CSS](https://tailwindcss.com/) | Styling |
| [Socket.io](https://socket.io/) | Real-time signaling and messaging |
| [WebRTC](https://webrtc.org/) | Peer-to-peer video/audio streaming |
| [Express](https://expressjs.com/) | WebSocket signaling server |
| [Lucide React](https://lucide.dev/) | Icons |

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18+)
- [Bun](https://bun.sh/) or npm/yarn/pnpm

### Install dependencies

```bash
bun install
```

### Run the app

Start the Next.js development server:

```bash
bun run dev
```

Start the Socket.io signaling server (in a new terminal):

```bash
bun run socket
```

Open [http://localhost:3000](http://localhost:3000) with your browser.

## Development

### Scripts

| Command | Description |
|---------|-------------|
| `bun run dev` | Start Next.js dev server |
| `bun run build` | Build for production |
| `bun run start` | Start production server |
| `bun run lint` | Run ESLint |
| `bun run socket` | Start WebSocket signaling server |

### Environment Variables

Create a `.env.local` file:

```env
NEXT_PUBLIC_SOCKET_URL=http://localhost:8080
```

## Architecture

```
app/
├── page.tsx        # Landing page
├── chat/
│   └── page.tsx    # Video chat room
├── layout.tsx      # Root layout with theme provider
└── globals.css     # Global styles
components/
├── theme-provider.tsx  # Dark / Light mode context
└── theme-toggle.tsx    # Theme toggle button
server.js           # Express + Socket.io signaling server
```

### How it works

1. User opens `/chat` and grants camera/microphone permissions
2. The frontend connects to the Socket.io signaling server
3. Server pairs two waiting users into a room
4. Peers exchange WebRTC offers/answers/ICE candidates via Socket.io
5. Once connected, video/audio streams flow peer-to-peer
6. Text messages are relayed through the Socket.io server

## Deployment

This app consists of two parts:

1. **Next.js frontend** — deploy to Vercel, Netlify, or similar
2. **Socket.io server** — deploy to Railway, Render, Fly.io, or a VPS

Set `NEXT_PUBLIC_SOCKET_URL` to point to your deployed backend.

## License

MIT
