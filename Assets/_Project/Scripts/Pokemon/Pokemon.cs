using System;
using System.Collections.Generic;
using UnityEngine;

[Serializable]
public class Pokemon
{
    [SerializeField] PokemonBase _base;
    [SerializeField] int level;

    public PokemonBase Base => _base;
    public int Level => level;

    public int Exp { get; private set; }
    public int HP { get; private set; }
    public List<Move> Moves { get; private set; }
    public Dictionary<Stat, int> StatBoosts { get; private set; }
    public Condition Status { get; private set; }

    // Calculated stats
    public int MaxHp { get; private set; }
    public int Attack => GetStat(Stat.Attack);
    public int Defense => GetStat(Stat.Defense);
    public int SpAttack => GetStat(Stat.SpAttack);
    public int SpDefense => GetStat(Stat.SpDefense);
    public int Speed => GetStat(Stat.Speed);

    public bool IsKO => HP <= 0;

    public Pokemon(PokemonBase pBase, int pLevel)
    {
        _base = pBase;
        level = pLevel;
        Init();
    }

    public void Init()
    {
        Moves = new List<Move>();
        foreach (var learnable in _base.LearnableMoves)
        {
            if (learnable.Level <= level)
                Moves.Add(new Move(learnable.MoveBase));
            if (Moves.Count >= 4) break;
        }

        StatBoosts = new Dictionary<Stat, int>
        {
            { Stat.Attack, 0 }, { Stat.Defense, 0 },
            { Stat.SpAttack, 0 }, { Stat.SpDefense, 0 }, { Stat.Speed, 0 }
        };

        CalculateStats();
        HP = MaxHp;
    }

    void CalculateStats()
    {
        MaxHp = Mathf.FloorToInt((_base.MaxHp * level) / 100f) + level + 10;
    }

    int GetStat(Stat stat)
    {
        float baseStat = stat switch
        {
            Stat.Attack    => _base.Attack,
            Stat.Defense   => _base.Defense,
            Stat.SpAttack  => _base.SpAttack,
            Stat.SpDefense => _base.SpDefense,
            Stat.Speed     => _base.Speed,
            _ => 1
        };

        int boost = StatBoosts[stat];
        float modifier = boost >= 0
            ? (2f + boost) / 2f
            : 2f / (2f - boost);

        return Mathf.FloorToInt(baseStat * modifier);
    }

    public int TakeDamage(Move move, Pokemon attacker)
    {
        float typeEffectiveness = TypeChart.GetEffectiveness(move.Base.Type, Base.Type1)
                                * TypeChart.GetEffectiveness(move.Base.Type, Base.Type2);

        bool isCritical = UnityEngine.Random.value < 0.0625f;
        float critical = isCritical ? 1.5f : 1f;

        float atk = move.Base.Category == MoveCategory.Special ? attacker.SpAttack : attacker.Attack;
        float def = move.Base.Category == MoveCategory.Special ? SpDefense : Defense;

        float damage = ((2f * attacker.Level / 5f + 2f) * move.Base.Power * (atk / def) / 50f + 2f)
                       * typeEffectiveness * critical;

        int dmg = Mathf.Max(1, Mathf.FloorToInt(damage));
        HP = Mathf.Max(0, HP - dmg);
        return dmg;
    }

    public void Heal(int amount)
    {
        HP = Mathf.Min(MaxHp, HP + amount);
    }

    public void SetStatus(Condition condition)
    {
        Status = condition;
    }

    public bool LevelUp()
    {
        int expNeeded = (level + 1) * (level + 1) * (level + 1);
        if (Exp >= expNeeded)
        {
            level++;
            CalculateStats();
            return true;
        }
        return false;
    }

    public void GainExp(int amount)
    {
        Exp += amount;
    }
}

public enum Stat { Attack, Defense, SpAttack, SpDefense, Speed }
public enum Condition { None, Burn, Freeze, Paralysis, Poison, Sleep }
