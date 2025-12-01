<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Neon Outrun - CROSS SDK Integration

High-speed cyberpunk racing game with CROSS Wallet integration. Connect your CROSSx wallet and drive at top speed!

## Features

🎮 **Intense Gameplay** - Fast-paced endless runner with obstacles
💰 **Wallet Integration** - CROSS Wallet connection for blockchain features
🎨 **Neon Aesthetic** - Cyberpunk visual style with retro CRT effects
📱 **Multi-Platform** - Works on desktop and mobile

## Run Locally

### Prerequisites
- Node.js 18+
- CROSS Wallet Extension or mobile app

### Setup

1. **Install dependencies:**
   ```bash
   pnpm install
   ```

2. **Set environment variables:**
   Create `.env.local` file in this directory:
   ```
   VITE_PROJECT_ID=0979fd7c92ec3dbd8e78f433c3e5a523
   ```

3. **Run the app:**
   ```bash
   pnpm dev
   ```

4. **Open in browser:**
   ```
   http://localhost:3000
   ```

### How to Play

1. Connect your CROSS Wallet (Extension or QR Code)
2. Click "START ENGINE" to begin
3. Use Arrow Keys or A-D to switch lanes
4. Avoid obstacles and drive as far as possible
5. Check your score on the leaderboard

## Controls

- **Desktop:** Arrow Keys / A-D to switch lanes
- **Mobile:** Tap left/right sides to switch lanes
- **ESC:** Pause during gameplay

## Project Structure

```
├── components/
│   ├── GameCanvas.tsx      # Game rendering and logic
│   ├── MainMenu.tsx        # Menu with wallet connection
│   ├── HUD.tsx            # In-game UI
│   ├── GameOver.tsx       # Game over screen
│   └── PauseMenu.tsx      # Pause screen
├── hooks/
│   └── useWallet.ts       # CROSS Wallet integration hook
├── App.tsx                # Main app component
└── types.ts               # TypeScript type definitions
```

## CROSS SDK Integration

This example demonstrates:
- ✅ CROSS Wallet connection (Extension + QR Code)
- ✅ Account information display
- ✅ Dynamic metadata
- ✅ SIWE authentication (optional)
- ✅ Web3 integration patterns

## Resources

- [CROSS SDK Documentation](https://docs.to.nexus)
- [CROSS Wallet](https://wallet.to.nexus)
- [GitHub Repository](https://github.com/to-nexus/cross-sdk-js)
