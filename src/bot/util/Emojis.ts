export const HOME_HEROES: Record<string, string> = {};
export const ELIXIR_TROOPS: Record<string, string> = {};
export const HERO_PETS: Record<string, string> = {};
export const DARK_ELIXIR_TROOPS: Record<string, string> = {};
export const SIEGE_MACHINES: Record<string, string> = {};
export const ELIXIR_SPELLS: Record<string, string> = {};
export const DARK_SPELLS: Record<string, string> = {};
export const SUPER_TROOPS: Record<string, string> = {};
export const BUILDER_ELIXIR_TROOPS: Record<string, string> = {};
export const BUILDER_HEROES: Record<string, string> = {};
export const HEROES: Record<string, string> = {
	...HOME_HEROES,
	...BUILDER_HEROES
};
export const HOME_TROOPS: Record<string, string> = {
	...HOME_HEROES,
	...ELIXIR_TROOPS,
	...DARK_ELIXIR_TROOPS,
	...SIEGE_MACHINES,
	...ELIXIR_SPELLS,
	...DARK_SPELLS,
	...HERO_PETS
};
export const BUILDER_TROOPS: Record<string, string> = {
	...BUILDER_ELIXIR_TROOPS,
	...BUILDER_HEROES
};
export const TOWN_HALLS: Record<string, string> = {};
export const BUILDER_HALLS: Record<string, string> = {};
export const PLAYER_LEAGUES: Record<string, string> = {};
export const ACHIEVEMENT_STARS: Record<string, string> = {};
export const CWL_LEAGUES: Record<string, string> = {};
export const CLAN_LABELS: Record<string, string> = {};
export const PLAYER_LABELS: Record<string, string> = {};
export const WAR_STARS: Record<string, string> = {};
export const EMOJIS: Record<string, string> = {};
export const BLUE_NUMBERS: Record<string, string> = {};
export const ORANGE_NUMBERS: Record<string, string> = {};
export const RED_NUMBERS: Record<string, string> = {};
export const WHITE_NUMBERS: Record<string, string> = {};
