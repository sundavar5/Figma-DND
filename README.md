# D&D AI Dungeon Master

An interactive D&D 5th Edition game powered by AI (OpenAI, Anthropic Claude, or DeepSeek) that acts as your Dungeon Master.

## Features

- **Full Character Creation** - Choose from 12 classes, customize stats, select spells
- **AI-Powered DM** - The AI controls the entire game world and can modify all character stats
- **Dynamic Combat** - Real-time combat with enemy tracking
- **Inventory System** - The AI adds/removes items based on your actions
- **Experience & Leveling** - Earn XP and level up with AI-managed progression
- **Custom Adventures** - Describe exactly what kind of adventure you want
- **Save System** - Auto-save and manual export/import of game saves

## How to Download and Run

### Option 1: Download from Figma Make (Easiest)

If you're viewing this in Figma Make, you can download the project directly:
1. Look for an "Export" or "Download" button in the Figma Make interface
2. Download the project files
3. Follow Option 2 below to run it locally

### Option 2: Set Up Locally with Node.js

This is a React + TypeScript + Vite application. Here's how to run it:

#### Prerequisites
- Install [Node.js](https://nodejs.org/) (version 16 or higher)

#### Steps

1. **Save all the project files** to a folder on your computer with this structure:
```
dnd-game/
├── App.tsx
├── index.html
├── package.json
├── components/
│   ├── ApiKeySetup.tsx
│   ├── CharacterCreator.tsx
│   ├── CharacterSheet.tsx
│   ├── GameInterface.tsx
│   ├── SaveManager.tsx
│   └── ui/ (shadcn components)
├── types/
│   └── game.ts
├── utils/
│   └── aiService.ts
└── styles/
    └── globals.css
```

2. **Create a package.json file** (if not present):
```json
{
  "name": "dnd-ai-dungeon-master",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "lucide-react": "^0.263.1",
    "recharts": "^2.5.0"
  },
  "devDependencies": {
    "@types/react": "^18.3.3",
    "@types/react-dom": "^18.3.0",
    "@vitejs/plugin-react": "^4.3.1",
    "typescript": "^5.5.3",
    "vite": "^5.4.2",
    "tailwindcss": "^4.0.0",
    "autoprefixer": "^10.4.14"
  }
}
```

3. **Open a terminal** in the project folder and run:
```bash
npm install
```

4. **Start the development server**:
```bash
npm run dev
```

5. **Open your browser** to the URL shown (usually http://localhost:5173)

6. **To build for production**:
```bash
npm run build
```
The built files will be in the `dist/` folder, which you can host anywhere.

### Option 3: Quick HTML Version (Simplified)

For a simpler single-file version (with limitations), you could use a CDN-based setup, but this would require significant modifications to use React from CDN instead of build tools.

## Getting an API Key

You'll need an API key from one of these providers:

- **OpenAI**: https://platform.openai.com/api-keys
- **Anthropic (Claude)**: https://console.anthropic.com/
- **DeepSeek**: https://platform.deepseek.com/

⚠️ **Note**: API keys are stored locally in your browser and never sent anywhere except to the AI provider you choose.

## How to Play

1. **Enter your API key** when prompted
2. **Create your character**:
   - Choose a name, class, and race
   - Allocate ability scores (27-point buy system)
   - Select starting spells (if spellcaster)
   - Write a character backstory
   - Describe the adventure you want
3. **Start playing!** The AI will generate a custom opening and guide your adventure
4. **Save your game** using the Save button in the top right

## Game Features

### AI Capabilities
The AI Dungeon Master can:
- Modify your HP, stats, and abilities
- Add/remove items from inventory
- Use/restore spell slots
- Award experience and handle leveling
- Apply conditions and status effects
- Create and manage combat encounters
- Update your location
- Add new spells to your spellbook

### Commands
- Use the quick action buttons for common actions
- Type any action you want to take
- The AI will ask for rolls when needed
- Press Enter to send (Shift+Enter for new line)

## Troubleshooting

**Game won't start**: Make sure you have Node.js installed and ran `npm install`

**API errors**: Check that your API key is valid and you have credits/usage available

**Save not loading**: Make sure the JSON file is valid and from this game

**White screen**: Check the browser console (F12) for errors

## Credits

Built with:
- React + TypeScript + Vite
- Tailwind CSS v4
- Shadcn UI components
- Lucide icons

AI integration supports:
- OpenAI GPT-4
- Anthropic Claude 3.5
- DeepSeek

## License

This is a personal project. Feel free to modify and use for your own games!

Enjoy your adventure! 🎲
