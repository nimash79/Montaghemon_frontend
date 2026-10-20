# Montaghemon Frontend

The frontend application for **Montaghemon**, a room-based music streaming and real-time audio communication platform.

Built with React and Vite, the application provides a user interface for synchronized music playback, browsing rooms, viewing currently playing tracks, and participating in shared audio rooms. It also includes administrative interfaces for managing tracks, singers, and rooms.

## Overview

Montaghemon combines scheduled music playback with room-based listening and real-time communication.

The frontend connects to the Montaghemon backend through REST APIs and WebSockets. It receives playback schedules, synchronizes its clock with the server, streams HLS audio, and updates the interface in response to room and playback events.

The project also contains an administrative section for managing the platform's music library and rooms.

## Key Features

### Music Streaming

- Play scheduled music using an HLS-compatible media player.
- Display track names, singer information, thumbnails, and playback progress.
- Synchronize playback with the backend's server-side schedule.
- Display playback status and streaming quality information.
- Use server-clock synchronization to reduce timing differences between clients.
- Support play and pause interactions.

### Room Discovery

- Browse available rooms.
- Search rooms by name or city.
- Display room logos and membership counts.
- Open individual room pages.
- View room-specific playback information.

### Shared Listening and Room Interaction

- Join and leave rooms.
- Receive room membership updates in real time.
- Synchronize playback state with other connected users.
- Interact with shared playback controls.
- Participate in microphone audio communication through mediasoup-client and WebRTC.
- Receive room-related updates through WebSockets.

### Administration

The frontend includes dedicated administrative pages for:

- Adding tracks.
- Viewing and editing tracks.
- Adding singers.
- Creating rooms.

These pages communicate with the backend's administrative APIs.

### User Experience

- Responsive, component-based React interface.
- Client-side navigation with React Router.
- Loading indicators and toast notifications.
- Playback status indicators and progress displays.
- User guidance and offline-related pages.
- Screen wake-lock support during playback where the browser supports it.

## Technology Stack

| Technology | Purpose |
|---|---|
| React 18 | User interface |
| Vite | Development server and production build |
| JavaScript ES modules | Application logic |
| React Router | Client-side navigation |
| Axios | HTTP requests |
| hls.js | HLS playback support |
| mediasoup-client | WebRTC audio communication |
| WebSockets | Real-time communication |
| Framer Motion | UI animation |
| Swiper | Interactive content components |
| React Toastify | Notifications |
| react-spinners | Loading indicators |
| vite-plugin-pwa | Progressive Web App support |

## Application Pages

The application defines the following primary routes:

| Route | Description |
|---|---|
| `/` | Main synchronized music player |
| `/offline` | Offline-related page |
| `/rooms` | Browse and search available rooms |
| `/room/:roomId` | Room playback and real-time interaction |
| `/player/:roomId` | Dedicated player page |
| `/add-track` | Administrative track creation |
| `/tracks` | Track management |
| `/edit-track/:id` | Edit a track |
| `/add-singer` | Add a singer |
| `/add-room` | Create a room |

## How It Works

The frontend follows a client-server architecture.

1. **Connect:** The application establishes a WebSocket connection to the backend.
2. **Retrieve data:** REST APIs provide rooms, tracks, singers, categories, and other application data.
3. **Synchronize time:** The client exchanges time-ping messages with the server to estimate clock offset.
4. **Receive schedules:** The backend sends the current playback schedule and subsequent updates.
5. **Play media:** The frontend uses HLS playback to stream the scheduled track.
6. **Update the interface:** Track metadata, progress, connection state, and playback status are reflected in the UI.
7. **Join a room:** Room-specific WebSocket messages coordinate membership, playback events, and microphone communication.

The clock synchronization and scheduled playback logic are designed to help different clients follow a shared playback timeline.

## Project Structure

```text
Montaghemon_frontend/
├── public/                    # Static public assets
├── src/
│   ├── api/                   # API clients
│   ├── components/            # Reusable UI components
│   ├── layouts/               # Main and admin layouts
│   ├── pages/                 # Application pages
│   │   └── admin/              # Administrative pages
│   ├── lib/                   # Shared utilities and constants
│   ├── sync/                  # Clock synchronization and HLS player
│   ├── ws/                    # WebSocket connection management
│   ├── App.jsx                # Application routes
│   └── ...
├── index.html
├── package.json
├── vite.config.js
└── ...
```

The `src/` directory separates the user interface, networking, synchronization logic, and page-specific functionality.

## Getting Started

### Prerequisites

- Node.js and npm.
- A running instance of the [Montaghemon backend](https://github.com/nimash79/Montaghemon_backend).
- A browser that supports the media playback and WebRTC features you intend to use.

### Installation

Clone the repository:

```bash
git clone https://github.com/nimash79/Montaghemon_frontend.git
cd Montaghemon_frontend
```

Install dependencies:

```bash
npm install
```

### Environment Configuration

The frontend uses Vite environment variables to configure the backend connection.

Create a local `.env` file with the following settings:

```dotenv
VITE_API_URL=http://localhost:8080/api
VITE_WS_HOST=localhost:8080
```

Adjust these values to match your backend deployment.

- `VITE_API_URL` specifies the base URL used for HTTP API requests.
- `VITE_WS_HOST` specifies the WebSocket host used by the application.

The main playback interface constructs its WebSocket URL using the current page's protocol and the configured host. Ensure that your backend and reverse proxy are configured to expose the corresponding WebSocket route.

**Security note:** Vite exposes variables prefixed with `VITE_` to client-side code. Never store private API keys, server credentials, or other secrets in these variables. Administrative authorization should be enforced by the backend, not by hiding values in the frontend.

### Start the Development Server

```bash
npm run dev
```

Vite starts the development server and makes it accessible on the host interface.

Open the local URL printed in the terminal to access the application.

### Create a Production Build

```bash
npm run build
```

The production build is generated in the `dist/` directory.

To preview the generated build locally:

```bash
npm run preview
```

For deployment, serve the contents of `dist/` using a static web server or hosting provider and configure client-side route fallback as required by the hosting environment.

## Backend Integration

The frontend depends on the companion backend for application data, playback scheduling, streaming media, and room communication.

**Backend repository:** [nimash79/Montaghemon_backend](https://github.com/nimash79/Montaghemon_backend)

The backend provides:

- REST APIs for rooms, tracks, singers, and categories.
- WebSocket events for playback synchronization and room interaction.
- HLS streams and associated media assets.
- WebRTC microphone transport negotiation.

For local development, ensure the configured API and WebSocket hosts point to the same backend instance.

## Production Deployment

When deploying the frontend:

- Set `VITE_API_URL` and `VITE_WS_HOST` to the appropriate production endpoints before building.
- Use HTTPS and secure WebSockets in production.
- Configure the reverse proxy to support API requests, WebSocket upgrades, and media delivery.
- Ensure browser routing works for direct navigation to nested routes.
- Confirm that the backend's HLS URLs are accessible from the deployed frontend.
- Test microphone permissions, WebRTC connectivity, and audio playback on target browsers and devices.

Vite environment variables are resolved at build time, so changing the environment after generating the production bundle will not automatically update the built application.

## Related Repository

This repository is the client application for Montaghemon. The backend is maintained separately:

- **Frontend:** [Montaghemon_frontend](https://github.com/nimash79/Montaghemon_frontend)
- **Backend:** [Montaghemon_backend](https://github.com/nimash79/Montaghemon_backend)

## License

Check the repository's license file for the applicable license and distribution terms.

## Author

**Nima Sharifinia**

- GitHub: [@nimash79](https://github.com/nimash79)

---

*Montaghemon Frontend delivers the user-facing experience for synchronized music playback, shared rooms, and real-time audio communication.*
