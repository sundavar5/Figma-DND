import { Character } from '../types/game';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Progress } from './ui/progress';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { ScrollArea } from './ui/scroll-area';

interface CharacterSheetProps {
  character: Character;
}

export function CharacterSheet({ character }: CharacterSheetProps) {
  const getModifier = (score: number) => {
    const mod = Math.floor((score - 10) / 2);
    return mod >= 0 ? `+${mod}` : `${mod}`;
  };

  return (
    <Card className="bg-slate-800 border-slate-700 text-white">
      <CardHeader>
        <CardTitle className="text-white">{character.name}</CardTitle>
        <p className="text-slate-300">
          Level {character.level} {character.race} {character.class}
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <Tabs defaultValue="stats" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="stats">Stats</TabsTrigger>
            <TabsTrigger value="inventory">Items</TabsTrigger>
            <TabsTrigger value="spells">Spells</TabsTrigger>
            <TabsTrigger value="features">Features</TabsTrigger>
          </TabsList>
          
          <TabsContent value="stats" className="space-y-4">
            {/* HP and Resources */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-white">Hit Points</span>
                <span className="text-red-400">
                  {character.hitPoints.current}/{character.hitPoints.max}
                  {character.hitPoints.temporary > 0 && ` (+${character.hitPoints.temporary})`}
                </span>
              </div>
              <Progress 
                value={(character.hitPoints.current / character.hitPoints.max) * 100} 
                className="h-2"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-white">Experience</span>
                <span className="text-blue-400">
                  {character.experience}/{character.experienceToNextLevel}
                </span>
              </div>
              <Progress 
                value={(character.experience / character.experienceToNextLevel) * 100} 
                className="h-2"
              />
            </div>

            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <p className="text-slate-300">AC</p>
                <p className="text-white">{character.armorClass}</p>
              </div>
              <div>
                <p className="text-slate-300">Init</p>
                <p className="text-white">{character.initiative >= 0 ? '+' : ''}{character.initiative}</p>
              </div>
              <div>
                <p className="text-slate-300">Speed</p>
                <p className="text-white">{character.speed} ft</p>
              </div>
            </div>

            <Separator />

            {/* Ability Scores */}
            <div>
              <h3 className="mb-2 text-white">Ability Scores</h3>
              <div className="grid grid-cols-3 gap-2">
                {Object.entries(character.abilities).map(([ability, score]) => (
                  <div key={ability} className="bg-slate-900 p-2 rounded text-center">
                    <p className="text-slate-300 uppercase">{ability.slice(0, 3)}</p>
                    <p className="text-white">{score}</p>
                    <p className="text-slate-400">{getModifier(score)}</p>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* Saving Throws */}
            <div>
              <h3 className="mb-2 text-white">Saving Throws</h3>
              <div className="grid grid-cols-2 gap-1">
                {Object.entries(character.savingThrows).map(([ability, bonus]) => (
                  <div key={ability} className="flex justify-between">
                    <span className="text-slate-300 capitalize">{ability.slice(0, 3)}</span>
                    <span className="text-white">{bonus >= 0 ? '+' : ''}{bonus}</span>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* Skills */}
            <div>
              <h3 className="mb-2 text-white">Skills</h3>
              <ScrollArea className="h-32">
                <div className="space-y-1 pr-4">
                  {Object.entries(character.skills).map(([skill, bonus]) => (
                    <div key={skill} className="flex justify-between">
                      <span className="text-slate-300 capitalize">
                        {skill.replace(/([A-Z])/g, ' $1').trim()}
                      </span>
                      <span className="text-white">{bonus >= 0 ? '+' : ''}{bonus}</span>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>

            {/* Spell Slots */}
            {Object.values(character.spellSlots).some(slot => slot.max > 0) && (
              <>
                <Separator />
                <div>
                  <h3 className="mb-2 text-white">Spell Slots</h3>
                  <div className="space-y-1">
                    {Object.entries(character.spellSlots).map(([level, slots]) => (
                      slots.max > 0 && (
                        <div key={level} className="flex justify-between items-center">
                          <span className="text-slate-300">Level {level}</span>
                          <div className="flex gap-1">
                            {Array.from({ length: slots.max }).map((_, i) => (
                              <div
                                key={i}
                                className={`w-3 h-3 rounded-full border ${
                                  i < slots.current
                                    ? 'bg-purple-500 border-purple-400'
                                    : 'border-slate-600'
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                      )
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Conditions */}
            {character.conditions.length > 0 && (
              <>
                <Separator />
                <div>
                  <h3 className="mb-2 text-white">Conditions</h3>
                  <div className="flex flex-wrap gap-1">
                    {character.conditions.map((condition, i) => (
                      <Badge key={i} variant="destructive">{condition}</Badge>
                    ))}
                  </div>
                </div>
              </>
            )}
          </TabsContent>
          
          <TabsContent value="inventory">
            <ScrollArea className="h-96">
              <div className="space-y-2 pr-4">
                {character.inventory.map((item) => (
                  <div key={item.id} className="bg-slate-900 p-3 rounded">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-white">{item.name}</span>
                          {item.equipped && <Badge variant="secondary">Equipped</Badge>}
                        </div>
                        <p className="text-slate-400 mt-1">{item.description}</p>
                      </div>
                      {item.quantity > 1 && (
                        <span className="text-slate-300">x{item.quantity}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>
          
          <TabsContent value="spells">
            <ScrollArea className="h-96">
              {character.spells.length === 0 ? (
                <p className="text-slate-400 text-center py-8">No spells learned</p>
              ) : (
                <div className="space-y-2 pr-4">
                  {character.spells.map((spell, i) => (
                    <div key={i} className="bg-slate-900 p-3 rounded">
                      <div className="flex justify-between items-start mb-1">
                        <span className="text-white">{spell.name}</span>
                        <Badge>Level {spell.level}</Badge>
                      </div>
                      <p className="text-slate-300 mb-2">{spell.description}</p>
                      <div className="text-slate-400 grid grid-cols-2 gap-1">
                        <span>Range: {spell.range}</span>
                        <span>Duration: {spell.duration}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
          
          <TabsContent value="features">
            <ScrollArea className="h-96">
              <div className="space-y-2 pr-4">
                {character.features.map((feature, i) => (
                  <div key={i} className="bg-slate-900 p-3 rounded">
                    <p className="text-white">{feature}</p>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}