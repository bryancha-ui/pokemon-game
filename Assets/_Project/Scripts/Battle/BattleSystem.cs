using System;
using System.Collections;
using UnityEngine;

public class BattleSystem : MonoBehaviour
{
    [SerializeField] BattleUnit playerUnit;
    [SerializeField] BattleUnit enemyUnit;
    [SerializeField] BattleDialogBox dialogBox;

    public event Action<bool> OnBattleOver;

    PokemonParty playerParty;
    Pokemon wildPokemon;
    BattleState state;

    public void StartBattle(PokemonParty party, PokemonBase wildBase, int wildLevel)
    {
        playerParty = party;
        wildPokemon = new Pokemon(wildBase, wildLevel);

        StartCoroutine(SetupBattle());
    }

    IEnumerator SetupBattle()
    {
        playerUnit.Setup(playerParty.First);
        enemyUnit.Setup(wildPokemon);

        yield return dialogBox.TypeDialog($"A wild {wildPokemon.Base.Name} appeared!");
        yield return new WaitForSeconds(1f);

        PlayerAction();
    }

    void PlayerAction()
    {
        state = BattleState.PlayerAction;
        dialogBox.ShowActionSelector(true);
        dialogBox.SetDialog("Choose an action.");
    }

    public void OnFightSelected()
    {
        if (state != BattleState.PlayerAction) return;
        state = BattleState.PlayerMove;
        dialogBox.ShowActionSelector(false);
        dialogBox.ShowMoveSelector(true, playerUnit.Pokemon);
    }

    public void OnMoveSelected(int moveIndex)
    {
        if (state != BattleState.PlayerMove) return;
        var move = playerUnit.Pokemon.Moves[moveIndex];
        if (!move.HasPP) return;

        dialogBox.ShowMoveSelector(false);
        StartCoroutine(RunTurn(move));
    }

    IEnumerator RunTurn(Move playerMove)
    {
        state = BattleState.Busy;

        yield return RunMove(playerUnit, enemyUnit, playerMove);
        if (state == BattleState.BattleOver) yield break;

        var enemyMove = enemyUnit.Pokemon.Moves[UnityEngine.Random.Range(0, enemyUnit.Pokemon.Moves.Count)];
        yield return RunMove(enemyUnit, playerUnit, enemyMove);
        if (state == BattleState.BattleOver) yield break;

        PlayerAction();
    }

    IEnumerator RunMove(BattleUnit source, BattleUnit target, Move move)
    {
        move.UsePP();
        yield return dialogBox.TypeDialog($"{source.Pokemon.Base.Name} used {move.Base.Name}!");

        int damage = target.Pokemon.TakeDamage(move, source.Pokemon);
        yield return target.Hud.UpdateHP();

        if (target.Pokemon.IsKO)
        {
            yield return dialogBox.TypeDialog($"{target.Pokemon.Base.Name} fainted!");
            yield return new WaitForSeconds(1f);
            CheckBattleOver(target);
        }
    }

    void CheckBattleOver(BattleUnit faintedUnit)
    {
        if (faintedUnit.IsPlayerUnit)
        {
            var next = playerParty.First;
            if (next != null)
                playerUnit.Setup(next);
            else
                EndBattle(false);
        }
        else
        {
            EndBattle(true);
        }
    }

    void EndBattle(bool playerWon)
    {
        state = BattleState.BattleOver;
        OnBattleOver?.Invoke(playerWon);
    }
}

public enum BattleState { Start, PlayerAction, PlayerMove, EnemyMove, Busy, BattleOver }
