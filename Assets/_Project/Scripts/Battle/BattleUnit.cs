using UnityEngine;

public class BattleUnit : MonoBehaviour
{
    [SerializeField] bool isPlayerUnit;
    [SerializeField] BattleHUD hud;

    public Pokemon Pokemon { get; private set; }
    public bool IsPlayerUnit => isPlayerUnit;
    public BattleHUD Hud => hud;

    public void Setup(Pokemon pokemon)
    {
        Pokemon = pokemon;
        hud.SetData(pokemon);
    }
}
