# AI Stack for ArtDrop Alchemist

## 1. Background Removal (Tiered Approach)

### Primary: BiRefNet (Local)
- **Why**: State-of-the-art, runs locally via ONNX
- **Quality**: Excellent for artwork/product photos
- **Speed**: ~2-3 seconds per image
- **Cost**: FREE

### Secondary: BRIA RMBG (Local)
- **Why**: Lighter weight, faster processing
- **Model**: BRIA-RMBG-1.4 via HuggingFace
- **Speed**: ~1 second per image
- **Cost**: FREE

### Fallback: Remove.bg API
- **Why**: Industry standard, reliable
- **Quality**: Professional grade
- **Cost**: $0.20-0.25 per image

## 2. Image Analysis & Style Detection

### Primary: CLIP + BLIP-2 (Local)
- **CLIP**: Style classification, aesthetic scoring
- **BLIP-2**: Detailed captions, subject detection
- **Implementation**: Via Transformers.js or ONNX
- **Cost**: FREE

### Enhancement: OpenAI GPT-4 Vision
- **Why**: Best-in-class image understanding
- **Use**: Detailed artwork analysis, materials detection
- **Cost**: ~$0.01 per image

### Alternative: Claude 3 Vision
- **Why**: Excellent at artistic interpretation
- **Use**: Nuanced style analysis, emotional content
- **Cost**: ~$0.003 per image

## 3. Title & Description Generation

### Primary: Llama 3.2 (Local via Ollama in Docker)
- **Model**: llama3.2:3b or llama3.2:11b
- **Why**: Runs locally, good creative writing
- **Speed**: 2-5 seconds
- **Cost**: FREE

### Enhancement: Claude 3.5 Sonnet API
- **Why**: Superior creative writing
- **Use**: Polish and enhance local generations
- **Cost**: ~$0.003 per generation

### Alternative: OpenAI GPT-4
- **Why**: Consistent quality
- **Cost**: ~$0.03 per generation

## 4. Smart Cropping & Composition

### Primary: SAM (Segment Anything Model)
- **Why**: Precise object segmentation
- **Use**: Smart crop boundaries, focal point detection
- **Implementation**: MobileSAM via ONNX
- **Cost**: FREE

## 5. Color Harmony & Palette

### Primary: Custom Algorithms (Local)
- **Methods**:
  - K-means clustering for palette extraction
  - CIEDE2000 for perceptual color matching
  - HSL analysis for harmony detection
- **Cost**: FREE

### Enhancement: Colormind API
- **Why**: AI-powered color suggestions
- **Use**: Complementary palette generation
- **Cost**: FREE (with limits)

## 6. Pricing Intelligence

### Primary: Custom ML Model (Local)
- **Training Data**: Artsy, Saatchi Art, Etsy pricing data
- **Features**: Size, medium, style, market trends
- **Implementation**: scikit-learn or TensorFlow.js

### Market Data: SerpAPI or ScraperAPI
- **Use**: Real-time market pricing comparisons
- **Cost**: $0.001 per query

## Docker Services Configuration

```yaml
services:
  # Ollama for local LLM
  ollama:
    image: ollama/ollama:latest
    ports:
      - "11434:11434"
    volumes:
      - ollama_data:/root/.ollama
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: 1
              capabilities: [gpu]
    command: serve

  # ComfyUI for advanced image processing
  comfyui:
    image: comfyanonymous/comfyui:latest
    ports:
      - "8188:8188"
    volumes:
      - ./comfyui/models:/app/models
      - ./comfyui/output:/app/output
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: 1
              capabilities: [gpu]

  # Replicate for model fallbacks
  replicate-proxy:
    image: replicate/cog:latest
    environment:
      - REPLICATE_API_TOKEN=${REPLICATE_API_TOKEN}
```

## Implementation Priority

1. **Phase 1 (MVP)**:
   - BiRefNet for background removal
   - CLIP for basic analysis
   - Llama 3.2 for text generation
   - Custom color algorithms

2. **Phase 2 (Enhanced)**:
   - Add GPT-4 Vision for better analysis
   - Claude API for premium descriptions
   - SAM for smart cropping

3. **Phase 3 (Scale)**:
   - Train custom models on artwork data
   - Add real-time pricing intelligence
   - Implement style transfer options

## Environment Variables

```env
# Required for MVP
OLLAMA_HOST=http://ollama:11434

# Optional API Keys (for enhancements)
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
REPLICATE_API_TOKEN=r8_...
REMOVE_BG_API_KEY=...
HUGGINGFACE_API_KEY=hf_...

# Model Selection
PRIMARY_VISION_MODEL=clip-vit-base-patch32
PRIMARY_LLM_MODEL=llama3.2:3b
ENABLE_GPU=false  # Set to true if GPU available
```

## Cost Analysis

### Free Tier (Local Only)
- 100% local processing
- No API costs
- ~5-10 seconds per image
- Quality: 85-90%

### Balanced Tier ($0.05/image)
- Local processing + API polish
- Claude for descriptions
- Quality: 95%

### Premium Tier ($0.30/image)
- Full API processing
- GPT-4 Vision + Remove.bg
- <3 seconds processing
- Quality: 99%

## Recommended Setup for Docker

1. **CPU-only environments**: Use ONNX models + Ollama CPU
2. **GPU available**: Add CUDA support for 10x speedup
3. **Production**: Mix of local + API with Redis caching