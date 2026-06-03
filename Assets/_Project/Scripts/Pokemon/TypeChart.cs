using System.Collections.Generic;

public static class TypeChart
{
    // [attacking type][defending type] = multiplier
    static readonly Dictionary<PokemonType, Dictionary<PokemonType, float>> chart =
        new Dictionary<PokemonType, Dictionary<PokemonType, float>>
    {
        { PokemonType.Fire, new Dictionary<PokemonType, float> {
            { PokemonType.Fire, 0.5f }, { PokemonType.Water, 0.5f }, { PokemonType.Grass, 2f },
            { PokemonType.Ice, 2f }, { PokemonType.Bug, 2f }, { PokemonType.Rock, 0.5f },
            { PokemonType.Dragon, 0.5f }, { PokemonType.Steel, 2f }
        }},
        { PokemonType.Water, new Dictionary<PokemonType, float> {
            { PokemonType.Fire, 2f }, { PokemonType.Water, 0.5f }, { PokemonType.Grass, 0.5f },
            { PokemonType.Ground, 2f }, { PokemonType.Rock, 2f }, { PokemonType.Dragon, 0.5f }
        }},
        { PokemonType.Grass, new Dictionary<PokemonType, float> {
            { PokemonType.Fire, 0.5f }, { PokemonType.Water, 2f }, { PokemonType.Grass, 0.5f },
            { PokemonType.Poison, 0.5f }, { PokemonType.Ground, 2f }, { PokemonType.Flying, 0.5f },
            { PokemonType.Bug, 0.5f }, { PokemonType.Rock, 2f }, { PokemonType.Dragon, 0.5f },
            { PokemonType.Steel, 0.5f }
        }},
        { PokemonType.Fairy, new Dictionary<PokemonType, float> {
            { PokemonType.Fire, 0.5f }, { PokemonType.Fighting, 2f }, { PokemonType.Poison, 0.5f },
            { PokemonType.Dragon, 2f }, { PokemonType.Dark, 2f }, { PokemonType.Steel, 0.5f }
        }},
        { PokemonType.Dragon, new Dictionary<PokemonType, float> {
            { PokemonType.Dragon, 2f }, { PokemonType.Steel, 0.5f }, { PokemonType.Fairy, 0f }
        }},
        { PokemonType.Dark, new Dictionary<PokemonType, float> {
            { PokemonType.Fighting, 0.5f }, { PokemonType.Psychic, 2f }, { PokemonType.Ghost, 2f },
            { PokemonType.Dark, 0.5f }, { PokemonType.Fairy, 0.5f }
        }},
        { PokemonType.Poison, new Dictionary<PokemonType, float> {
            { PokemonType.Grass, 2f }, { PokemonType.Poison, 0.5f }, { PokemonType.Ground, 0.5f },
            { PokemonType.Rock, 0.5f }, { PokemonType.Ghost, 0.5f }, { PokemonType.Steel, 0f },
            { PokemonType.Fairy, 2f }
        }},
        // Add remaining types as needed
    };

    public static float GetEffectiveness(PokemonType attackType, PokemonType defenseType)
    {
        if (attackType == PokemonType.None || defenseType == PokemonType.None) return 1f;
        if (chart.TryGetValue(attackType, out var defMap))
            if (defMap.TryGetValue(defenseType, out float mult))
                return mult;
        return 1f;
    }
}
