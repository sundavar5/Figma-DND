import { useState } from 'react';
import { CharacterSheet } from './components/CharacterSheet';
import { GameInterface } from './components/GameInterface';
import { ApiKeySetup } from './components/ApiKeySetup';
import { CharacterCreator } from './components/CharacterCreator';
import { Character, GameState } from './types/game';
import { SaveManager } from './components/SaveManager';

export default function App() {
  const [apiConfig, setApiConfig] = useState<{provider: string, apiKey: string} | null>(() => {
    const saved = localStorage.getItem('dnd_api_config');
    return saved ? JSON.parse(saved) : null;
  });
  const [character, setCharacter] = useState<Character | null>(() => {
    const saved = localStorage.getItem('dnd_character');
    return saved ? JSON.parse(saved) : null;
  });
  const [gameState, setGameState] = useState<GameState>(() => {
    const saved = localStorage.getItem('dnd_game_state');
    return saved ? JSON.parse(saved) : {
      inCombat: false,
      currentTurn: null,
      enemies: [],
      narrative: "You stand at the entrance of a dark dungeon. The air is thick with mystery and danger. What do you do?",
      location: "Dungeon Entrance"
    };
  });
  const [adventurePreferences, setAdventurePreferences] = useState<any>(() => {
    const saved = localStorage.getItem('dnd_adventure_prefs');
    return saved ? JSON.parse(saved) : null;
  });

  const handleApiSetup = (config: {provider: string, apiKey: string}) => {
    setApiConfig(config);
    localStorage.setItem('dnd_api_config', JSON.stringify(config));
  };

  const handleCharacterCreation = (char: Character, prefs: any) => {
    setCharacter(char);
    setAdventurePreferences(prefs);
    localStorage.setItem('dnd_character', JSON.stringify(char));
    localStorage.setItem('dnd_adventure_prefs', JSON.stringify(prefs));
  };

  const handleCharacterUpdate = (char: Character) => {
    setCharacter(char);
    localStorage.setItem('dnd_character', JSON.stringify(char));
    const now = new Date();
    localStorage.setItem('dnd_last_save', now.toISOString());
  };

  const handleGameStateUpdate = (state: GameState) => {
    setGameState(state);
    localStorage.setItem('dnd_game_state', JSON.stringify(state));
    const now = new Date();
    localStorage.setItem('dnd_last_save', now.toISOString());
  };

  const handleNewGame = () => {
    if (confirm('Are you sure you want to start a new game? Current progress will be lost.')) {
      setCharacter(null);
      setGameState({
        inCombat: false,
        currentTurn: null,
        enemies: [],
        narrative: "",
        location: ""
      });
      localStorage.removeItem('dnd_character');
      localStorage.removeItem('dnd_game_state');
      localStorage.removeItem('dnd_adventure_prefs');
      localStorage.removeItem('dnd_messages');
      localStorage.removeItem('dnd_has_opening');
      localStorage.removeItem('dnd_last_save');
    }
  };

  const handleExportSave = () => {
    const saveData = {
      character,
      gameState,
      adventurePreferences,
      messages: localStorage.getItem('dnd_messages'),
      hasOpening: localStorage.getItem('dnd_has_opening'),
      timestamp: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(saveData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dnd-save-${character?.name || 'game'}-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportSave = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const saveData = JSON.parse(e.target?.result as string);
        
        // Load all game data
        setCharacter(saveData.character);
        setGameState(saveData.gameState);
        setAdventurePreferences(saveData.adventurePreferences);
        
        // Save to localStorage
        localStorage.setItem('dnd_character', JSON.stringify(saveData.character));
        localStorage.setItem('dnd_game_state', JSON.stringify(saveData.gameState));
        localStorage.setItem('dnd_adventure_prefs', JSON.stringify(saveData.adventurePreferences));
        if (saveData.messages) {
          localStorage.setItem('dnd_messages', saveData.messages);
        }
        if (saveData.hasOpening) {
          localStorage.setItem('dnd_has_opening', saveData.hasOpening);
        }
        
        alert('Game loaded successfully!');
        // Force page reload to reinitialize everything
        window.location.reload();
      } catch (error) {
        alert('Error loading save file. Please make sure it\'s a valid save file.');
        console.error('Import error:', error);
      }
    };
    reader.readAsText(file);
  };

  if (!apiConfig) {
    return <ApiKeySetup onSetup={handleApiSetup} />;
  }

  if (!character) {
    return <CharacterCreator onComplete={handleCharacterCreation} />;
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <div className="container mx-auto p-4">
        <header className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <div className="flex-1"></div>
            <h1 className="text-center">D&D - AI Dungeon Master</h1>
            <div className="flex-1 flex justify-end">
              <SaveManager 
                onExport={handleExportSave}
                onImport={handleImportSave}
              />
            </div>
          </div>
          <p className="text-center text-slate-300">
            Playing as {character.name} • Level {character.level} {character.race} {character.class}
          </p>
          <div className="text-center mt-2">
            <button 
              onClick={handleNewGame}
              className="text-slate-400 hover:text-white transition-colors"
            >
              New Game
            </button>
          </div>
        </header>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Character Sheet - Left Side */}
          <div className="lg:col-span-1">
            <CharacterSheet character={character} />
          </div>
          
          {/* Game Interface - Right Side */}
          <div className="lg:col-span-2">
            <GameInterface 
              character={character}
              setCharacter={handleCharacterUpdate}
              gameState={gameState}
              setGameState={handleGameStateUpdate}
              apiConfig={apiConfig}
              adventurePreferences={adventurePreferences}
            />
          </div>
        </div>
      </div>
    </div>
  );
}