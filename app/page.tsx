'use client';

import { Uploader } from '@/components/Uploader';

export default function Home() {
  const handleUploadComplete = (files: any[]) => {
    console.log('Upload completed:', files);
    // Here you can process the uploaded files further
    // - Extract color palette
    // - Generate AI descriptions
    // - Create mockups
    // - Save to database
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            🎨 ArtDrop Alchemist
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Transform your artwork with AI-powered processing, smart cropping,
            background removal, and intelligent metadata generation.
          </p>
        </div>

        {/* Upload Section */}
        <div className="mb-12">
          <Uploader
            onUploadComplete={handleUploadComplete}
            maxFiles={5}
            className="mb-8"
          />
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-12">
          <div className="bg-white rounded-lg p-6 shadow-lg">
            <h3 className="text-xl font-semibold mb-3">🤖 AI Processing</h3>
            <p className="text-gray-600">
              Local-first AI with Ollama (Llama 3.2) for privacy and speed.
              Premium API fallbacks available.
            </p>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-lg">
            <h3 className="text-xl font-semibold mb-3">🖼️ Smart Enhancement</h3>
            <p className="text-gray-600">
              Background removal, auto-cropping, palette extraction,
              and room mockup generation.
            </p>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-lg">
            <h3 className="text-xl font-semibold mb-3">📊 Export Ready</h3>
            <p className="text-gray-600">
              Export to JSON, CSV, or push directly to Wix Headless
              with transparent pricing formulas.
            </p>
          </div>
        </div>

        <div className="text-center">
          <div className="bg-white rounded-lg p-8 shadow-lg inline-block">
            <h2 className="text-2xl font-bold mb-4">🚀 Service Status</h2>
            <div className="text-left space-y-2">
              <p>✅ PostgreSQL: Running</p>
              <p>✅ Redis: Running</p>
              <p>✅ MailHog: Running (port 8125)</p>
              <p>✅ Upload API: Ready</p>
              <p>🔄 Ollama: Available for AI processing</p>
            </div>
          </div>
        </div>

        <div className="mt-12 text-center text-gray-500">
          <p>Services Status:</p>
          <ul className="mt-2 space-y-1">
            <li>🌐 Web: http://localhost:3000</li>
            <li>📧 Email: http://localhost:8125</li>
            <li>🗄️ Database: localhost:5432</li>
            <li>🧠 AI: http://localhost:11434</li>
          </ul>
        </div>
      </div>
    </div>
  )
}