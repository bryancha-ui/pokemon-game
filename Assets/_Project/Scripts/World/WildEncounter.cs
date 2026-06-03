using System.Collections.Generic;
using UnityEngine;

public class WildEncounter : MonoBehaviour
{
    [SerializeField] List<WildPokemonEntry> wildPokemon;
    [SerializeField] int stepsBeforeEncounter = 10;
    [SerializeField, Range(0f, 1f)] float encounterRate = 0.1f;

    int stepCounter;

    void OnTriggerStay(Collider other)
    {
        if (!other.CompareTag("Player")) return;
        if (GameManager.Instance.State != GameState.Overworld) return;

        stepCounter++;
        if (stepCounter < stepsBeforeEncounter) return;
        stepCounter = 0;

        if (Random.value > encounterRate) return;

        var entry = GetRandomWildPokemon();
        if (entry == null) return;

        int level = Random.Range(entry.minLevel, entry.maxLevel + 1);
        GameManager.Instance.StartWildBattle(entry.pokemonBase, level);
    }

    WildPokemonEntry GetRandomWildPokemon()
    {
        float total = 0f;
        foreach (var e in wildPokemon) total += e.weight;

        float roll = Random.value * total;
        float cumulative = 0f;
        foreach (var e in wildPokemon)
        {
            cumulative += e.weight;
            if (roll <= cumulative) return e;
        }
        return null;
    }
}

[System.Serializable]
public class WildPokemonEntry
{
    public PokemonBase pokemonBase;
    public int minLevel;
    public int maxLevel;
    [Range(1, 100)] public float weight = 50f;
}
