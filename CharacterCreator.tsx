import { useState } from 'react';
import { Character } from '../types/game';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Badge } from './ui/badge';
import { Checkbox } from './ui/checkbox';

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

const ADVENTURE_TYPES = [
  { name: 'Dungeon Crawl', description: 'Classic dungeon exploration with traps, monsters, and treasure' },
  { name: 'Political Intrigue', description: 'Navigate court politics, alliances, and betrayals' },
  { name: 'Mystery Investigation', description: 'Solve mysteries and uncover dark secrets' },
  { name: 'Epic Quest', description: 'Save the world from an ancient evil' },
  { name: 'Wilderness Survival', description: 'Survive in the untamed wilds' },
  { name: 'Urban Adventure', description: 'Navigate the criminal underworld of a great city' },
  { name: 'Horror', description: 'Face terrifying creatures and sanity-testing situations' },
  { name: 'Planar Adventure', description: 'Explore other planes of existence' }
];

const SPELL_LIST: { [key: string]: string[] } = {
  'Wizard': ['Magic Missile', 'Shield', 'Mage Armor', 'Detect Magic', 'Fireball', 'Counterspell'],
  'Cleric': ['Cure Wounds', 'Bless', 'Sacred Flame', 'Spiritual Weapon', 'Guiding Bolt', 'Prayer of Healing'],
  'Sorcerer': ['Burning Hands', 'Magic Missile', 'Shield', 'Chromatic Orb', 'Scorching Ray', 'Haste'],
  'Warlock': ['Eldritch Blast', 'Hex', 'Armor of Agathys', 'Hellish Rebuke', 'Hunger of Hadar', 'Counterspell'],
  'Druid': ['Goodberry', 'Healing Word', 'Entangle', 'Moonbeam', 'Call Lightning', 'Conjure Animals'],
  'Bard': ['Vicious Mockery', 'Healing Word', 'Thunderwave', 'Heat Metal', 'Hypnotic Pattern', 'Polymorph'],
  'Paladin': ['Bless', 'Cure Wounds', 'Divine Smite', 'Lesser Restoration', 'Aid', 'Find Steed'],
  'Ranger': ['Hunter\'s Mark', 'Cure Wounds', 'Ensnaring Strike', 'Pass Without Trace', 'Spike Growth', 'Conjure Animals']
};

interface CharacterCreatorProps {
  onComplete: (character: Character, preferences: any) => void;
}

export function CharacterCreator({ onComplete }: CharacterCreatorProps) {
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [selectedClass, setSelectedClass] = useState('Fighter');
  const [race, setRace] = useState('Human');
  const [backstory, setBackstory] = useState('');
  const [adventureDescription, setAdventureDescription] = useState('');
  const [selectedSpells, setSelectedSpells] = useState<string[]>([]);
  
  const [stats, setStats] = useState({
    strength: 10,
    dexterity: 10,
    constitution: 10,
    intelligence: 10,
    wisdom: 10,
    charisma: 10
  });

  const pointsUsed = Object.values(stats).reduce((sum, val) => sum + (val - 8), 0);
  const maxPoints = 27;

  const incrementStat = (stat: keyof typeof stats) => {
    if (stats[stat] < 15 && pointsUsed < maxPoints) {
      setStats({ ...stats, [stat]: stats[stat] + 1 });
    }
  };

  const decrementStat = (stat: keyof typeof stats) => {
    if (stats[stat] > 8) {
      setStats({ ...stats, [stat]: stats[stat] - 1 });
    }
  };

  const getModifier = (score: number) => {
    const mod = Math.floor((score - 10) / 2);
    return mod >= 0 ? `+${mod}` : `${mod}`;
  };

  const toggleSpell = (spell: string) => {
    if (selectedSpells.includes(spell)) {
      setSelectedSpells(selectedSpells.filter(s => s !== spell));
    } else if (selectedSpells.length < 6) {
      setSelectedSpells([...selectedSpells, spell]);
    }
  };

  const createCharacter = () => {
    const classInfo = CLASSES.find(c => c.name === selectedClass)!;
    const isSpellcaster = classInfo.spellcaster;
    
    // Calculate HP based on class
    const conMod = Math.floor((stats.constitution - 10) / 2);
    const maxHP = parseInt(classInfo.hitDie.substring(1)) + conMod;

    const character: Character = {
      name,
      race,
      class: selectedClass,
      level: 1,
      experience: 0,
      experienceToNextLevel: 300,
      abilities: stats,
      hitPoints: { current: maxHP, max: maxHP, temporary: 0 },
      armorClass: 10 + Math.floor((stats.dexterity - 10) / 2),
      initiative: Math.floor((stats.dexterity - 10) / 2),
      speed: 30,
      proficiencyBonus: 2,
      hitDice: { current: 1, max: 1, type: classInfo.hitDie },
      spellSlots: isSpellcaster ? {
        1: { current: 2, max: 2 },
        2: { current: 0, max: 0 },
        3: { current: 0, max: 0 },
        4: { current: 0, max: 0 },
        5: { current: 0, max: 0 },
        6: { current: 0, max: 0 },
        7: { current: 0, max: 0 },
        8: { current: 0, max: 0 },
        9: { current: 0, max: 0 }
      } : {
        1: { current: 0, max: 0 },
        2: { current: 0, max: 0 },
        3: { current: 0, max: 0 },
        4: { current: 0, max: 0 },
        5: { current: 0, max: 0 },
        6: { current: 0, max: 0 },
        7: { current: 0, max: 0 },
        8: { current: 0, max: 0 },
        9: { current: 0, max: 0 }
      },
      skills: {
        acrobatics: Math.floor((stats.dexterity - 10) / 2),
        animalHandling: Math.floor((stats.wisdom - 10) / 2),
        arcana: Math.floor((stats.intelligence - 10) / 2),
        athletics: Math.floor((stats.strength - 10) / 2),
        deception: Math.floor((stats.charisma - 10) / 2),
        history: Math.floor((stats.intelligence - 10) / 2),
        insight: Math.floor((stats.wisdom - 10) / 2),
        intimidation: Math.floor((stats.charisma - 10) / 2),
        investigation: Math.floor((stats.intelligence - 10) / 2),
        medicine: Math.floor((stats.wisdom - 10) / 2),
        nature: Math.floor((stats.intelligence - 10) / 2),
        perception: Math.floor((stats.wisdom - 10) / 2),
        performance: Math.floor((stats.charisma - 10) / 2),
        persuasion: Math.floor((stats.charisma - 10) / 2),
        religion: Math.floor((stats.intelligence - 10) / 2),
        sleightOfHand: Math.floor((stats.dexterity - 10) / 2),
        stealth: Math.floor((stats.dexterity - 10) / 2),
        survival: Math.floor((stats.wisdom - 10) / 2)
      },
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
        name: spellName,
        level: 1,
        school: 'Evocation',
        castingTime: '1 action',
        range: '60 ft',
        components: 'V, S',
        duration: 'Instantaneous',
        description: `${spellName} spell effect`,
        prepared: true
      })),
      conditions: [],
      features: [`${selectedClass} class features`]
    };

    const preferences = {
      backstory,
      adventureDescription
    };

    onComplete(character, preferences);
  };

  const classInfo = CLASSES.find(c => c.name === selectedClass)!;

  return (
    <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-4">
      <Card className="w-full max-w-3xl bg-slate-800 border-slate-700 text-white">
        <CardHeader>
          <CardTitle className="text-white">Create Your Character</CardTitle>
          <CardDescription className="text-slate-300">
            Step {step} of 5
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={`step${step}`} className="w-full">
            <TabsList className="grid w-full grid-cols-5 mb-6">
              <TabsTrigger value="step1" onClick={() => setStep(1)}>Basics</TabsTrigger>
              <TabsTrigger value="step2" onClick={() => setStep(2)}>Stats</TabsTrigger>
              <TabsTrigger value="step3" onClick={() => setStep(3)} disabled={!name || !selectedClass}>Spells</TabsTrigger>
              <TabsTrigger value="step4" onClick={() => setStep(4)} disabled={!name || !selectedClass}>Story</TabsTrigger>
              <TabsTrigger value="step5" onClick={() => setStep(5)} disabled={!name || !selectedClass}>Adventure</TabsTrigger>
            </TabsList>

            {/* Step 1: Basic Info */}
            <TabsContent value="step1" className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-white">Character Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter character name"
                  className="bg-slate-900 border-slate-600 text-white placeholder:text-slate-400"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-white">Class</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {CLASSES.map((cls) => (
                    <button
                      key={cls.name}
                      onClick={() => setSelectedClass(cls.name)}
                      className={`p-3 rounded border-2 transition-all ${
                        selectedClass === cls.name
                          ? 'border-blue-500 bg-blue-900/30'
                          : 'border-slate-600 bg-slate-900 hover:border-slate-500'
                      }`}
                    >
                      <div className="text-white">{cls.name}</div>
                      <div className="text-slate-400">Hit Die: {cls.hitDie}</div>
                      {cls.spellcaster && <Badge className="mt-1">Spellcaster</Badge>}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="race" className="text-white">Race</Label>
                <Select value={race} onValueChange={setRace}>
                  <SelectTrigger id="race" className="bg-slate-900 border-slate-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-600 text-white">
                    {RACES.map((r) => (
                      <SelectItem key={r} value={r}>{r}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button onClick={() => setStep(2)} className="w-full">
                Next: Ability Scores
              </Button>
            </TabsContent>

            {/* Step 2: Ability Scores */}
            <TabsContent value="step2" className="space-y-6">
              <div>
                <div className="flex justify-between mb-4">
                  <span className="text-white">Point Buy System</span>
                  <span className="text-white">
                    Points Used: <span className={pointsUsed > maxPoints ? 'text-red-400' : 'text-green-400'}>
                      {pointsUsed}/{maxPoints}
                    </span>
                  </span>
                </div>

                <div className="space-y-3">
                  {Object.entries(stats).map(([stat, value]) => (
                    <div key={stat} className="flex items-center justify-between bg-slate-900 p-3 rounded">
                      <div className="flex-1">
                        <span className="text-white capitalize">{stat}</span>
                        <span className="text-slate-400 ml-2">{getModifier(value)}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => decrementStat(stat as keyof typeof stats)}
                          disabled={value <= 8}
                          className="bg-slate-800 border-slate-600 text-white hover:bg-slate-700"
                        >
                          -
                        </Button>
                        <span className="text-white w-8 text-center">{value}</span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => incrementStat(stat as keyof typeof stats)}
                          disabled={value >= 15 || pointsUsed >= maxPoints}
                          className="bg-slate-800 border-slate-600 text-white hover:bg-slate-700"
                        >
                          +
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep(1)} className="flex-1 bg-slate-900 border-slate-600 text-white hover:bg-slate-700">
                  Back
                </Button>
                <Button onClick={() => setStep(3)} className="flex-1" disabled={pointsUsed > maxPoints}>
                  Next: {classInfo.spellcaster ? 'Spells' : 'Story'}
                </Button>
              </div>
            </TabsContent>

            {/* Step 3: Spells */}
            <TabsContent value="step3" className="space-y-6">
              {classInfo.spellcaster ? (
                <>
                  <div>
                    <Label className="text-white mb-2 block">
                      Select Starting Spells (Choose up to 6)
                    </Label>
                    <p className="text-slate-400 mb-4">
                      Selected: {selectedSpells.length}/6
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {SPELL_LIST[selectedClass]?.map((spell) => (
                        <button
                          key={spell}
                          onClick={() => toggleSpell(spell)}
                          className={`p-3 rounded border-2 text-left transition-all ${
                            selectedSpells.includes(spell)
                              ? 'border-purple-500 bg-purple-900/30'
                              : 'border-slate-600 bg-slate-900 hover:border-slate-500'
                          }`}
                        >
                          <span className="text-white">{spell}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setStep(2)} className="flex-1 bg-slate-900 border-slate-600 text-white hover:bg-slate-700">
                      Back
                    </Button>
                    <Button onClick={() => setStep(4)} className="flex-1">
                      Next: Story
                    </Button>
                  </div>
                </>
              ) : (
                <div className="text-center py-8">
                  <p className="text-slate-400 mb-4">{selectedClass}s don't use spells</p>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setStep(2)} className="flex-1 bg-slate-900 border-slate-600 text-white hover:bg-slate-700">
                      Back
                    </Button>
                    <Button onClick={() => setStep(4)} className="flex-1">
                      Next: Story
                    </Button>
                  </div>
                </div>
              )}
            </TabsContent>

            {/* Step 4: Backstory */}
            <TabsContent value="step4" className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="backstory" className="text-white">Character Backstory</Label>
                <Textarea
                  id="backstory"
                  value={backstory}
                  onChange={(e) => setBackstory(e.target.value)}
                  placeholder="Tell us about your character's past, motivations, and personality..."
                  className="bg-slate-900 border-slate-600 min-h-[200px] text-white placeholder:text-slate-400"
                />
                <p className="text-slate-400">
                  The AI will use this to create a personalized adventure
                </p>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep(classInfo.spellcaster ? 3 : 2)} className="flex-1 bg-slate-900 border-slate-600 text-white hover:bg-slate-700">
                  Back
                </Button>
                <Button onClick={() => setStep(5)} className="flex-1">
                  Next: Adventure Type
                </Button>
              </div>
            </TabsContent>

            {/* Step 5: Adventure Description */}
            <TabsContent value="step5" className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="adventureDescription" className="text-white">What kind of adventure do you want?</Label>
                <Textarea
                  id="adventureDescription"
                  value={adventureDescription}
                  onChange={(e) => setAdventureDescription(e.target.value)}
                  placeholder="Describe the type of adventure you want to experience... (e.g., 'A dark horror adventure in a haunted mansion', 'A political intrigue campaign in a royal court', 'An epic quest to save the world from an ancient dragon', 'A mystery investigation in a steampunk city')"
                  className="bg-slate-900 border-slate-600 min-h-[150px] text-white placeholder:text-slate-400"
                />
                <p className="text-slate-400">
                  The AI will create an adventure based on your description and character backstory
                </p>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep(4)} className="flex-1 bg-slate-900 border-slate-600 text-white hover:bg-slate-700">
                  Back
                </Button>
                <Button 
                  onClick={createCharacter} 
                  className="flex-1"
                  disabled={!name.trim()}
                >
                  Begin Adventure!
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}