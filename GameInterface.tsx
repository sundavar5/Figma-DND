import { useState, useRef, useEffect } from 'react';
import { Character, GameState, Message } from '../types/game';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { ScrollArea } from './ui/scroll-area';
import { Badge } from './ui/badge';
import { Loader2, Send, Dice6 } from 'lucide-react';
import { callAI } from '../utils/aiService';

interface GameInterfaceProps {
  character: Character;
  setCharacter: (character: Character) => void;
  gameState: GameState;
  setGameState: (state: GameState) => void;
  apiConfig: {provider: string, apiKey: string};
  adventurePreferences?: any;
}

export function GameInterface({ 
  character, 
  setCharacter, 
  gameState, 
  setGameState,
  apiConfig,
  adventurePreferences 
}: GameInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>(() => {
    const saved = localStorage.getItem('dnd_messages');
    if (saved) {
      return JSON.parse(saved);
    }
    return [];
  });
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasGeneratedOpening, setHasGeneratedOpening] = useState(() => {
    const saved = localStorage.getItem('dnd_has_opening');
    return saved === 'true';
  });
  const scrollRef = useRef<HTMLDivElement>(null);

  // Generate opening narrative on first load
  useEffect(() => {
    if (!hasGeneratedOpening && messages.length === 0) {
      generateOpeningNarrative();
    }
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem('dnd_messages', JSON.stringify(messages));
      const now = new Date();
      localStorage.setItem('dnd_last_save', now.toISOString());
    }
  }, [messages]);

  const generateOpeningNarrative = async () => {
    setIsLoading(true);
    try {
      const adventureDesc = adventurePreferences?.adventureDescription || 'a classic D&D adventure';
      const backstory = adventurePreferences?.backstory || 'no backstory';
      
      const openingPrompt: Message = {
        role: 'user',
        content: `I want to start my adventure! 

My Character: ${character.name}, a level ${character.level} ${character.race} ${character.class}
Character Backstory: ${backstory}
Requested Adventure Type: ${adventureDesc}

IMPORTANT: You MUST create an opening narrative that directly relates to the adventure type I requested ("${adventureDesc}") and incorporates my character's backstory. Set the scene vividly, establish the tone that matches my requested adventure type, introduce the initial situation or conflict, and end with what I see/hear/feel and what I should do next. Make it immersive and tailored specifically to what I asked for.`
      };

      const response = await callAI(
        apiConfig.provider,
        apiConfig.apiKey,
        [openingPrompt],
        character,
        gameState,
        setCharacter,
        setGameState,
        adventurePreferences
      );

      setMessages([{ role: 'assistant', content: response }]);
      setHasGeneratedOpening(true);
      localStorage.setItem('dnd_has_opening', 'true');
    } catch (error) {
      console.error('Error generating opening:', error);
      setMessages([{ 
        role: 'assistant', 
        content: 'An error occurred generating the opening. Please check your API key and try again.' 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const rollDice = (sides: number) => {
    return Math.floor(Math.random() * sides) + 1;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setIsLoading(true);

    // Add user message
    const newMessages: Message[] = [
      ...messages,
      { role: 'user', content: userMessage }
    ];
    setMessages(newMessages);

    try {
      const response = await callAI(
        apiConfig.provider,
        apiConfig.apiKey,
        newMessages,
        character,
        gameState,
        setCharacter,
        setGameState,
        adventurePreferences
      );

      setMessages([...newMessages, { role: 'assistant', content: response }]);
    } catch (error) {
      console.error('Error calling AI:', error);
      setMessages([
        ...newMessages,
        { 
          role: 'assistant', 
          content: 'An error occurred communicating with the AI. Please check your API key and try again.' 
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const quickRoll = (type: string) => {
    let result = '';
    switch (type) {
      case 'd20':
        result = `D20 Roll: ${rollDice(20)}`;
        break;
      case 'initiative':
        const initRoll = rollDice(20) + character.initiative;
        result = `Initiative Roll: ${initRoll}`;
        break;
      case 'attack':
        const attackRoll = rollDice(20) + character.abilities.strength;
        result = `Attack Roll: ${attackRoll}`;
        break;
    }
    setInput(result);
  };

  return (
    <div className="space-y-4">
      {/* Game Status */}
      <Card className="bg-slate-800 border-slate-700 text-white">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-300">Location</p>
              <p className="text-white">{gameState.location || 'Unknown'}</p>
            </div>
            {gameState.inCombat && (
              <Badge variant="destructive" className="animate-pulse">In Combat</Badge>
            )}
          </div>
          
          {gameState.enemies.length > 0 && (
            <div className="mt-4">
              <p className="text-slate-300 mb-2">Enemies</p>
              <div className="space-y-2">
                {gameState.enemies.map((enemy) => (
                  <div key={enemy.id} className="bg-slate-900 p-2 rounded flex justify-between items-center">
                    <span className="text-white">{enemy.name}</span>
                    <div className="flex items-center gap-4">
                      <span className="text-slate-300">AC {enemy.ac}</span>
                      <span className="text-red-400">HP {enemy.hp}/{enemy.maxHp}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Chat Interface */}
      <Card className="bg-slate-800 border-slate-700 text-white">
        <CardHeader>
          <CardTitle className="text-white">Adventure Log</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-96 pr-4 mb-4">
            <div className="space-y-4">
              {messages.map((message, i) => (
                <div
                  key={i}
                  className={`p-4 rounded-lg ${
                    message.role === 'user'
                      ? 'bg-blue-900/30 ml-8'
                      : 'bg-slate-900 mr-8'
                  }`}
                >
                  <p className="text-slate-300 mb-1">
                    {message.role === 'user' ? 'You' : 'Dungeon Master'}
                  </p>
                  <p className="whitespace-pre-wrap text-white">{message.content}</p>
                </div>
              ))}
              {isLoading && (
                <div className="bg-slate-900 mr-8 p-4 rounded-lg">
                  <p className="text-slate-300 mb-1">Dungeon Master</p>
                  <Loader2 className="h-5 w-5 animate-spin text-white" />
                </div>
              )}
              <div ref={scrollRef} />
            </div>
          </ScrollArea>

          {/* Quick Actions */}
          <div className="flex gap-2 mb-4 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={() => quickRoll('d20')}
              className="bg-slate-900 border-slate-600 text-white hover:bg-slate-700"
            >
              <Dice6 className="h-4 w-4 mr-1" />
              Roll D20
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => quickRoll('initiative')}
              className="bg-slate-900 border-slate-600 text-white hover:bg-slate-700"
            >
              Initiative
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => quickRoll('attack')}
              className="bg-slate-900 border-slate-600 text-white hover:bg-slate-700"
            >
              Attack
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setInput('I look around carefully')}
              className="bg-slate-900 border-slate-600 text-white hover:bg-slate-700"
            >
              Perception Check
            </Button>
          </div>

          {/* Input Form */}
          <form onSubmit={handleSubmit} className="flex gap-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Describe your action..."
              className="bg-slate-900 border-slate-600 min-h-[60px] text-white placeholder:text-slate-400"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
            />
            <Button type="submit" disabled={isLoading || !input.trim()}>
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}