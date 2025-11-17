export interface Character {
  name: string;
  race: string;
  class: string;
  level: number;
  experience: number;
  experienceToNextLevel: number;
  
  abilities: {
    strength: number;
    dexterity: number;
    constitution: number;
    intelligence: number;
    wisdom: number;
    charisma: number;
  };
  
  hitPoints: {
    current: number;
    max: number;
    temporary: number;
  };
  
  armorClass: number;
  initiative: number;
  speed: number;
  proficiencyBonus: number;
  
  hitDice: {
    current: number;
    max: number;
    type: string;
  };
  
  spellSlots: {
    [level: number]: {
      current: number;
      max: number;
    };
  };
  
  skills: {
    [key: string]: number;
  };
  
  savingThrows: {
    strength: number;
    dexterity: number;
    constitution: number;
    intelligence: number;
    wisdom: number;
    charisma: number;
  };
  
  inventory: InventoryItem[];
  spells: Spell[];
  conditions: string[];
  features: string[];
}

export interface InventoryItem {
  id: string;
  name: string;
  type: string;
  quantity: number;
  equipped: boolean;
  description: string;
}

export interface Spell {
  name: string;
  level: number;
  school: string;
  castingTime: string;
  range: string;
  components: string;
  duration: string;
  description: string;
  prepared?: boolean;
}

export interface Enemy {
  id: string;
  name: string;
  hp: number;
  maxHp: number;
  ac: number;
  initiative: number;
}

export interface GameState {
  inCombat: boolean;
  currentTurn: string | null;
  enemies: Enemy[];
  narrative: string;
  location: string;
}

export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}
