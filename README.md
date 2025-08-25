# DineLink - Hong Kong Group Dining Coordinator

<div align="center">
<h1>🥢 DineLink</h1>
<h3>Hong Kong's Smartest Group Dining Coordinator</h3>
<p><em>Built with Cultural Intelligence • Mobile-First PWA • Traditional Chinese Support</em></p>
</div>
<p align="center">
<a href="https://discord.gg/NJNbafHNQC">
<img src="https://img.shields.io/badge/Discord-Join%20Community-7289da?style=flat&logo=discord&logoColor=white" alt="Join Discord Community">
</a>
<a href="https://opactor.ai">
<img src="https://img.shields.io/badge/OPACTOR-Website-000000?style=flat&logo=web&logoColor=white" alt="OPACTOR Website">
</a>
<a href="https://twitter.com/aaron_xong">
<img src="https://img.shields.io/badge/Follow-@aaron__xong-000000?style=flat&logo=x&logoColor=white" alt="Follow Aaron">
</a>
</p>

## What is DineLink?

DineLink is Hong Kong's first culturally intelligent group dining coordination platform. Built as a mobile-first Progressive Web App (PWA), it solves the unique challenges of coordinating group meals in Hong Kong's dining culture - from hierarchy-aware interactions to transparent cost splitting with face-saving mechanisms.

**Key Innovations:**
- 🧠 **Cultural Intelligence**: First app to understand Hong Kong hierarchy dynamics and dining etiquette
- 💰 **Transparent Cost Splitting**: Real-time cost calculation with cultural sensitivity 
- 🌏 **Bilingual Experience**: Seamless Traditional Chinese and English interface
- 📱 **Mobile-First PWA**: Optimized for Hong Kong's mobile lifestyle and MTR usage
- 🥢 **Local Focus**: Hong Kong restaurant integration with cultural dining recommendations

Perfect for coordinating team dinners, family gatherings, birthday celebrations, and business meals with proper cultural respect and financial transparency. 

## Features

### 🚀 **Core Functionality**
- **Smart Authentication**: Hong Kong phone verification (+852) with SMS integration
- **Cultural Dashboard**: Personalized experience based on language and cultural preferences  
- **Event Coordination**: Create and manage group dining events with cultural awareness
- **Restaurant Discovery**: Explore Hong Kong restaurants with cultural recommendations
- **Bilingual Interface**: Seamless Traditional Chinese and English switching

### 🏗️ **Technical Excellence**
- **Progressive Web App**: Installable on mobile devices with offline functionality
- **Mobile-First Design**: Optimized for Hong Kong's mobile-centric lifestyle
- **Cultural Intelligence**: Built-in understanding of Hong Kong dining etiquette
- **Real-time Updates**: Live synchronization for group coordination
- **Offline Support**: Continue using core features without internet connection

### 🎯 **Hong Kong Optimizations**
- **MTR-Friendly**: One-handed operation optimized for subway usage
- **Local Payment Methods**: Integration ready for FPS, PayMe, Alipay HK
- **Cultural Hierarchy**: Respectful handling of social dynamics in group dining
- **Traditional Chinese**: Full support for Hong Kong's preferred language variant

## Technology Stack

### **Frontend**
- **Next.js 14**: React framework with App Router for optimal performance
- **TypeScript**: Type-safe development for reliability
- **Tailwind CSS**: Utility-first CSS for rapid UI development
- **Framer Motion**: Smooth animations and cultural micro-interactions
- **Lucide React**: Beautiful icons optimized for mobile interfaces

### **PWA & Mobile**
- **Service Worker**: Offline functionality and background sync
- **Web App Manifest**: Native app-like installation experience
- **Touch Optimizations**: Gesture-based navigation and interactions
- **Responsive Design**: Mobile-first approach with Hong Kong screen sizes

### **Cultural Intelligence**
- **Bilingual System**: Traditional Chinese and English with auto-detection
- **Cultural Framework**: Built-in Hong Kong dining etiquette and hierarchy awareness
- **Local Integrations**: Ready for Hong Kong payment methods and services

## Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js 18+**: Runtime for the Next.js application
- **Python 3.10+**: Backend API services
- **Git**: Version control
- **Mobile device/browser**: For testing PWA features

## Quick Start

Get DineLink running on your local machine in minutes:

```bash
# Clone the repository
git clone https://github.com/YOUR-USERNAME/DineLink-HK.git
cd DineLink-HK

# Install all dependencies (Node.js and Python)
npm install

# Start development servers
npm run dev
```

Your DineLink application will be available at:
- **Frontend**: http://localhost:3000 (or next available port)
- **API Server**: http://localhost:8080  
- **API Documentation**: http://localhost:8080/docs

### 📱 **Demo the Cultural Features:**
1. Open the app in your mobile browser
2. Click **"Get Started"** to begin authentication
3. Enter any 8-digit Hong Kong phone: `12345678`
4. Use verification code: **`123456`**
5. Complete profile setup
6. Experience the bilingual, culturally-aware interface!

**Note**: Ports are automatically detected. If default ports are busy, the next available ports will be assigned.

## Setup

### Manual Setup
You can also manually setup the project.
```bash
# Frontend setup
cd apps/web
npm install

# Backend setup
cd ../api
python3 -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

The `npm install` command automatically handles the complete setup:

1. **Port Configuration**: Detects available ports and creates `.env` files
2. **Node.js Dependencies**: Installs packages including workspace dependencies
3. **Python Environment**: Creates virtual environment in `apps/api/.venv`
4. **Python Dependencies**: Installs packages using `uv` (if available) or `pip`
5. **Database Setup**: SQLite database auto-creates at `data/cc.db` on first run

### Additional Commands
```bash
npm run db:backup   # Create a backup of your SQLite database
                    # Use when: Before major changes or deployments
                    # Creates: data/backups/cc_backup_[timestamp].db

npm run db:reset    # Reset database to initial state
                    # Use when: Need fresh start or corrupted data
                    # Warning: This will delete all your data!

npm run clean       # Remove all dependencies and virtual environments
                    # Use when: Dependencies conflict or need fresh install
                    # Removes: node_modules/, apps/api/.venv/, package-lock.json
                    # After running: npm install to reinstall everything
```

## Usage

### Getting Started with Development

1. **Connect Claude Code**: Link your Claude Code CLI to enable AI assistance
2. **Describe Your Project**: Use natural language to describe what you want to build
3. **AI Generation**: Watch as the AI generates your project structure and code
4. **Live Preview**: See changes instantly with hot reload functionality
5. **Deploy**: Push to production with Vercel integration

### API Development

Access the interactive API documentation at http://localhost:8080/docs to explore available endpoints and test API functionality.

### Database Operations

Claudable uses SQLite for local development and can be configured for PostgreSQL in production. The database automatically initializes on first run.

## Troubleshooting

### Port Already in Use

The application automatically finds available ports. Check the `.env` file to see which ports were assigned.

### Installation Failures

```bash
# Clean all dependencies and retry
npm run clean
npm install
```

### Permission Errors (macOS/Linux)

If you encounter permission errors:
```bash
cd apps/api
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

### Claude Code Permission Issues (Windows/WSL)

If you encounter the error: `Error output dangerously skip permissions cannot be used which is root sudo privileges for security reasons`

**Solution:**
1. Do not run Claude Code with `sudo` or as root user
2. Ensure proper file ownership in WSL:
   ```bash
   # Check current user
   whoami
   
   # Change ownership of project directory to current user
   sudo chown -R $(whoami):$(whoami) ~/Claudable
   ```
3. If using WSL, make sure you're running Claude Code from your user account, not root
4. Verify Claude Code installation permissions:
   ```bash
   # Reinstall Claude Code without sudo
   npm install -g @anthropic-ai/claude-code --unsafe-perm=false
   ```

## Integration Guide

### GitHub
**Get Token:** [GitHub Personal Access Tokens](https://github.com/settings/tokens) → Generate new token (classic) → Select `repo` scope

**Connect:** Settings → Service Integrations → GitHub → Enter token → Create or connect repository

### Vercel  
**Get Token:** [Vercel Account Settings](https://vercel.com/account/tokens) → Create Token

**Connect:** Settings → Service Integrations → Vercel → Enter token → Create new project for deployment

### Supabase
**Get Credentials:** [Supabase Dashboard](https://supabase.com/dashboard) → Your Project → Settings → API
- Project URL: `https://xxxxx.supabase.co`  
- Anon Key: Public key for client-side
- Service Role Key: Secret key for server-side

## Design Comparison

*Same prompt, different results*

### Claudable
<img src="./assets/Claudable_ex.png" alt="Claudable Design" style="border-radius: 12px; width: 100%;" />

[View Claudable Live Demo →](https://claudable-preview.vercel.app/)

### Lovable
<img src="./assets/Lovable_ex.png" alt="Lovable Design" style="border-radius: 12px; width: 100%;" />

[View Lovable Live Demo →](https://preview--goal-track-studio.lovable.app/)

## License

MIT License.

## Upcoming Features
These features are in development and will be opened soon.
- **New CLI Agents** - Trust us, you're going to LOVE this!
- **Checkpoints for Chat** - Save and restore conversation/codebase states
- **Advanced MCP Integration** - Native integration with MCP
- **Enhanced Agent System** - Subagents, AGENTS.md integration
- **Website Cloning** - You can start a project from a reference URL.
- Various bug fixes and community PR merges

We're working hard to deliver the features you've been asking for. Stay tuned!

## Star History

[![Star History Chart](https://api.star-history.com/svg?repos=opactorai/Claudable&type=Date)](https://www.star-history.com/#opactorai/Claudable&Date)
