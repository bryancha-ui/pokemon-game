using UnityEngine;

[CreateAssetMenu(fileName = "Move", menuName = "PokemonKorea/Move")]
public class MoveBase : ScriptableObject
{
    [SerializeField] string moveName;
    [TextArea] [SerializeField] string description;
    [SerializeField] PokemonType type;
    [SerializeField] MoveCategory category;
    [SerializeField] int power;
    [SerializeField] int accuracy;
    [SerializeField] int pp;
    [SerializeField] MoveTarget target;
    [SerializeField] MoveEffects effects;

    public string Name => moveName;
    public string Description => description;
    public PokemonType Type => type;
    public MoveCategory Category => category;
    public int Power => power;
    public int Accuracy => accuracy;
    public int PP => pp;
    public MoveTarget Target => target;
    public MoveEffects Effects => effects;
}

[System.Serializable]
public class MoveEffects
{
    [SerializeField] Stat boostStat;
    [SerializeField] int boostAmount;
    [SerializeField] Condition status;

    public Stat BoostStat => boostStat;
    public int BoostAmount => boostAmount;
    public Condition Status => status;
}

public class Move
{
    public MoveBase Base { get; private set; }
    public int PP { get; private set; }

    public Move(MoveBase moveBase)
    {
        Base = moveBase;
        PP = moveBase.PP;
    }

    public bool HasPP => PP > 0;

    public void UsePP()
    {
        if (PP > 0) PP--;
    }
}

public enum MoveCategory { Physical, Special, Status }
public enum MoveTarget { Foe, Self }
