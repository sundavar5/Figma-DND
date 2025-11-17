import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

interface ApiKeySetupProps {
  onSetup: (config: {provider: string, apiKey: string}) => void;
}

export function ApiKeySetup({ onSetup }: ApiKeySetupProps) {
  const [provider, setProvider] = useState('openai');
  const [apiKey, setApiKey] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (apiKey.trim()) {
      onSetup({ provider, apiKey });
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">AI Dungeon Master Setup</CardTitle>
          <CardDescription className="text-slate-300">
            Enter your API key to begin your adventure. Your key is stored locally in your browser.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="provider" className="text-white">AI Provider</Label>
              <Select value={provider} onValueChange={setProvider}>
                <SelectTrigger id="provider" className="bg-slate-900 border-slate-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-600 text-white">
                  <SelectItem value="openai">OpenAI (GPT-4)</SelectItem>
                  <SelectItem value="anthropic">Anthropic (Claude)</SelectItem>
                  <SelectItem value="deepseek">DeepSeek</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="apiKey" className="text-white">API Key</Label>
              <Input
                id="apiKey"
                type="password"
                placeholder="sk-..."
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="bg-slate-900 border-slate-600 text-white placeholder:text-slate-400"
              />
              <p className="text-slate-400">
                {provider === 'openai' && 'Get your key from platform.openai.com'}
                {provider === 'anthropic' && 'Get your key from console.anthropic.com'}
                {provider === 'deepseek' && 'Get your key from platform.deepseek.com'}
              </p>
            </div>
            
            <Button type="submit" className="w-full">
              Begin Adventure
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}