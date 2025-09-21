import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';

interface ArtworkAnalysis {
  title: string;
  description: string;
  style: string;
  medium: string;
  subjects: string[];
  colors: string[];
  mood: string;
  techniques: string[];
  estimatedPeriod?: string;
  culturalContext?: string;
  symbolism?: string[];
}

interface ColorPalette {
  dominant: string;
  accent: string;
  complementary: string[];
  hex: string[];
}

class AIService {
  private openai: OpenAI | null = null;
  private anthropic: Anthropic | null = null;

  constructor() {
    // Initialize OpenAI if API key is available
    if (process.env.OPENAI_API_KEY) {
      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });
    }

    // Initialize Anthropic if API key is available
    if (process.env.ANTHROPIC_API_KEY) {
      this.anthropic = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY,
      });
    }

    // Ensure at least one provider is available
    if (!this.openai && !this.anthropic) {
      throw new Error('At least one AI provider (OpenAI or Anthropic) API key is required');
    }
  }

  async analyzeArtwork(imageBuffer: Buffer, mimeType: string): Promise<ArtworkAnalysis> {
    // Try OpenAI first if available
    if (this.openai) {
      try {
        return await this.analyzeWithOpenAI(imageBuffer, mimeType);
      } catch (error) {
        console.error('OpenAI analysis failed, trying Anthropic fallback:', error);
      }
    }

    // Try Anthropic as fallback or primary if OpenAI not available
    if (this.anthropic) {
      try {
        return await this.analyzeWithAnthropic(imageBuffer, mimeType);
      } catch (error) {
        console.error('Anthropic analysis failed:', error);
      }
    }

    // Return basic fallback analysis
    return {
      title: 'Untitled Artwork',
      description: 'Unable to analyze artwork automatically',
      style: 'Unknown',
      medium: 'Unknown',
      subjects: [],
      colors: [],
      mood: 'Unknown',
      techniques: [],
    };
  }

  private async analyzeWithOpenAI(imageBuffer: Buffer, mimeType: string): Promise<ArtworkAnalysis> {
    if (!this.openai) throw new Error('OpenAI not initialized');

    const base64Image = imageBuffer.toString('base64');
    const dataUrl = `data:${mimeType};base64,${base64Image}`;

    const response = await this.openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Analyze this artwork and provide a comprehensive analysis. Return a JSON object with the following structure:

{
  "title": "A descriptive title for the artwork",
  "description": "Detailed description of what you see (2-3 sentences)",
  "style": "Art style/movement (e.g., Abstract, Realism, Impressionism)",
  "medium": "Medium used (e.g., Oil on canvas, Digital art, Watercolor)",
  "subjects": ["main subjects depicted"],
  "colors": ["dominant color names"],
  "mood": "Overall mood/emotion conveyed",
  "techniques": ["artistic techniques observed"],
  "estimatedPeriod": "Estimated time period if applicable",
  "culturalContext": "Cultural or historical context if relevant",
  "symbolism": ["symbolic elements if any"]
}

Be specific and detailed but concise. Focus on objective artistic analysis.`
            },
            {
              type: "image_url",
              image_url: {
                url: dataUrl,
                detail: "high"
              }
            }
          ]
        }
      ],
      max_tokens: 1000,
      temperature: 0.3,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No analysis received from OpenAI');
    }

    return JSON.parse(content) as ArtworkAnalysis;
  }

  private async analyzeWithAnthropic(imageBuffer: Buffer, mimeType: string): Promise<ArtworkAnalysis> {
    if (!this.anthropic) throw new Error('Anthropic not initialized');

    const base64Image = imageBuffer.toString('base64');

    const response = await this.anthropic.messages.create({
      model: "claude-3-5-haiku-20241022",
      max_tokens: 1000,
      temperature: 0.3,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: mimeType as "image/jpeg" | "image/png" | "image/gif" | "image/webp",
                data: base64Image,
              },
            },
            {
              type: "text",
              text: `Analyze this artwork and provide a comprehensive analysis. Return a JSON object with the following structure:

{
  "title": "A descriptive title for the artwork",
  "description": "Detailed description of what you see (2-3 sentences)",
  "style": "Art style/movement (e.g., Abstract, Realism, Impressionism)",
  "medium": "Medium used (e.g., Oil on canvas, Digital art, Watercolor)",
  "subjects": ["main subjects depicted"],
  "colors": ["dominant color names"],
  "mood": "Overall mood/emotion conveyed",
  "techniques": ["artistic techniques observed"],
  "estimatedPeriod": "Estimated time period if applicable",
  "culturalContext": "Cultural or historical context if relevant",
  "symbolism": ["symbolic elements if any"]
}

Be specific and detailed but concise. Focus on objective artistic analysis.`
            }
          ]
        }
      ]
    });

    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Anthropic');
    }

    return JSON.parse(content.text) as ArtworkAnalysis;
  }

  async extractColorPalette(imageBuffer: Buffer, mimeType: string): Promise<ColorPalette> {
    // Try OpenAI first if available
    if (this.openai) {
      try {
        return await this.extractColorsWithOpenAI(imageBuffer, mimeType);
      } catch (error) {
        console.error('OpenAI color extraction failed, trying Anthropic fallback:', error);
      }
    }

    // Try Anthropic as fallback or primary if OpenAI not available
    if (this.anthropic) {
      try {
        return await this.extractColorsWithAnthropic(imageBuffer, mimeType);
      } catch (error) {
        console.error('Anthropic color extraction failed:', error);
      }
    }

    // Return basic fallback palette
    return {
      dominant: 'unknown',
      accent: 'unknown',
      complementary: [],
      hex: ['#000000', '#333333', '#666666', '#999999', '#CCCCCC'],
    };
  }

  private async extractColorsWithOpenAI(imageBuffer: Buffer, mimeType: string): Promise<ColorPalette> {
    if (!this.openai) throw new Error('OpenAI not initialized');

    const base64Image = imageBuffer.toString('base64');
    const dataUrl = `data:${mimeType};base64,${base64Image}`;

    const response = await this.openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Extract the color palette from this image. Return a JSON object with:

{
  "dominant": "primary color (color name)",
  "accent": "main accent color (color name)",
  "complementary": ["2-3 complementary color names"],
  "hex": ["#hex1", "#hex2", "#hex3", "#hex4", "#hex5"]
}

Provide 5 hex codes for the most prominent colors in the image. Use standard color names (red, blue, green, etc.) for named colors.`
            },
            {
              type: "image_url",
              image_url: {
                url: dataUrl,
                detail: "low"
              }
            }
          ]
        }
      ],
      max_tokens: 300,
      temperature: 0.1,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No color analysis received from OpenAI');
    }

    return JSON.parse(content) as ColorPalette;
  }

  private async extractColorsWithAnthropic(imageBuffer: Buffer, mimeType: string): Promise<ColorPalette> {
    if (!this.anthropic) throw new Error('Anthropic not initialized');

    const base64Image = imageBuffer.toString('base64');

    const response = await this.anthropic.messages.create({
      model: "claude-3-5-haiku-20241022",
      max_tokens: 300,
      temperature: 0.1,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: mimeType as "image/jpeg" | "image/png" | "image/gif" | "image/webp",
                data: base64Image,
              },
            },
            {
              type: "text",
              text: `Extract the color palette from this image. Return a JSON object with:

{
  "dominant": "primary color (color name)",
  "accent": "main accent color (color name)",
  "complementary": ["2-3 complementary color names"],
  "hex": ["#hex1", "#hex2", "#hex3", "#hex4", "#hex5"]
}

Provide 5 hex codes for the most prominent colors in the image. Use standard color names (red, blue, green, etc.) for named colors.`
            }
          ]
        }
      ]
    });

    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Anthropic');
    }

    return JSON.parse(content.text) as ColorPalette;
  }

  async generateRoomDescription(artworkAnalysis: ArtworkAnalysis, roomType: string = 'living room'): Promise<string> {
    const prompt = `Based on this artwork analysis, suggest how it would look in a ${roomType}.

Artwork: ${artworkAnalysis.title}
Style: ${artworkAnalysis.style}
Colors: ${artworkAnalysis.colors.join(', ')}
Mood: ${artworkAnalysis.mood}

Provide a 2-3 sentence description of how this artwork would enhance the space, including wall color suggestions that would complement it.`;

    // Try OpenAI first if available
    if (this.openai) {
      try {
        const response = await this.openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [{ role: "user", content: prompt }],
          max_tokens: 200,
          temperature: 0.5,
        });

        const content = response.choices[0]?.message?.content;
        if (content) return content;
      } catch (error) {
        console.error('OpenAI room description failed, trying Anthropic fallback:', error);
      }
    }

    // Try Anthropic as fallback
    if (this.anthropic) {
      try {
        const response = await this.anthropic.messages.create({
          model: "claude-3-5-haiku-20241022",
          max_tokens: 200,
          temperature: 0.5,
          messages: [{ role: "user", content: prompt }]
        });

        const content = response.content[0];
        if (content.type === 'text') return content.text;
      } catch (error) {
        console.error('Anthropic room description failed:', error);
      }
    }

    return 'This artwork would make a beautiful addition to any room.';
  }

  async generateMetadata(artworkAnalysis: ArtworkAnalysis, provider?: 'openai' | 'anthropic'): Promise<Record<string, any>> {
    const detectedProvider = provider || (this.openai ? 'openai' : 'anthropic');
    const modelUsed = detectedProvider === 'openai' ? 'gpt-4o-mini' : 'claude-3-5-haiku-20241022';

    return {
      ai_generated: true,
      analysis_provider: detectedProvider,
      model_used: modelUsed,
      timestamp: new Date().toISOString(),
      confidence_score: 0.85,
      providers_available: {
        openai: !!this.openai,
        anthropic: !!this.anthropic,
      },
      ...artworkAnalysis,
    };
  }
}

export const aiService = new AIService();
export type { ArtworkAnalysis, ColorPalette };