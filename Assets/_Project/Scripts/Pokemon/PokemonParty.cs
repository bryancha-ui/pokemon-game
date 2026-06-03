using System.Collections.Generic;
using System.Linq;
using UnityEngine;

public class PokemonParty : MonoBehaviour
{
    [SerializeField] List<Pokemon> party;

    public List<Pokemon> Party => party;
    public Pokemon First => party.FirstOrDefault(p => !p.IsKO);
    public bool IsWiped => party.All(p => p.IsKO);

    void Awake()
    {
        if (party == null) party = new List<Pokemon>();
        foreach (var p in party)
            p.Init();
    }

    public bool AddPokemon(Pokemon pokemon)
    {
        if (party.Count >= 6) return false;
        party.Add(pokemon);
        return true;
    }

    public void HealAll()
    {
        foreach (var p in party)
        {
            p.Heal(p.MaxHp);
            p.SetStatus(Condition.None);
        }
    }
}
