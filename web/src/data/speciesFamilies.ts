import { getSpecies, species as allSpecies } from './registry'
import type { SpeciesRow } from '../types/tables'

/** A concrete playable lineage under a parent ancestry group. */
export type SpeciesFamilyMember = {
  speciesId: string
  /** Display name when it differs from the species table row (e.g. subrace label). */
  label?: string
  /** Short note shown on the subrace card. */
  note?: string
}

/** Parent ancestry shown first in Identity; members are the selectable table ids. */
export type SpeciesFamily = {
  id: string
  name: string
  description: string
  members: SpeciesFamilyMember[]
}

/**
 * Parent groups for Identity species picking.
 * Subraces (Duergar under Dwarf, Drow under Elf, etc.) appear after the parent is chosen.
 */
export const SPECIES_FAMILIES: readonly SpeciesFamily[] = [
  {
    id: 'aasimar',
    name: 'Aasimar',
    description: 'Celestial-blooded humanoids whose presence can bless intimacy.',
    members: [{ speciesId: 'aasimar' }],
  },
  {
    id: 'dragonborn',
    name: 'Dragonborn',
    description: 'Draconic humanoids with pheromone presence and ridged anatomy.',
    members: [{ speciesId: 'dragonborn' }],
  },
  {
    id: 'dwarf',
    name: 'Dwarf',
    description:
      'Stout mountain and hill folk—and their Underdark kin. Duergar are a dwarven subrace.',
    members: [
      { speciesId: 'hilldwarf', label: 'Hill Dwarf', note: 'Hearty hill clans' },
      { speciesId: 'mountaindwarf', label: 'Mountain Dwarf', note: 'Stone and forge' },
      {
        speciesId: 'duergar',
        label: 'Duergar',
        note: 'Underdark dwarven subrace',
      },
    ],
  },
  {
    id: 'elf',
    name: 'Elf',
    description:
      'Graceful fey-touched lineages. Drow are an elven subrace of the Underdark.',
    members: [
      { speciesId: 'highelf', label: 'High Elf', note: 'Courtly grace' },
      { speciesId: 'woodelf', label: 'Wood Elf', note: 'Wild canopy kin' },
      { speciesId: 'drow', label: 'Drow', note: 'Underdark elven subrace' },
    ],
  },
  {
    id: 'genasi',
    name: 'Genasi',
    description: 'Elemental-blooded lineages—air, earth, fire, and water.',
    members: [
      { speciesId: 'airgenasi', label: 'Air Genasi' },
      { speciesId: 'earthgenasi', label: 'Earth Genasi' },
      { speciesId: 'firegenasi', label: 'Fire Genasi' },
      { speciesId: 'watergenasi', label: 'Water Genasi' },
    ],
  },
  {
    id: 'gnome',
    name: 'Gnome',
    description:
      'Small clever folk. Deep Gnome (Svirfneblin) is not playable here yet—choose surface gnome for now.',
    members: [{ speciesId: 'gnome', label: 'Gnome', note: 'Surface / rock & forest kin' }],
  },
  {
    id: 'goliath',
    name: 'Goliath',
    description: 'Towering mountain folk with giantish vigor.',
    members: [{ speciesId: 'goliath' }],
  },
  {
    id: 'halfling',
    name: 'Halfling',
    description: 'Lucky, playful small folk.',
    members: [{ speciesId: 'halfling' }],
  },
  {
    id: 'human',
    name: 'Human',
    description: 'Versatile lovers with an extra erotic art and carnal trait from history.',
    members: [{ speciesId: 'human' }],
  },
  {
    id: 'orc',
    name: 'Orc',
    description: 'Primal surge and climactic presence.',
    members: [{ speciesId: 'orc' }],
  },
  {
    id: 'tiefling',
    name: 'Tiefling',
    description: 'Infernal heritage and tempting touch.',
    members: [{ speciesId: 'tiefling' }],
  },
  {
    id: 'bugbear',
    name: 'Bugbear',
    description: 'Soft-footed giants of the goblinoid family.',
    members: [{ speciesId: 'bugbear' }],
  },
  {
    id: 'centaur',
    name: 'Centaur',
    description: 'Power and stride; large and thunderous.',
    members: [{ speciesId: 'centaur' }],
  },
  {
    id: 'firbolg',
    name: 'Firbolg',
    description: 'Gentle giants of the wilds.',
    members: [{ speciesId: 'firbolg' }],
  },
  {
    id: 'goblin',
    name: 'Goblin',
    description: 'Mischief, nerve, and wicked grins.',
    members: [{ speciesId: 'goblin' }],
  },
  {
    id: 'hobgoblin',
    name: 'Hobgoblin',
    description: 'Disciplined heat and structured appetite.',
    members: [{ speciesId: 'hobgoblin' }],
  },
  {
    id: 'minotaur',
    name: 'Minotaur',
    description: 'Labyrinthine focus and driving heat.',
    members: [{ speciesId: 'minotaur' }],
  },
  {
    id: 'satyr',
    name: 'Satyr',
    description: 'Revelers of wine, music, and appetite.',
    members: [{ speciesId: 'satyr' }],
  },
  {
    id: 'tabaxi',
    name: 'Tabaxi',
    description: 'Curious feline folk with wandering touch.',
    members: [{ speciesId: 'tabaxi' }],
  },
]

const FAMILY_BY_SPECIES = new Map<string, SpeciesFamily>()
for (const family of SPECIES_FAMILIES) {
  for (const member of family.members) {
    FAMILY_BY_SPECIES.set(member.speciesId, family)
  }
}

export function getSpeciesFamily(familyId: string): SpeciesFamily | undefined {
  return SPECIES_FAMILIES.find((f) => f.id === familyId)
}

export function familyForSpeciesId(speciesId: string): SpeciesFamily | undefined {
  return FAMILY_BY_SPECIES.get(speciesId.trim())
}

export function memberLabel(member: SpeciesFamilyMember): string {
  if (member.label) return member.label
  return getSpecies(member.speciesId)?.name ?? member.speciesId
}

/** Representative species id for a family’s example portrait (first member). */
export function familyExampleSpeciesId(family: SpeciesFamily): string {
  return family.members[0]?.speciesId ?? family.id
}

export function resolveMemberRow(member: SpeciesFamilyMember): SpeciesRow | undefined {
  return getSpecies(member.speciesId)
}

/** Every species id referenced by family data (for coverage checks). */
export function allFamilySpeciesIds(): string[] {
  return SPECIES_FAMILIES.flatMap((f) => f.members.map((m) => m.speciesId))
}

/** Species rows present in the table but missing from family data. */
export function speciesMissingFromFamilies(): SpeciesRow[] {
  const covered = new Set(allFamilySpeciesIds())
  return allSpecies.filter((s) => !covered.has(s.id))
}
