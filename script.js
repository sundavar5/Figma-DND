const { useState, useEffect, useRef } = React;

// ==================== CONSTANTS ====================
const CLASSES = [
    { name: 'Barbarian', hitDie: 'd12', spellcaster: false },
    { name: 'Bard', hitDie: 'd8', spellcaster: true },
    { name: 'Cleric', hitDie: 'd8', spellcaster: true },
    { name: 'Druid', hitDie: 'd8', spellcaster: true },
    { name: 'Fighter', hitDie: 'd10', spellcaster: false },
    { name: 'Monk', hitDie: 'd8', spellcaster: false },
    { name: 'Paladin', hitDie: 'd10', spellcaster: true },
    { name: 'Ranger', hitDie: 'd10', spellcaster: true },
    { name: 'Rogue', hitDie: 'd8', spellcaster: false },
    { name: 'Sorcerer', hitDie: 'd6', spellcaster: true },
    { name: 'Warlock', hitDie: 'd8', spellcaster: true },
    { name: 'Wizard', hitDie: 'd6', spellcaster: true }
];

const RACES = [
    'Human', 'Elf', 'Dwarf', 'Halfling', 'Dragonborn',
    'Gnome', 'Half-Elf', 'Half-Orc', 'Tiefling'
];

const SPELL_LIST = {
    'Wizard': ['Magic Missile', 'Shield', 'Mage Armor', 'Detect Magic', 'Fireball', 'Counterspell'],
    'Cleric': ['Cure Wounds', 'Bless', 'Sacred Flame', 'Spiritual Weapon', 'Guiding Bolt', 'Prayer of Healing'],
    'Sorcerer': ['Burning Hands', 'Magic Missile', 'Shield', 'Chromatic Orb', 'Scorching Ray', 'Haste'],
    'Warlock': ['Eldritch Blast', 'Hex', 'Armor of Agathys', 'Hellish Rebuke', 'Hunger of Hadar', 'Counterspell'],
    'Druid': ['Goodberry', 'Healing Word', 'Entangle', 'Moonbeam', 'Call Lightning', 'Conjure Animals'],
    'Bard': ['Vicious Mockery', 'Healing Word', 'Thunderwave', 'Heat Metal', 'Hypnotic Pattern', 'Polymorph'],
    'Paladin': ['Bless', 'Cure Wounds', 'Divine Smite', 'Lesser Restoration', 'Aid', 'Find Steed'],
    'Ranger': ['Hunter\'s Mark', 'Cure Wounds', 'Ensnaring Strike', 'Pass Without Trace', 'Spike Growth', 'Conjure Animals']
};

// ==================== AI SERVICE ====================
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

const AVAILABLE_FUNCTIONS = [
    {
        name: 'modify_hp',
        description: 'Modify the character\'s hit points (healing or damage)',
        parameters: {
            type: 'object',
            properties: {
                amount: { type: 'number', description: 'The amount to change HP by (positive for healing, negative for damage)' },
                temporary: { type: 'number', description: 'Temporary HP to add (optional)' }
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
                ability: { type: 'string', enum: ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'] },
                value: { type: 'number', description: 'The new value for the ability score' }
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
                type: { type: 'string' },
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
                quantity: { type: 'number' }
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
            properties: { amount: { type: 'number' } },
            required: ['amount']
        }
    },
    {
        name: 'level_up',
        description: 'Level up the character',
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
        description: 'Add a condition to the character',
        parameters: {
            type: 'object',
            properties: {
                condition: { type: 'string' }
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
                            ac: { type: 'number' }
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
        parameters: { type: 'object', properties: {} }
    },
    {
        name: 'modify_enemy_hp',
        description: 'Modify an enemy\'s hit points',
        parameters: {
            type: 'object',
            properties: {
                enemyName: { type: 'string' },
                amount: { type: 'number' }
            },
            required: ['enemyName', 'amount']
        }
    },
    {
        name: 'update_location',
        description: 'Change the character\'s current location',
        parameters: {
            type: 'object',
            properties: { location: { type: 'string' } },
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
                description: { type: 'string' }
            },
            required: ['name', 'level', 'description']
        }
    }
];

function executeFunctionCall(functionName, args, character, gameState, setCharacter, setGameState) {
    const updatedCharacter = { ...character };
    const updatedGameState = { ...gameState };

    switch (functionName) {
        case 'modify_hp':
            updatedCharacter.hitPoints.current = Math.max(0, Math.min(updatedCharacter.hitPoints.max, updatedCharacter.hitPoints.current + args.amount));
            if (args.temporary) updatedCharacter.hitPoints.temporary = args.temporary;
            break;

        case 'modify_ability_score':
            updatedCharacter.abilities[args.ability] = args.value;
            break;

        case 'add_inventory_item':
            const existingItem = updatedCharacter.inventory.find(i => i.name === args.name);
            if (existingItem) {
                existingItem.quantity += args.quantity;
            } else {
                updatedCharacter.inventory.push({ id: Date.now().toString(), ...args, equipped: args.equipped || false });
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
            if (updatedCharacter.spellSlots[args.level]) {
                updatedCharacter.spellSlots[args.level].current = Math.max(0, Math.min(updatedCharacter.spellSlots[args.level].max, updatedCharacter.spellSlots[args.level].current + args.change));
            }
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
            updatedGameState.enemies = args.enemies.map((e, i) => ({ id: `enemy_${Date.now()}_${i}`, ...e }));
            break;

        case 'end_combat':
            updatedGameState.inCombat = false;
            updatedGameState.enemies = [];
            break;

        case 'modify_enemy_hp':
            const enemy = updatedGameState.enemies.find(e => e.name === args.enemyName);
            if (enemy) {
                enemy.hp = Math.max(0, Math.min(enemy.maxHp, enemy.hp + args.amount));
                updatedGameState.enemies = updatedGameState.enemies.filter(e => e.hp > 0);
                if (updatedGameState.enemies.length === 0) updatedGameState.inCombat = false;
            }
            break;

        case 'update_location':
            updatedGameState.location = args.location;
            break;

        case 'add_spell':
            updatedCharacter.spells.push({
                name: args.name,
                level: args.level,
                school: 'Evocation',
                castingTime: '1 action',
                range: '60 ft',
                components: 'V, S',
                duration: 'Instantaneous',
                description: args.description,
                prepared: true
            });
            break;
    }

    setCharacter(updatedCharacter);
    setGameState(updatedGameState);
}

async function callOpenAI(apiKey, messages, context, character, gameState, setCharacter, setGameState) {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
            model: 'gpt-4o',
            messages: [
                { role: 'system', content: SYSTEM_PROMPT + '\n\n' + context },
                ...messages
            ],
            functions: AVAILABLE_FUNCTIONS,
            function_call: 'auto',
            temperature: 0.9
        })
    });

    if (!response.ok) throw new Error(`OpenAI API error: ${response.statusText}`);

    const data = await response.json();
    const message = data.choices[0].message;

    if (message.function_call) {
        const functionName = message.function_call.name;
        const functionArgs = JSON.parse(message.function_call.arguments);
        executeFunctionCall(functionName, functionArgs, character, gameState, setCharacter, setGameState);

        const followUpResponse = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: 'gpt-4o',
                messages: [
                    { role: 'system', content: SYSTEM_PROMPT + '\n\n' + context },
                    ...messages,
                    message,
                    { role: 'function', name: functionName, content: JSON.stringify({ success: true }) }
                ],
                temperature: 0.9
            })
        });

        const followUpData = await followUpResponse.json();
        return followUpData.choices[0].message.content;
    }

    return message.content;
}

async function callAnthropic(apiKey, messages, context, character, gameState, setCharacter, setGameState) {
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
            system: SYSTEM_PROMPT + '\n\n' + context,
            messages: messages.filter(m => m.role !== 'system'),
            tools: tools,
            temperature: 0.9
        })
    });

    if (!response.ok) throw new Error(`Anthropic API error: ${response.statusText}`);

    const data = await response.json();
    let finalText = '';
    const toolUses = data.content.filter(block => block.type === 'tool_use');
    const textBlocks = data.content.filter(block => block.type === 'text');

    for (const toolUse of toolUses) {
        executeFunctionCall(toolUse.name, toolUse.input, character, gameState, setCharacter, setGameState);
    }

    for (const textBlock of textBlocks) {
        finalText += textBlock.text;
    }

    return finalText || data.content[0]?.text || 'The dungeon master ponders...';
}

async function callDeepSeek(apiKey, messages, context, character, gameState, setCharacter, setGameState) {
    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
            model: 'deepseek-chat',
            messages: [
                { role: 'system', content: SYSTEM_PROMPT + '\n\n' + context },
                ...messages
            ],
            tools: AVAILABLE_FUNCTIONS.map(fn => ({ type: 'function', function: fn })),
            temperature: 0.9
        })
    });

    if (!response.ok) throw new Error(`DeepSeek API error: ${response.statusText}`);

    const data = await response.json();
    const message = data.choices[0].message;

    if (message.tool_calls && message.tool_calls.length > 0) {
        for (const toolCall of message.tool_calls) {
            const functionName = toolCall.function.name;
            const functionArgs = JSON.parse(toolCall.function.arguments);
            executeFunctionCall(functionName, functionArgs, character, gameState, setCharacter, setGameState);
        }

        const followUpResponse = await fetch('https://api.deepseek.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: 'deepseek-chat',
                messages: [
                    { role: 'system', content: SYSTEM_PROMPT + '\n\n' + context },
                    ...messages,
                    message,
                    ...message.tool_calls.map(tc => ({
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

async function callAI(provider, apiKey, messages, character, gameState, setCharacter, setGameState, adventurePreferences) {
    let adventureContext = '';
    if (adventurePreferences) {
        adventureContext = `
Adventure Preferences:
- Adventure Description: ${adventurePreferences.adventureDescription || 'Classic D&D adventure'}
- Character Backstory: ${adventurePreferences.backstory || 'No backstory provided'}

IMPORTANT: Use this information to create a personalized, engaging adventure. Reference the backstory when appropriate and create scenarios that fit the player's requested adventure style.
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

    const fullContext = adventureContext + '\n\n' + characterContext;

    if (provider === 'openai') {
        return callOpenAI(apiKey, messages, fullContext, character, gameState, setCharacter, setGameState);
    } else if (provider === 'anthropic') {
        return callAnthropic(apiKey, messages, fullContext, character, gameState, setCharacter, setGameState);
    } else if (provider === 'deepseek') {
        return callDeepSeek(apiKey, messages, fullContext, character, gameState, setCharacter, setGameState);
    }

    throw new Error('Unsupported AI provider');
}

// ==================== COMPONENTS ====================

function ApiKeySetup({ onSetup }) {
    const [provider, setProvider] = useState('openai');
    const [apiKey, setApiKey] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (apiKey.trim()) {
            onSetup({ provider, apiKey });
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <div className="w-full max-w-md card">
                <h2 className="text-xl font-semibold mb-2">AI Dungeon Master Setup</h2>
                <p className="text-slate-300 text-sm mb-6">
                    Enter your API key to begin your adventure. Your key is stored locally in your browser.
                </p>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="text-sm block mb-2">AI Provider</label>
                        <select
                            value={provider}
                            onChange={(e) => setProvider(e.target.value)}
                            className="w-full"
                        >
                            <option value="openai">OpenAI (GPT-4)</option>
                            <option value="anthropic">Anthropic (Claude)</option>
                            <option value="deepseek">DeepSeek</option>
                        </select>
                    </div>

                    <div>
                        <label className="text-sm block mb-2">API Key</label>
                        <input
                            type="password"
                            placeholder="sk-..."
                            value={apiKey}
                            onChange={(e) => setApiKey(e.target.value)}
                        />
                        <p className="text-slate-400 text-xs mt-2">
                            {provider === 'openai' && 'Get your key from platform.openai.com'}
                            {provider === 'anthropic' && 'Get your key from console.anthropic.com'}
                            {provider === 'deepseek' && 'Get your key from platform.deepseek.com'}
                        </p>
                    </div>

                    <button type="submit" className="w-full btn-primary">
                        Begin Adventure
                    </button>
                </form>
            </div>
        </div>
    );
}

function CharacterCreator({ onComplete }) {
    const [step, setStep] = useState(1);
    const [name, setName] = useState('');
    const [selectedClass, setSelectedClass] = useState('Fighter');
    const [race, setRace] = useState('Human');
    const [backstory, setBackstory] = useState('');
    const [adventureDescription, setAdventureDescription] = useState('');
    const [selectedSpells, setSelectedSpells] = useState([]);
    const [stats, setStats] = useState({
        strength: 10, dexterity: 10, constitution: 10,
        intelligence: 10, wisdom: 10, charisma: 10
    });

    const pointsUsed = Object.values(stats).reduce((sum, val) => sum + (val - 8), 0);
    const maxPoints = 27;

    const incrementStat = (stat) => {
        if (stats[stat] < 15 && pointsUsed < maxPoints) {
            setStats({ ...stats, [stat]: stats[stat] + 1 });
        }
    };

    const decrementStat = (stat) => {
        if (stats[stat] > 8) {
            setStats({ ...stats, [stat]: stats[stat] - 1 });
        }
    };

    const toggleSpell = (spell) => {
        if (selectedSpells.includes(spell)) {
            setSelectedSpells(selectedSpells.filter(s => s !== spell));
        } else if (selectedSpells.length < 6) {
            setSelectedSpells([...selectedSpells, spell]);
        }
    };

    const createCharacter = () => {
        const classInfo = CLASSES.find(c => c.name === selectedClass);
        const isSpellcaster = classInfo.spellcaster;
        const conMod = Math.floor((stats.constitution - 10) / 2);
        const maxHP = parseInt(classInfo.hitDie.substring(1)) + conMod;

        const character = {
            name, race, class: selectedClass, level: 1, experience: 0, experienceToNextLevel: 300,
            abilities: stats,
            hitPoints: { current: maxHP, max: maxHP, temporary: 0 },
            armorClass: 10 + Math.floor((stats.dexterity - 10) / 2),
            initiative: Math.floor((stats.dexterity - 10) / 2),
            speed: 30,
            proficiencyBonus: 2,
            hitDice: { current: 1, max: 1, type: classInfo.hitDie },
            spellSlots: isSpellcaster ? {
                1: { current: 2, max: 2 }, 2: { current: 0, max: 0 }, 3: { current: 0, max: 0 },
                4: { current: 0, max: 0 }, 5: { current: 0, max: 0 }, 6: { current: 0, max: 0 },
                7: { current: 0, max: 0 }, 8: { current: 0, max: 0 }, 9: { current: 0, max: 0 }
            } : {
                1: { current: 0, max: 0 }, 2: { current: 0, max: 0 }, 3: { current: 0, max: 0 },
                4: { current: 0, max: 0 }, 5: { current: 0, max: 0 }, 6: { current: 0, max: 0 },
                7: { current: 0, max: 0 }, 8: { current: 0, max: 0 }, 9: { current: 0, max: 0 }
            },
            skills: {},
            savingThrows: {
                strength: Math.floor((stats.strength - 10) / 2),
                dexterity: Math.floor((stats.dexterity - 10) / 2),
                constitution: Math.floor((stats.constitution - 10) / 2),
                intelligence: Math.floor((stats.intelligence - 10) / 2),
                wisdom: Math.floor((stats.wisdom - 10) / 2),
                charisma: Math.floor((stats.charisma - 10) / 2)
            },
            inventory: [
                { id: '1', name: 'Basic Weapon', type: 'weapon', quantity: 1, equipped: true, description: 'A simple weapon' },
                { id: '2', name: 'Leather Armor', type: 'armor', quantity: 1, equipped: true, description: 'Light armor' },
                { id: '3', name: 'Adventurer\'s Pack', type: 'gear', quantity: 1, equipped: false, description: 'Basic supplies' },
                { id: '4', name: 'Gold', type: 'currency', quantity: 50, equipped: false, description: 'Currency' }
            ],
            spells: selectedSpells.map(spellName => ({
                name: spellName, level: 1, school: 'Evocation',
                castingTime: '1 action', range: '60 ft', components: 'V, S',
                duration: 'Instantaneous', description: `${spellName} spell effect`, prepared: true
            })),
            conditions: [],
            features: [`${selectedClass} class features`]
        };

        onComplete(character, { backstory, adventureDescription });
    };

    const classInfo = CLASSES.find(c => c.name === selectedClass);

    return (
        <div className="min-h-screen text-white flex items-center justify-center p-4">
            <div className="w-full max-w-3xl card">
                <h2 className="text-xl font-semibold mb-2">Create Your Character</h2>
                <p className="text-slate-300 text-sm mb-6">Step {step} of 5</p>

                {step === 1 && (
                    <div className="space-y-6">
                        <div>
                            <label className="text-sm block mb-2">Character Name</label>
                            <input
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Enter character name"
                            />
                        </div>

                        <div>
                            <label className="text-sm block mb-2">Class</label>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                {CLASSES.map((cls) => (
                                    <button
                                        key={cls.name}
                                        type="button"
                                        onClick={() => setSelectedClass(cls.name)}
                                        className={`class-btn ${selectedClass === cls.name ? 'selected' : ''}`}
                                    >
                                        <div className="text-sm">{cls.name}</div>
                                        <div className="text-slate-400 text-xs">Hit Die: {cls.hitDie}</div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="text-sm block mb-2">Race</label>
                            <select value={race} onChange={(e) => setRace(e.target.value)}>
                                {RACES.map((r) => <option key={r} value={r}>{r}</option>)}
                            </select>
                        </div>

                        <button onClick={() => setStep(2)} className="w-full btn-primary">
                            Next: Ability Scores
                        </button>
                    </div>
                )}

                {step === 2 && (
                    <div className="space-y-6">
                        <div>
                            <div className="flex justify-between mb-4">
                                <span>Point Buy System</span>
                                <span>
                                    Points: <span className={pointsUsed > maxPoints ? 'text-red-400' : 'text-green-400'}>
                                        {pointsUsed}/{maxPoints}
                                    </span>
                                </span>
                            </div>

                            <div className="space-y-3">
                                {Object.entries(stats).map(([stat, value]) => (
                                    <div key={stat} className="stat-row">
                                        <span className="capitalize">{stat}</span>
                                        <div className="stat-controls">
                                            <button
                                                type="button"
                                                onClick={() => decrementStat(stat)}
                                                disabled={value <= 8}
                                                className="stat-btn"
                                            >
                                                -
                                            </button>
                                            <span className="stat-value">{value}</span>
                                            <button
                                                type="button"
                                                onClick={() => incrementStat(stat)}
                                                disabled={value >= 15 || pointsUsed >= maxPoints}
                                                className="stat-btn"
                                            >
                                                +
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="flex gap-2">
                            <button onClick={() => setStep(1)} className="flex-1 btn-secondary">
                                Back
                            </button>
                            <button
                                onClick={() => setStep(3)}
                                disabled={pointsUsed > maxPoints}
                                className="flex-1 btn-primary"
                            >
                                Next: {classInfo.spellcaster ? 'Spells' : 'Story'}
                            </button>
                        </div>
                    </div>
                )}

                {step === 3 && (
                    <div className="space-y-6">
                        {classInfo.spellcaster ? (
                            <>
                                <div>
                                    <label className="text-sm block mb-2">
                                        Select Starting Spells (up to 6)
                                    </label>
                                    <p className="text-slate-400 text-sm mb-4">Selected: {selectedSpells.length}/6</p>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                        {SPELL_LIST[selectedClass]?.map((spell) => (
                                            <button
                                                key={spell}
                                                type="button"
                                                onClick={() => toggleSpell(spell)}
                                                className={`spell-btn ${selectedSpells.includes(spell) ? 'selected' : ''}`}
                                            >
                                                <span className="text-sm">{spell}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => setStep(2)} className="flex-1 btn-secondary">Back</button>
                                    <button onClick={() => setStep(4)} className="flex-1 btn-primary">Next: Story</button>
                                </div>
                            </>
                        ) : (
                            <div className="text-center py-8">
                                <p className="text-slate-400 mb-4">{selectedClass}s don't use spells</p>
                                <div className="flex gap-2">
                                    <button onClick={() => setStep(2)} className="flex-1 btn-secondary">Back</button>
                                    <button onClick={() => setStep(4)} className="flex-1 btn-primary">Next: Story</button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {step === 4 && (
                    <div className="space-y-6">
                        <div>
                            <label className="text-sm block mb-2">Character Backstory</label>
                            <textarea
                                value={backstory}
                                onChange={(e) => setBackstory(e.target.value)}
                                placeholder="Tell us about your character's past, motivations, and personality..."
                                className="min-h-150"
                            />
                            <p className="text-slate-400 text-xs mt-2">The AI will use this to create a personalized adventure</p>
                        </div>

                        <div className="flex gap-2">
                            <button onClick={() => setStep(classInfo.spellcaster ? 3 : 2)} className="flex-1 btn-secondary">Back</button>
                            <button onClick={() => setStep(5)} className="flex-1 btn-primary">Next: Adventure Type</button>
                        </div>
                    </div>
                )}

                {step === 5 && (
                    <div className="space-y-6">
                        <div>
                            <label className="text-sm block mb-2">What kind of adventure do you want?</label>
                            <textarea
                                value={adventureDescription}
                                onChange={(e) => setAdventureDescription(e.target.value)}
                                placeholder="Describe the type of adventure you want to experience... (e.g., 'A dark horror adventure in a haunted mansion', 'A political intrigue campaign in a royal court', 'An epic quest to save the world from an ancient dragon')"
                                className="min-h-150"
                            />
                            <p className="text-slate-400 text-xs mt-2">The AI will create an adventure based on your description and character backstory</p>
                        </div>

                        <div className="flex gap-2">
                            <button onClick={() => setStep(4)} className="flex-1 btn-secondary">Back</button>
                            <button
                                onClick={createCharacter}
                                disabled={!name.trim()}
                                className="flex-1 btn-primary"
                            >
                                Begin Adventure!
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

function CharacterSheet({ character }) {
    const [activeTab, setActiveTab] = useState('stats');

    const getModifier = (score) => {
        const mod = Math.floor((score - 10) / 2);
        return mod >= 0 ? `+${mod}` : `${mod}`;
    };

    return (
        <div className="card">
            <h2 className="text-xl font-semibold mb-2">{character.name}</h2>
            <p className="text-slate-300 mb-4">
                Level {character.level} {character.race} {character.class}
            </p>

            <div className="tabs-list">
                <button
                    className={`tab-trigger ${activeTab === 'stats' ? 'active' : ''}`}
                    onClick={() => setActiveTab('stats')}
                >
                    Stats
                </button>
                <button
                    className={`tab-trigger ${activeTab === 'inventory' ? 'active' : ''}`}
                    onClick={() => setActiveTab('inventory')}
                >
                    Items
                </button>
                <button
                    className={`tab-trigger ${activeTab === 'spells' ? 'active' : ''}`}
                    onClick={() => setActiveTab('spells')}
                >
                    Spells
                </button>
                <button
                    className={`tab-trigger ${activeTab === 'features' ? 'active' : ''}`}
                    onClick={() => setActiveTab('features')}
                >
                    Features
                </button>
            </div>

            <div className={`tab-content ${activeTab === 'stats' ? 'active' : ''}`}>
                <div className="space-y-4">
                    <div className="space-y-2">
                        <div className="flex justify-between items-center">
                            <span>Hit Points</span>
                            <span className="text-red-400">
                                {character.hitPoints.current}/{character.hitPoints.max}
                                {character.hitPoints.temporary > 0 && ` (+${character.hitPoints.temporary})`}
                            </span>
                        </div>
                        <div className="progress-bar">
                            <div
                                className="progress-fill bg-red-500"
                                style={{width: `${(character.hitPoints.current / character.hitPoints.max) * 100}%`}}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <div className="flex justify-between items-center">
                            <span>Experience</span>
                            <span className="text-blue-400">
                                {character.experience}/{character.experienceToNextLevel}
                            </span>
                        </div>
                        <div className="progress-bar">
                            <div
                                className="progress-fill bg-blue-500"
                                style={{width: `${(character.experience / character.experienceToNextLevel) * 100}%`}}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-center">
                        <div>
                            <p className="text-slate-300">AC</p>
                            <p>{character.armorClass}</p>
                        </div>
                        <div>
                            <p className="text-slate-300">Init</p>
                            <p>{character.initiative >= 0 ? '+' : ''}{character.initiative}</p>
                        </div>
                        <div>
                            <p className="text-slate-300">Speed</p>
                            <p>{character.speed} ft</p>
                        </div>
                    </div>

                    <div>
                        <h3 className="mb-2">Ability Scores</h3>
                        <div className="grid grid-cols-3 gap-2">
                            {Object.entries(character.abilities).map(([ability, score]) => (
                                <div key={ability} className="bg-slate-900 p-2 rounded text-center">
                                    <p className="text-slate-400 uppercase text-xs">{ability.slice(0, 3)}</p>
                                    <p>{score}</p>
                                    <p className="text-slate-400 text-sm">{getModifier(score)}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {Object.values(character.spellSlots).some(slot => slot.max > 0) && (
                        <div>
                            <h3 className="mb-2">Spell Slots</h3>
                            <div className="space-y-1">
                                {Object.entries(character.spellSlots).map(([level, slots]) => (
                                    slots.max > 0 && (
                                        <div key={level} className="flex justify-between items-center">
                                            <span className="text-slate-300">Level {level}</span>
                                            <div className="flex gap-1">
                                                {Array.from({ length: slots.max }).map((_, i) => (
                                                    <div
                                                        key={i}
                                                        className={`spell-slot ${i < slots.current ? 'spell-slot-filled' : 'spell-slot-empty'}`}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    )
                                ))}
                            </div>
                        </div>
                    )}

                    {character.conditions.length > 0 && (
                        <div>
                            <h3 className="mb-2">Conditions</h3>
                            <div className="flex flex-wrap gap-1">
                                {character.conditions.map((condition, i) => (
                                    <span key={i} className="badge badge-destructive">{condition}</span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className={`tab-content ${activeTab === 'inventory' ? 'active' : ''}`}>
                <div className="max-h-64 overflow-y-auto space-y-2 pr-4">
                    {character.inventory.map((item) => (
                        <div key={item.id} className="bg-slate-900 p-3 rounded">
                            <div className="flex justify-between items-start">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <span>{item.name}</span>
                                        {item.equipped && <span className="badge badge-secondary">Equipped</span>}
                                    </div>
                                    <p className="text-slate-400 mt-1 text-sm">{item.description}</p>
                                </div>
                                {item.quantity > 1 && (
                                    <span className="text-slate-300">x{item.quantity}</span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className={`tab-content ${activeTab === 'spells' ? 'active' : ''}`}>
                <div className="max-h-64 overflow-y-auto space-y-2 pr-4">
                    {character.spells.length === 0 ? (
                        <p className="text-slate-400 text-center py-8">No spells learned</p>
                    ) : (
                        character.spells.map((spell, i) => (
                            <div key={i} className="bg-slate-900 p-3 rounded">
                                <div className="flex justify-between items-start mb-1">
                                    <span>{spell.name}</span>
                                    <span className="badge badge-info">Level {spell.level}</span>
                                </div>
                                <p className="text-slate-300 mb-2 text-sm">{spell.description}</p>
                                <div className="text-slate-400 text-xs">
                                    <div>Range: {spell.range}</div>
                                    <div>Duration: {spell.duration}</div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            <div className={`tab-content ${activeTab === 'features' ? 'active' : ''}`}>
                <div className="max-h-64 overflow-y-auto space-y-2 pr-4">
                    {character.features.map((feature, i) => (
                        <div key={i} className="bg-slate-900 p-3 rounded">
                            <p>{feature}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

function GameInterface({ character, setCharacter, gameState, setGameState, apiConfig, adventurePreferences }) {
    const [messages, setMessages] = useState(() => {
        const saved = localStorage.getItem('dnd_messages');
        return saved ? JSON.parse(saved) : [];
    });
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [hasGeneratedOpening, setHasGeneratedOpening] = useState(() => {
        return localStorage.getItem('dnd_has_opening') === 'true';
    });
    const scrollRef = useRef(null);

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
            localStorage.setItem('dnd_last_save', new Date().toISOString());
        }
    }, [messages]);

    const generateOpeningNarrative = async () => {
        setIsLoading(true);
        try {
            const adventureDesc = adventurePreferences?.adventureDescription || 'a classic D&D adventure';
            const backstory = adventurePreferences?.backstory || 'no backstory';

            const openingPrompt = {
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
                content: 'An error occurred. Please check your API key and try again.'
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMessage = input.trim();
        setInput('');
        setIsLoading(true);

        const newMessages = [...messages, { role: 'user', content: userMessage }];
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
                { role: 'assistant', content: 'An error occurred. Please check your API key and try again.' }
            ]);
        } finally {
            setIsLoading(false);
        }
    };

    const rollDice = (sides) => Math.floor(Math.random() * sides) + 1;

    return (
        <div className="space-y-4">
            <div className="card">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-slate-400 text-sm">Location</p>
                        <p>{gameState.location || 'Unknown'}</p>
                    </div>
                    {gameState.inCombat && (
                        <span className="badge badge-destructive animate-pulse">In Combat</span>
                    )}
                </div>

                {gameState.enemies.length > 0 && (
                    <div className="mt-4">
                        <p className="text-slate-300 mb-2 text-sm">Enemies</p>
                        <div className="space-y-2">
                            {gameState.enemies.map((enemy) => (
                                <div key={enemy.id} className="enemy-card">
                                    <span>{enemy.name}</span>
                                    <div className="flex items-center gap-4 text-sm">
                                        <span className="text-slate-300">AC {enemy.ac}</span>
                                        <span className="text-red-400">HP {enemy.hp}/{enemy.maxHp}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <div className="card">
                <h2 className="text-xl font-semibold mb-4">Adventure Log</h2>

                <div className="h-96 overflow-y-auto mb-4 pr-2">
                    <div className="space-y-4">
                        {messages.map((message, i) => (
                            <div
                                key={i}
                                className={message.role === 'user' ? 'message-user' : 'message-assistant'}
                            >
                                <p className="message-role">
                                    {message.role === 'user' ? 'You' : 'Dungeon Master'}
                                </p>
                                <p className="message-content">{message.content}</p>
                            </div>
                        ))}
                        {isLoading && (
                            <div className="message-assistant">
                                <p className="message-role">Dungeon Master</p>
                                <div className="spinner"></div>
                            </div>
                        )}
                        <div ref={scrollRef} />
                    </div>
                </div>

                <div className="flex gap-2 mb-4 flex-wrap">
                    <button
                        onClick={() => setInput(`D20 Roll: ${rollDice(20)}`)}
                        className="quick-action-btn"
                        type="button"
                    >
                        🎲 Roll D20
                    </button>
                    <button
                        onClick={() => setInput('I look around carefully')}
                        className="quick-action-btn"
                        type="button"
                    >
                        Perception Check
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="flex gap-2">
                    <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Describe your action..."
                        className="flex-1 min-h-150"
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSubmit(e);
                            }
                        }}
                    />
                    <button
                        type="submit"
                        disabled={isLoading || !input.trim()}
                        className="btn-primary px-4"
                    >
                        {isLoading ? '...' : 'Send'}
                    </button>
                </form>
            </div>
        </div>
    );
}

function SaveManager({ onExport, onImport, onNewGame }) {
    const [showMenu, setShowMenu] = useState(false);
    const fileInputRef = useRef(null);

    const handleImportClick = () => {
        fileInputRef.current?.click();
        setShowMenu(false);
    };

    return (
        <div className="relative">
            <button
                onClick={() => setShowMenu(!showMenu)}
                className="btn-secondary"
            >
                Save Menu
            </button>
            {showMenu && (
                <div className="absolute right-0 mt-2 bg-slate-800 border border-slate-700 rounded-lg p-2 space-y-2" style={{minWidth: '150px', zIndex: 10}}>
                    <button onClick={() => { onExport(); setShowMenu(false); }} className="w-full btn-secondary text-left">
                        Export Save
                    </button>
                    <button onClick={handleImportClick} className="w-full btn-secondary text-left">
                        Import Save
                    </button>
                    <button onClick={() => { onNewGame(); setShowMenu(false); }} className="w-full btn-danger text-left">
                        New Game
                    </button>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".json"
                        onChange={(e) => { onImport(e); setShowMenu(false); }}
                        style={{display: 'none'}}
                    />
                </div>
            )}
        </div>
    );
}

function App() {
    const [apiConfig, setApiConfig] = useState(() => {
        const saved = localStorage.getItem('dnd_api_config');
        return saved ? JSON.parse(saved) : null;
    });
    const [character, setCharacter] = useState(() => {
        const saved = localStorage.getItem('dnd_character');
        return saved ? JSON.parse(saved) : null;
    });
    const [gameState, setGameState] = useState(() => {
        const saved = localStorage.getItem('dnd_game_state');
        return saved ? JSON.parse(saved) : {
            inCombat: false,
            currentTurn: null,
            enemies: [],
            narrative: "",
            location: "Unknown"
        };
    });
    const [adventurePreferences, setAdventurePreferences] = useState(() => {
        const saved = localStorage.getItem('dnd_adventure_prefs');
        return saved ? JSON.parse(saved) : null;
    });

    const handleApiSetup = (config) => {
        setApiConfig(config);
        localStorage.setItem('dnd_api_config', JSON.stringify(config));
    };

    const handleCharacterCreation = (char, prefs) => {
        setCharacter(char);
        setAdventurePreferences(prefs);
        localStorage.setItem('dnd_character', JSON.stringify(char));
        localStorage.setItem('dnd_adventure_prefs', JSON.stringify(prefs));
    };

    const handleCharacterUpdate = (char) => {
        setCharacter(char);
        localStorage.setItem('dnd_character', JSON.stringify(char));
        localStorage.setItem('dnd_last_save', new Date().toISOString());
    };

    const handleGameStateUpdate = (state) => {
        setGameState(state);
        localStorage.setItem('dnd_game_state', JSON.stringify(state));
        localStorage.setItem('dnd_last_save', new Date().toISOString());
    };

    const handleNewGame = () => {
        if (confirm('Are you sure you want to start a new game? Current progress will be lost.')) {
            setCharacter(null);
            setGameState({ inCombat: false, currentTurn: null, enemies: [], narrative: "", location: "" });
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

    const handleImportSave = (event) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const saveData = JSON.parse(e.target?.result);

                setCharacter(saveData.character);
                setGameState(saveData.gameState);
                setAdventurePreferences(saveData.adventurePreferences);

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
        <div className="min-h-screen">
            <div className="container">
                <header className="mb-6">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex-1"></div>
                        <h1 className="text-center text-2xl font-bold">D&D - AI Dungeon Master</h1>
                        <div className="flex-1 flex justify-end">
                            <SaveManager
                                onExport={handleExportSave}
                                onImport={handleImportSave}
                                onNewGame={handleNewGame}
                            />
                        </div>
                    </div>
                    <p className="text-center text-slate-300">
                        Playing as {character.name} • Level {character.level} {character.race} {character.class}
                    </p>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-1">
                        <CharacterSheet character={character} />
                    </div>

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

// Render the app
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
