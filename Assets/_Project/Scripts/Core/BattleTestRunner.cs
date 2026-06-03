using System.Collections.Generic;
using System.Reflection;
using UnityEngine;

/// <summary>
/// Drop onto any empty GameObject and press Play.
/// Simulates a full battle turn-by-turn and prints everything to the Console.
/// No UI, scene setup, or sprites required.
/// </summary>
public class BattleTestRunner : MonoBehaviour
{
    void Start()
    {
        var bulbasaurBase = MakePokemon("Bulbasaur", PokemonType.Grass, PokemonType.Poison,
            hp: 45, atk: 49, def: 49, spAtk: 65, spDef: 65, spd: 45);
        var charmanderBase = MakePokemon("Charmander", PokemonType.Fire, PokemonType.None,
            hp: 39, atk: 52, def: 43, spAtk: 60, spDef: 50, spd: 65);

        var tackle = MakeMove("Tackle", PokemonType.Normal, MoveCategory.Physical, power: 40, pp: 35);
        var ember   = MakeMove("Ember",  PokemonType.Fire,   MoveCategory.Special,   power: 40, pp: 25);

        AddMove(bulbasaurBase, tackle, learnAtLevel: 1);
        AddMove(charmanderBase, ember, learnAtLevel: 1);

        var player = new Pokemon(bulbasaurBase, 10);
        var enemy  = new Pokemon(charmanderBase, 8);

        Log("=== BATTLE START ===");
        Log($"Player: {player.Base.Name} Lv.{player.Level}  HP {player.HP}/{player.MaxHp}");
        Log($"Enemy:  {enemy.Base.Name}  Lv.{enemy.Level}   HP {enemy.HP}/{enemy.MaxHp}");

        for (int turn = 1; turn <= 30; turn++)
        {
            Log($"\n--- Turn {turn} ---");

            // Player attacks first (simplified — ignores Speed for now)
            var pMove = player.Moves[0];
            int pDmg = enemy.TakeDamage(pMove, player);
            Log($"{player.Base.Name} used {pMove.Base.Name}! Dealt {pDmg} dmg → Enemy HP {enemy.HP}/{enemy.MaxHp}");

            if (enemy.IsKO) { Log($"{enemy.Base.Name} fainted! Player wins!"); return; }

            var eMove = enemy.Moves[0];
            int eDmg = player.TakeDamage(eMove, enemy);
            Log($"{enemy.Base.Name} used {eMove.Base.Name}! Dealt {eDmg} dmg → Player HP {player.HP}/{player.MaxHp}");

            if (player.IsKO) { Log($"{player.Base.Name} fainted! Enemy wins!"); return; }
        }

        Log("Battle timed out after 30 turns — check damage formula.");
    }

    // ── helpers ──────────────────────────────────────────────────────────────

    static void Log(string msg) => Debug.Log(msg);

    static PokemonBase MakePokemon(string name, PokemonType t1, PokemonType t2,
        int hp, int atk, int def, int spAtk, int spDef, int spd)
    {
        var pb = ScriptableObject.CreateInstance<PokemonBase>();
        Set(pb, "pokemonName", name);
        Set(pb, "type1", t1);
        Set(pb, "type2", t2);
        Set(pb, "maxHp", hp);
        Set(pb, "attack", atk);
        Set(pb, "defense", def);
        Set(pb, "spAttack", spAtk);
        Set(pb, "spDefense", spDef);
        Set(pb, "speed", spd);
        Set(pb, "learnableMoves", new List<LearnableMove>());
        return pb;
    }

    static MoveBase MakeMove(string name, PokemonType type, MoveCategory cat, int power, int pp)
    {
        var mb = ScriptableObject.CreateInstance<MoveBase>();
        Set(mb, "moveName", name);
        Set(mb, "type", type);
        Set(mb, "category", cat);
        Set(mb, "power", power);
        Set(mb, "accuracy", 100);
        Set(mb, "pp", pp);
        Set(mb, "effects", new MoveEffects());
        return mb;
    }

    static void AddMove(PokemonBase pb, MoveBase mb, int learnAtLevel)
    {
        var lm = new LearnableMove();
        Set(lm, "moveBase", mb);
        Set(lm, "level", learnAtLevel);
        pb.LearnableMoves.Add(lm);
    }

    static void Set(object obj, string field, object value)
    {
        var f = obj.GetType().GetField(field,
            BindingFlags.Instance | BindingFlags.NonPublic | BindingFlags.Public);
        if (f != null)
            f.SetValue(obj, value);
        else
            Debug.LogWarning($"[BattleTestRunner] Field '{field}' not found on {obj.GetType().Name}");
    }
}
