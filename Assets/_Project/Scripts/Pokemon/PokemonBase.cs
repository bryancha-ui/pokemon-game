using System.Collections.Generic;
using UnityEngine;

[CreateAssetMenu(fileName = "Pokemon", menuName = "PokemonKorea/Pokemon")]
public class PokemonBase : ScriptableObject
{
    [Header("Identity")]
    [SerializeField] string pokemonName;
    [TextArea] [SerializeField] string description;
    [SerializeField] Sprite frontSprite;
    [SerializeField] Sprite backSprite;

    [Header("Types")]
    [SerializeField] PokemonType type1;
    [SerializeField] PokemonType type2;

    [Header("Base Stats")]
    [SerializeField] int maxHp;
    [SerializeField] int attack;
    [SerializeField] int defense;
    [SerializeField] int spAttack;
    [SerializeField] int spDefense;
    [SerializeField] int speed;

    [Header("Training")]
    [SerializeField] int baseExpYield;
    [SerializeField] int catchRate = 45;

    [Header("Learnable Moves")]
    [SerializeField] List<LearnableMove> learnableMoves;

    public string Name => pokemonName;
    public string Description => description;
    public Sprite FrontSprite => frontSprite;
    public Sprite BackSprite => backSprite;
    public PokemonType Type1 => type1;
    public PokemonType Type2 => type2;
    public int MaxHp => maxHp;
    public int Attack => attack;
    public int Defense => defense;
    public int SpAttack => spAttack;
    public int SpDefense => spDefense;
    public int Speed => speed;
    public int BaseExpYield => baseExpYield;
    public int CatchRate => catchRate;
    public List<LearnableMove> LearnableMoves => learnableMoves;
}

[System.Serializable]
public class LearnableMove
{
    [SerializeField] MoveBase moveBase;
    [SerializeField] int level;

    public MoveBase MoveBase => moveBase;
    public int Level => level;
}

public enum PokemonType
{
    None,
    Normal, Fire, Water, Grass, Electric, Ice,
    Fighting, Poison, Ground, Flying, Psychic,
    Bug, Rock, Ghost, Dragon, Dark, Steel, Fairy
}
