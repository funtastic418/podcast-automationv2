'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Mic, Upload, CheckCircle, AlertCircle } from 'lucide-react';

export default function AutoToolPage() {
  const [topic, setTopic] = useState('');
  const [script, setScript] = useState('');
  const [status, setStatus] = useState<'idle' | 'generating' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const generateEpisode = async () => {
    if (!topic || !script) {
      setStatus('error');
      setMessage('Please enter both topic and script');
      return;
    }

    setStatus('generating');
    setMessage('Creating episode...');

    try {
      // Simulate audio generation (replace with your actual audio generation)
      const audioData = btoa('fake-audio-data'); // Replace with real audio generation
      
      const response = await fetch('/api/auto-episode', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topic,
          script,
          audioData
        }),
      });

      const result = await response.json();

      if (result.success) {
        setStatus('success');
        setMessage(`✅ Episode "${result.episode.title}" added successfully! 
RSS Feed: ${result.rssFeedUrl}
Apple Podcasts will update within 24 hours.`);
        
        // Clear form
        setTopic('');
        setScript('');
      } else {
        setStatus('error');
        setMessage(`❌ Error: ${result.error}`);
      }
    } catch (error) {
      setStatus('error');
      setMessage(`❌ Failed to create episode: ${error}`);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold flex items-center justify-center gap-2">
          <Mic className="h-8 w-8" />
          Auto Episode Generator
        </h1>
        <p className="text-muted-foreground mt-2">
          Create episodes that automatically appear in Apple Podcasts
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Create New Episode</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium">Episode Topic</label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g., The Future of AI"
              className="w-full mt-1 p-2 border rounded-md"
              disabled={status === 'generating'}
            />
          </div>

          <div>
            <label className="text-sm font-medium">Episode Script</label>
            <textarea
              value={script}
              onChange={(e) => setScript(e.target.value)}
              placeholder="Write your episode script here..."
              className="w-full mt-1 p-2 border rounded-md h-32"
              disabled={status === 'generating'}
            />
          </div>

          <Button 
            onClick={generateEpisode} 
            disabled={status === 'generating'}
            className="w-full"
          >
            {status === 'generating' ? (
              <>Creating Episode...</>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Create Episode & Push to Apple Podcasts
              </>
            )}
          </Button>

          {status !== 'idle' && (
            <div className={`p-4 rounded-md ${
              status === 'success' ? 'bg-green-50 text-green-800' : 
              status === 'error' ? 'bg-red-50 text-red-800' : 
              'bg-blue-50 text-blue-800'
            }`}>
              <div className="flex items-center gap-2">
                {status === 'success' && <CheckCircle className="h-5 w-5" />}
                {status === 'error' && <AlertCircle className="h-5 w-5" />}
                {status === 'generating' && <Mic className="h-5 w-5 animate-pulse" />}
                <div className="whitespace-pre-line">{message}</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>How It Works</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>1. Enter your episode topic and script</p>
          <p>2. Click "Create Episode & Push to Apple Podcasts"</p>
          <p>3. Episode is automatically added to your RSS feed</p>
          <p>4. Apple Podcasts detects new episode within 24 hours</p>
          <p>5. No manual work required</p>
        </CardContent>
      </Card>
    </div>
  );
}
