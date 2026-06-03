using System.Collections;
using TMPro;
using UnityEngine;
using UnityEngine.UI;

public class BattleHUD : MonoBehaviour
{
    [SerializeField] TextMeshProUGUI nameText;
    [SerializeField] TextMeshProUGUI levelText;
    [SerializeField] Slider hpSlider;
    [SerializeField] TextMeshProUGUI hpText;

    Pokemon pokemon;

    public void SetData(Pokemon p)
    {
        pokemon = p;
        nameText.text = p.Base.Name;
        levelText.text = $"Lv.{p.Level}";
        hpSlider.maxValue = p.MaxHp;
        hpSlider.value = p.HP;
        hpText.text = $"{p.HP}/{p.MaxHp}";
    }

    public IEnumerator UpdateHP()
    {
        float target = (float)pokemon.HP / pokemon.MaxHp;
        while (Mathf.Abs(hpSlider.normalizedValue - target) > 0.001f)
        {
            hpSlider.normalizedValue = Mathf.MoveTowards(hpSlider.normalizedValue, target, Time.deltaTime);
            hpText.text = $"{Mathf.RoundToInt(hpSlider.value)}/{pokemon.MaxHp}";
            yield return null;
        }
        hpSlider.normalizedValue = target;
        hpText.text = $"{pokemon.HP}/{pokemon.MaxHp}";
    }
}
