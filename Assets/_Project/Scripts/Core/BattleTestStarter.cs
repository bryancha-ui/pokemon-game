using System.Collections.Generic;
using System.Reflection;
using UnityEngine;

/// <summary>
/// Placed in the battle scene by BattleSceneSetup.
/// Creates two test Pokemon via code and fires StartBattle on Play.
/// </summary>
public class BattleTestStarter : MonoBehaviour
{
    [SerializeField] BattleSystem battleSystem;

    void Start()
    {
        // ── Player Pokemon: Bulbasaur Lv.10 ──
        var bulbasaurBase = MakeBase("Bulbasaur", PokemonType.Grass, PokemonType.Poison,
            hp: 45, atk: 49, def: 49, spAtk: 65, spDef: 65, spd: 45);
        AddMove(bulbasaurBase, MakeMove("Tackle", PokemonType.Normal, MoveCategory.Physical, power: 40, pp: 35), level: 1);

        var playerPokemon = new Pokemon(bulbasaurBase, 10);

        // Inject into a PokemonParty (Awake already ran on empty list — safe to set after)
        var partyGO = new GameObject("TestParty");
        var party = partyGO.AddComponent<PokemonParty>();
        typeof(PokemonParty)
            .GetField("party", BindingFlags.Instance | BindingFlags.NonPublic)
            ?.SetValue(party, new List<Pokemon> { playerPokemon });

        // ── Wild Pokemon: Charmander Lv.8 ──
        var charmanderBase = MakeBase("Charmander", PokemonType.Fire, PokemonType.None,
            hp: 39, atk: 52, def: 43, spAtk: 60, spDef: 50, spd: 65);
        AddMove(charmanderBase, MakeMove("Ember", PokemonType.Fire, MoveCategory.Special, power: 40, pp: 25), level: 1);

        battleSystem.StartBattle(party, charmanderBase, wildLevel: 8);
    }

    // ── helpers ──────────────────────────────────────────────────────────────

    static PokemonBase MakeBase(string name, PokemonType t1, PokemonType t2,
        int hp, int atk, int def, int spAtk, int spDef, int spd)
    {
        var pb = ScriptableObject.CreateInstance<PokemonBase>();
        Set(pb, "pokemonName", name); Set(pb, "type1", t1); Set(pb, "type2", t2);
        Set(pb, "maxHp", hp); Set(pb, "attack", atk); Set(pb, "defense", def);
        Set(pb, "spAttack", spAtk); Set(pb, "spDefense", spDef); Set(pb, "speed", spd);
        Set(pb, "learnableMoves", new List<LearnableMove>());
        return pb;
    }

    static MoveBase MakeMove(string name, PokemonType type, MoveCategory cat, int power, int pp)
    {
        var mb = ScriptableObject.CreateInstance<MoveBase>();
        Set(mb, "moveName", name); Set(mb, "type", type); Set(mb, "category", cat);
        Set(mb, "power", power); Set(mb, "accuracy", 100); Set(mb, "pp", pp);
        Set(mb, "effects", new MoveEffects());
        return mb;
    }

    static void AddMove(PokemonBase pb, MoveBase mb, int level)
    {
        var lm = new LearnableMove();
        Set(lm, "moveBase", mb); Set(lm, "level", level);
        pb.LearnableMoves.Add(lm);
    }

    static void Set(object obj, string field, object val) =>
        obj.GetType()
           .GetField(field, BindingFlags.Instance | BindingFlags.NonPublic | BindingFlags.Public)
           ?.SetValue(obj, val);
}
