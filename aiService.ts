import { Character, GameState, Message } from '../types/game';

const SYSTEM_PROMPT = `You are an expert Dungeon Master for D&D 5th Edition. You have complete control over the game world and the player's character stats.

You can modify ANY aspect of the character by using the provided functions. This includes:
- HP, ability scores, AC, and all stats
- Inventory (add/remove items, change quantities, equip/unequip)
- Spell slots (use/restore)
- Experience and leveling up
- Conditions and status effects
- Spell lists and features

CRITICAL ADVENTURE CUSTOMIZATION:
- You MUST pay close attention to the "Adventure Description" provided in the Adventure Preferences
- Your entire narrative, tone, encounters, and setting MUST match what the player specifically requested
- If they asked for horror, make it genuinely scary and atmospheric
- If they asked for political intrigue, focus on social dynamics and court politics
- If they asked for a specific setting or theme, fully commit to that theme
- Always reference and incorporate the character's backstory into the adventure naturally

IMPORTANT RULES:
1. Be creative and descriptive in your narration - match the tone to the requested adventure type
2. Ask for rolls when appropriate (perception, stealth, attack, etc.)
3. Modify character stats dynamically based on what happens
4. Award XP for completing encounters and creative solutions
5. Add loot to inventory after defeating enemies or finding treasure
6. Use spell slots when the player casts spells
7. Apply conditions (poisoned, frightened, etc.) when relevant
8. Manage combat encounters with initiative and turn order
9. Create interesting NPCs and dialogue
10. Make the world feel alive and responsive

When combat starts, create enemies and track initiative. When the player takes damage, reduce their HP. When they find items, add them to inventory. When they level up, increase their stats appropriately.

Be an engaging, fair, and exciting DM that delivers EXACTLY the adventure the player asked for!`;

interface AIFunction {
  name: string;
  description: string;
  parameters: any;
}

const AVAILABLE_FUNCTIONS: AIFunction[] = [
  {
    name: 'modify_hp',
    description: 'Modify the character\'s hit points (healing or damage)',
    parameters: {
      type: 'object',
      properties: {
        amount: {
          type: 'number',
          description: 'The amount to change HP by (positive for healing, negative for damage)'
        },
        temporary: {
          type: 'number',
          description: 'Temporary HP to add (optional)'
        }
      },
      required: ['amount']
    }
  },
  {
    name: 'modify_ability_score',
    description: 'Modify an ability score',
    parameters: {
      type: 'object',
      properties: {
        ability: {
          type: 'string',
          enum: ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma']
        },
        value: {
          type: 'number',
          description: 'The new value for the ability score'
        }
      },
      required: ['ability', 'value']
    }
  },
  {
    name: 'add_inventory_item',
    description: 'Add an item to the character\'s inventory',
    parameters: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        type: { type: 'string', description: 'weapon, armor, consumable, currency, quest, etc.' },
        quantity: { type: 'number' },
        description: { type: 'string' },
        equipped: { type: 'boolean' }
      },
      required: ['name', 'type', 'quantity', 'description']
    }
  },
  {
    name: 'remove_inventory_item',
    description: 'Remove or reduce quantity of an item from inventory',
    parameters: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        quantity: { type: 'number', description: 'Amount to remove' }
      },
      required: ['name', 'quantity']
    }
  },
  {
    name: 'modify_spell_slots',
    description: 'Use or restore spell slots',
    parameters: {
      type: 'object',
      properties: {
        level: { type: 'number', minimum: 1, maximum: 9 },
        change: { type: 'number', description: 'Positive to restore, negative to use' }
      },
      required: ['level', 'change']
    }
  },
  {
    name: 'add_experience',
    description: 'Award experience points to the character',
    parameters: {
      type: 'object',
      properties: {
        amount: { type: 'number' }
      },
      required: ['amount']
    }
  },
  {
    name: 'level_up',
    description: 'Level up the character with new stats',
    parameters: {
      type: 'object',
      properties: {
        newMaxHP: { type: 'number' },
        newSpellSlots: { type: 'object' },
        newFeatures: { type: 'array', items: { type: 'string' } }
      },
      required: ['newMaxHP']
    }
  },
  {
    name: 'add_condition',
    description: 'Add a condition or status effect to the character',
    parameters: {
      type: 'object',
      properties: {
        condition: { type: 'string', description: 'e.g., poisoned, frightened, stunned, blessed' }
      },
      required: ['condition']
    }
  },
  {
    name: 'remove_condition',
    description: 'Remove a condition from the character',
    parameters: {
      type: 'object',
      properties: {
        condition: { type: 'string' }
      },
      required: ['condition']
    }
  },
  {
    name: 'start_combat',
    description: 'Start a combat encounter with enemies',
    parameters: {
      type: 'object',
      properties: {
        enemies: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              hp: { type: 'number' },
              maxHp: { type: 'number' },
              ac: { type: 'number' },
              initiative: { type: 'number' }
            }
          }
        }
      },
      required: ['enemies']
    }
  },
  {
    name: 'end_combat',
    description: 'End the current combat encounter',
    parameters: {
      type: 'object',
      properties: {}
    }
  },
  {
    name: 'modify_enemy_hp',
    description: 'Modify an enemy\'s hit points',
    parameters: {
      type: 'object',
      properties: {
        enemyName: { type: 'string' },
        amount: { type: 'number', description: 'Positive for healing, negative for damage' }
      },
      required: ['enemyName', 'amount']
    }
  },
  {
    name: 'update_location',
    description: 'Change the character\'s current location',
    parameters: {
      type: 'object',
      properties: {
        location: { type: 'string' }
      },
      required: ['location']
    }
  },
  {
    name: 'add_spell',
    description: 'Add a spell to the character\'s spell list',
    parameters: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        level: { type: 'number' },
        school: { type: 'string' },
        castingTime: { type: 'string' },
        range: { type: 'string' },
        components: { type: 'string' },
        duration: { type: 'string' },
        description: { type: 'string' }
      },
      required: ['name', 'level', 'school', 'castingTime', 'range', 'components', 'duration', 'description']
    }
  }
];

export async function callAI(
  provider: string,
  apiKey: string,
  messages: Message[],
  character: Character,
  gameState: GameState,
  setCharacter: (char: Character) => void,
  setGameState: (state: GameState) => void,
  adventurePreferences?: any
): Promise<string> {
  
  let adventureContext = '';
  if (adventurePreferences) {
    adventureContext = `
Adventure Preferences:
- Adventure Description: ${adventurePreferences.adventureDescription || 'Classic D&D adventure'}
- Character Backstory: ${adventurePreferences.backstory || 'No backstory provided'}

IMPORTANT: Use this information to create a personalized, engaging adventure. Reference the backstory when appropriate and create scenarios that fit the player's requested adventure style. Make the adventure immersive and tailored to what they asked for.
`;
  }

  const characterContext = `
Current Character State:
- HP: ${character.hitPoints.current}/${character.hitPoints.max}
- Level: ${character.level}, XP: ${character.experience}/${character.experienceToNextLevel}
- Stats: STR ${character.abilities.strength}, DEX ${character.abilities.dexterity}, CON ${character.abilities.constitution}, INT ${character.abilities.intelligence}, WIS ${character.abilities.wisdom}, CHA ${character.abilities.charisma}
- AC: ${character.armorClass}
- Inventory: ${character.inventory.map(i => `${i.name} (${i.quantity})`).join(', ')}
- Conditions: ${character.conditions.join(', ') || 'None'}
- In Combat: ${gameState.inCombat}
- Location: ${gameState.location}
${gameState.enemies.length > 0 ? `- Enemies: ${gameState.enemies.map(e => `${e.name} (HP: ${e.hp}/${e.maxHp})`).join(', ')}` : ''}
`;

  if (provider === 'openai') {
    return callOpenAI(apiKey, messages, characterContext, adventureContext, character, gameState, setCharacter, setGameState);
  } else if (provider === 'anthropic') {
    return callAnthropic(apiKey, messages, characterContext, adventureContext, character, gameState, setCharacter, setGameState);
  } else if (provider === 'deepseek') {
    return callDeepSeek(apiKey, messages, characterContext, adventureContext, character, gameState, setCharacter, setGameState);
  }
  
  throw new Error('Unsupported AI provider');
}

async function callOpenAI(
  apiKey: string,
  messages: Message[],
  characterContext: string,
  adventureContext: string,
  character: Character,
  gameState: GameState,
  setCharacter: (char: Character) => void,
  setGameState: (state: GameState) => void
): Promise<string> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT + '\n\n' + adventureContext + '\n\n' + characterContext },
        ...messages
      ],
      functions: AVAILABLE_FUNCTIONS,
      function_call: 'auto',
      temperature: 0.9
    })
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.statusText}`);
  }

  const data = await response.json();
  const message = data.choices[0].message;

  // Handle function calls
  if (message.function_call) {
    const functionName = message.function_call.name;
    const functionArgs = JSON.parse(message.function_call.arguments);
    
    executeFunctionCall(functionName, functionArgs, character, gameState, setCharacter, setGameState);

    // Make another call to get the narrative response
    const followUpResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT + '\n\n' + adventureContext + '\n\n' + characterContext },
          ...messages,
          message,
          {
            role: 'function',
            name: functionName,
            content: JSON.stringify({ success: true })
          }
        ],
        temperature: 0.9
      })
    });

    const followUpData = await followUpResponse.json();
    return followUpData.choices[0].message.content;
  }

  return message.content;
}

async function callAnthropic(
  apiKey: string,
  messages: Message[],
  characterContext: string,
  adventureContext: string,
  character: Character,
  gameState: GameState,
  setCharacter: (char: Character) => void,
  setGameState: (state: GameState) => void
): Promise<string> {
  // Convert functions to Claude's tool format
  const tools = AVAILABLE_FUNCTIONS.map(fn => ({
    name: fn.name,
    description: fn.description,
    input_schema: fn.parameters
  }));

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 4096,
      system: SYSTEM_PROMPT + '\n\n' + adventureContext + '\n\n' + characterContext,
      messages: messages.filter(m => m.role !== 'system'),
      tools: tools,
      temperature: 0.9
    })
  });

  if (!response.ok) {
    throw new Error(`Anthropic API error: ${response.statusText}`);
  }

  const data = await response.json();
  
  // Handle tool use
  let finalText = '';
  const toolUses = data.content.filter((block: any) => block.type === 'tool_use');
  const textBlocks = data.content.filter((block: any) => block.type === 'text');
  
  for (const toolUse of toolUses) {
    executeFunctionCall(toolUse.name, toolUse.input, character, gameState, setCharacter, setGameState);
  }
  
  for (const textBlock of textBlocks) {
    finalText += textBlock.text;
  }

  if (toolUses.length > 0 && !finalText) {
    // If only tools were used, make another call for narrative
    const followUpResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 4096,
        system: SYSTEM_PROMPT + '\n\n' + adventureContext + '\n\n' + characterContext,
        messages: [
          ...messages.filter(m => m.role !== 'system'),
          {
            role: 'assistant',
            content: data.content
          },
          {
            role: 'user',
            content: 'Please describe what just happened.'
          }
        ],
        temperature: 0.9
      })
    });

    const followUpData = await followUpResponse.json();
    finalText = followUpData.content.find((block: any) => block.type === 'text')?.text || '';
  }

  return finalText || data.content[0]?.text || 'The dungeon master ponders...';
}

async function callDeepSeek(
  apiKey: string,
  messages: Message[],
  characterContext: string,
  adventureContext: string,
  character: Character,
  gameState: GameState,
  setCharacter: (char: Character) => void,
  setGameState: (state: GameState) => void
): Promise<string> {
  // DeepSeek uses OpenAI-compatible API
  const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT + '\n\n' + adventureContext + '\n\n' + characterContext },
        ...messages
      ],
      tools: AVAILABLE_FUNCTIONS.map(fn => ({
        type: 'function',
        function: fn
      })),
      temperature: 0.9
    })
  });

  if (!response.ok) {
    throw new Error(`DeepSeek API error: ${response.statusText}`);
  }

  const data = await response.json();
  const message = data.choices[0].message;

  // Handle tool calls
  if (message.tool_calls && message.tool_calls.length > 0) {
    for (const toolCall of message.tool_calls) {
      const functionName = toolCall.function.name;
      const functionArgs = JSON.parse(toolCall.function.arguments);
      
      executeFunctionCall(functionName, functionArgs, character, gameState, setCharacter, setGameState);
    }

    // Make another call to get the narrative response
    const followUpResponse = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT + '\n\n' + adventureContext + '\n\n' + characterContext },
          ...messages,
          message,
          ...message.tool_calls.map((tc: any) => ({
            role: 'tool',
            tool_call_id: tc.id,
            content: JSON.stringify({ success: true })
          }))
        ],
        temperature: 0.9
      })
    });

    const followUpData = await followUpResponse.json();
    return followUpData.choices[0].message.content;
  }

  return message.content;
}

function executeFunctionCall(
  functionName: string,
  args: any,
  character: Character,
  gameState: GameState,
  setCharacter: (char: Character) => void,
  setGameState: (state: GameState) => void
) {
  const updatedCharacter = { ...character };
  const updatedGameState = { ...gameState };

  switch (functionName) {
    case 'modify_hp':
      updatedCharacter.hitPoints.current = Math.max(
        0,
        Math.min(
          updatedCharacter.hitPoints.max,
          updatedCharacter.hitPoints.current + args.amount
        )
      );
      if (args.temporary) {
        updatedCharacter.hitPoints.temporary = args.temporary;
      }
      break;

    case 'modify_ability_score':
      updatedCharacter.abilities[args.ability as keyof typeof updatedCharacter.abilities] = args.value;
      break;

    case 'add_inventory_item':
      const existingItem = updatedCharacter.inventory.find(i => i.name === args.name);
      if (existingItem) {
        existingItem.quantity += args.quantity;
      } else {
        updatedCharacter.inventory.push({
          id: Date.now().toString(),
          name: args.name,
          type: args.type,
          quantity: args.quantity,
          description: args.description,
          equipped: args.equipped || false
        });
      }
      break;

    case 'remove_inventory_item':
      const itemIndex = updatedCharacter.inventory.findIndex(i => i.name === args.name);
      if (itemIndex !== -1) {
        updatedCharacter.inventory[itemIndex].quantity -= args.quantity;
        if (updatedCharacter.inventory[itemIndex].quantity <= 0) {
          updatedCharacter.inventory.splice(itemIndex, 1);
        }
      }
      break;

    case 'modify_spell_slots':
      const level = args.level;
      updatedCharacter.spellSlots[level].current = Math.max(
        0,
        Math.min(
          updatedCharacter.spellSlots[level].max,
          updatedCharacter.spellSlots[level].current + args.change
        )
      );
      break;

    case 'add_experience':
      updatedCharacter.experience += args.amount;
      break;

    case 'level_up':
      updatedCharacter.level += 1;
      updatedCharacter.experience = 0;
      updatedCharacter.experienceToNextLevel = updatedCharacter.level * 300;
      updatedCharacter.hitPoints.max = args.newMaxHP;
      updatedCharacter.hitPoints.current = args.newMaxHP;
      if (args.newSpellSlots) {
        Object.assign(updatedCharacter.spellSlots, args.newSpellSlots);
      }
      if (args.newFeatures) {
        updatedCharacter.features.push(...args.newFeatures);
      }
      break;

    case 'add_condition':
      if (!updatedCharacter.conditions.includes(args.condition)) {
        updatedCharacter.conditions.push(args.condition);
      }
      break;

    case 'remove_condition':
      updatedCharacter.conditions = updatedCharacter.conditions.filter(c => c !== args.condition);
      break;

    case 'start_combat':
      updatedGameState.inCombat = true;
      updatedGameState.enemies = args.enemies.map((e: any, i: number) => ({
        id: `enemy_${Date.now()}_${i}`,
        ...e
      }));
      break;

    case 'end_combat':
      updatedGameState.inCombat = false;
      updatedGameState.enemies = [];
      updatedGameState.currentTurn = null;
      break;

    case 'modify_enemy_hp':
      const enemy = updatedGameState.enemies.find(e => e.name === args.enemyName);
      if (enemy) {
        enemy.hp = Math.max(0, Math.min(enemy.maxHp, enemy.hp + args.amount));
        // Remove dead enemies
        updatedGameState.enemies = updatedGameState.enemies.filter(e => e.hp > 0);
        if (updatedGameState.enemies.length === 0) {
          updatedGameState.inCombat = false;
        }
      }
      break;

    case 'update_location':
      updatedGameState.location = args.location;
      break;

    case 'add_spell':
      updatedCharacter.spells.push({
        name: args.name,
        level: args.level,
        school: args.school,
        castingTime: args.castingTime,
        range: args.range,
        components: args.components,
        duration: args.duration,
        description: args.description
      });
      break;
  }

  setCharacter(updatedCharacter);
  setGameState(updatedGameState);
}