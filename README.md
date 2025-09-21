# ArtDrop Alchemist 🎨

A production-ready AI-powered artwork processing platform that transforms artist uploads into gallery-ready digital assets with automated background removal, smart cropping, mockup generation, and intelligent metadata creation.

## 🚀 Features

### Core Capabilities
- **Drag & Drop Upload** - Multi-file processing queue with progress tracking
- **Smart Image Processing**
  - Background removal (local AI + API fallbacks)
  - Auto-deskew and perspective correction
  - Intelligent cropping with breathing room
  - Close-up detail generation
- **AI-Powered Analysis**
  - Color palette extraction with harmony suggestions
  - Style detection and keyword generation
  - Smart title and description generation
  - SEO-optimized alt text
- **Room Mockups** - Realistic wall placement with complementary colors
- **Transparent Pricing** - Formula-based with adjustable parameters
- **Export Options** - JSON, CSV, and direct Wix Headless integration

### AI Stack
- **Local Models** (Privacy-first, no API costs)
  - Llama 3.2 via Ollama for text generation
  - CLIP for style analysis
  - BRIA-RMBG for background removal
- **Premium APIs** (Optional enhancements)
  - OpenAI GPT-4 Vision
  - Anthropic Claude 3.5
  - Remove.bg
  - Replicate

## 🐳 Quick Start with Docker

### Prerequisites
- Docker Desktop installed
- 8GB+ RAM available
- 10GB+ disk space

### 1. Clone and Setup
```bash
# Clone the repository
git clone <your-repo-url> uploader
cd uploader

# Copy environment variables
cp .env.example .env

# Generate a secure NextAuth secret
openssl rand -base64 32
# Add to .env as NEXTAUTH_SECRET
```

### 2. Start with Docker Compose
```bash
# Start all services (first run will download models)
docker-compose up -d

# Initialize Ollama models (one-time setup)
docker-compose --profile setup up ollama-setup

# Run database migrations
docker-compose exec app pnpm prisma migrate dev

# View logs
docker-compose logs -f app
```

### 3. Access Services
- **Application**: http://localhost:3000
- **MailHog** (email testing): http://localhost:8025
- **Adminer** (database): http://localhost:8080 (use profile: `docker-compose --profile dev-tools up`)

## 🎯 Usage Guide

### Basic Workflow
1. **Upload** - Drag images to the upload zone
2. **Processing** - Automatic background removal, cropping, palette extraction
3. **Details** - Fill in missing metadata (size, medium, year)
4. **Mockups** - Auto-generated room scenes with your art
5. **Pricing** - Adjust pricing knobs for transparent calculations
6. **Export** - Download assets or push to Wix

### AI Provider Configuration

#### Free Tier (100% Local)
```env
# No API keys needed!
OLLAMA_HOST=http://ollama:11434
PRIMARY_LLM_MODEL=llama3.2:3b
```

#### Enhanced Tier
```env
# Add any of these for better quality
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
REMOVE_BG_API_KEY=...
```

### Storage Options

#### Local Storage (Default)
Files saved to `./uploads` and `./exports`

#### S3/MinIO
```bash
# Start MinIO
docker-compose --profile storage up minio

# Access MinIO console at http://localhost:9001
# Login: minioadmin/minioadmin
```

## 📊 Architecture

### Service Architecture
```
┌─────────────────────────────────────────┐
│           Next.js Application           │
│  (React + TypeScript + Tailwind CSS)    │
└────────────┬───────────────┬────────────┘
             │               │
    ┌────────▼──────┐ ┌─────▼──────┐
    │   PostgreSQL  │ │    Redis    │
    │   (Auth/Data) │ │  (Sessions) │
    └───────────────┘ └─────────────┘
             │               │
    ┌────────▼──────┐ ┌─────▼──────┐
    │    Ollama     │ │   MailHog   │
    │  (Local LLM)  │ │   (Email)   │
    └───────────────┘ └─────────────┘
```

### Processing Pipeline
1. **Upload** → Queue management with progress
2. **Clean** → EXIF rotation → Deskew → BG removal → Auto-crop
3. **Analyze** → Palette → Style → Keywords → Descriptions
4. **Enhance** → Mockups → Close-ups → Thumbnails
5. **Export** → JSON/CSV/Wix

## 🔧 Development

### Local Development
```bash
# Install dependencies
pnpm install

# Run development server
pnpm dev

# Run tests
pnpm test

# Type checking
pnpm typecheck
```

### Adding New AI Models
```bash
# Pull new Ollama models
docker-compose exec ollama ollama pull <model-name>

# Add to .env
PRIMARY_LLM_MODEL=<model-name>
```

### Database Management
```bash
# Create migration
docker-compose exec app pnpm prisma migrate dev

# View database
docker-compose --profile dev-tools up adminer
# Visit http://localhost:8080
```

## 🚢 Production Deployment

### Using Docker
```bash
# Build production image
docker-compose build app-prod

# Run production
docker-compose --profile production up app-prod
```

### Environment Variables
```env
NODE_ENV=production
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=<generate-secure-secret>
DATABASE_URL=<production-postgres-url>
REDIS_URL=<production-redis-url>
```

## 📝 API Endpoints

### Core APIs
- `POST /api/upload` - Handle file uploads
- `POST /api/analyze` - AI analysis pipeline
- `POST /api/mockups` - Generate room mockups
- `GET /api/price` - Calculate pricing
- `POST /api/export` - Export to various formats
- `POST /api/wix` - Push to Wix Headless

## 🧪 Testing

```bash
# Run all tests
pnpm test

# Run specific test suite
pnpm test color.test.ts

# Watch mode
pnpm test:watch
```

## 📚 Technology Stack

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Next.js API Routes, Prisma, PostgreSQL
- **Auth**: NextAuth.js with magic links
- **AI/ML**: Ollama (Llama 3.2), CLIP, ONNX Runtime
- **Image**: Sharp, Jimp, Canvas
- **State**: Zustand
- **Validation**: Zod
- **Testing**: Jest

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit changes
4. Push to branch
5. Open a pull request

## 📄 License

MIT License - See LICENSE file

## 🆘 Support

- **Issues**: GitHub Issues
- **Email**: support@artdrop.example
- **Docs**: `/docs` folder

## 🎉 Acknowledgments

Built with love for artists and creators everywhere.

---

**Made with ArtDrop Alchemist** - Transform your art, amplify your reach.