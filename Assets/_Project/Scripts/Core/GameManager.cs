using System;
using UnityEngine;

public class GameManager : MonoBehaviour
{
    public static GameManager Instance { get; private set; }

    public event Action<GameState> OnStateChanged;

    [SerializeField] PlayerController player;
    [SerializeField] BattleSystem battleSystem;

    GameState state;
    public GameState State => state;

    void Awake()
    {
        if (Instance != null && Instance != this) { Destroy(gameObject); return; }
        Instance = this;
        DontDestroyOnLoad(gameObject);
    }

    void Start()
    {
        battleSystem.OnBattleOver += EndBattle;
        SetState(GameState.Overworld);
    }

    public void SetState(GameState newState)
    {
        state = newState;
        OnStateChanged?.Invoke(state);

        switch (state)
        {
            case GameState.Overworld:
                player.EnableInput(true);
                break;
            case GameState.Battle:
            case GameState.Menu:
            case GameState.Cutscene:
                player.EnableInput(false);
                break;
        }
    }

    public void StartWildBattle(PokemonBase wildPokemonBase, int wildLevel)
    {
        SetState(GameState.Battle);
        battleSystem.StartBattle(player.Party, wildPokemonBase, wildLevel);
    }

    void EndBattle(bool playerWon)
    {
        SetState(GameState.Overworld);
    }
}

public enum GameState
{
    Overworld,
    Battle,
    Menu,
    Cutscene,
    Paused
}
