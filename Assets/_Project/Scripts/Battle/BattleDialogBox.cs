using System.Collections;
using System.Collections.Generic;
using TMPro;
using UnityEngine;
using UnityEngine.UI;

public class BattleDialogBox : MonoBehaviour
{
    [SerializeField] TextMeshProUGUI dialogText;
    [SerializeField] float lettersPerSecond = 30f;

    [Header("Action Selector")]
    [SerializeField] GameObject actionSelector;
    [SerializeField] List<TextMeshProUGUI> actionTexts;

    [Header("Move Selector")]
    [SerializeField] GameObject moveSelector;
    [SerializeField] List<TextMeshProUGUI> moveTexts;
    [SerializeField] TextMeshProUGUI ppText;
    [SerializeField] TextMeshProUGUI moveTypeText;

    public IEnumerator TypeDialog(string text)
    {
        dialogText.text = "";
        foreach (char c in text)
        {
            dialogText.text += c;
            yield return new WaitForSeconds(1f / lettersPerSecond);
        }
        yield return new WaitForSeconds(0.5f);
    }

    public void SetDialog(string text) => dialogText.text = text;

    public void ShowActionSelector(bool show) => actionSelector.SetActive(show);

    public void ShowMoveSelector(bool show, Pokemon pokemon = null)
    {
        moveSelector.SetActive(show);
        if (!show) return;

        for (int i = 0; i < moveTexts.Count; i++)
        {
            if (i < pokemon.Moves.Count)
            {
                moveTexts[i].text = pokemon.Moves[i].Base.Name;
                moveTexts[i].color = Color.white;
            }
            else
            {
                moveTexts[i].text = "-";
                moveTexts[i].color = Color.gray;
            }
        }
    }

    public void UpdateMoveSelection(int selected, Move move)
    {
        for (int i = 0; i < moveTexts.Count; i++)
            moveTexts[i].color = i == selected ? Color.yellow : Color.white;

        ppText.text = $"PP {move.PP}/{move.Base.PP}";
        moveTypeText.text = move.Base.Type.ToString();
    }
}
