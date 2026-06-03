#if UNITY_EDITOR
using System.Collections.Generic;
using UnityEditor;
using UnityEditor.Events;
using UnityEditor.SceneManagement;
using UnityEngine;
using UnityEngine.EventSystems;
using UnityEngine.UI;
using TMPro;

public static class BattleSceneSetup
{
    [MenuItem("PokemonKorea/Build Battle Scene")]
    public static void Build()
    {
        if (!EditorSceneManager.SaveCurrentModifiedScenesIfUserWantsTo()) return;

        EditorSceneManager.NewScene(NewSceneSetup.EmptyScene, NewSceneMode.Single);

        // EventSystem
        var esGO = new GameObject("EventSystem");
        esGO.AddComponent<EventSystem>();
        esGO.AddComponent<StandaloneInputModule>();

        // BattleSystem
        var battleSystemGO = new GameObject("BattleSystem");
        var battleSystem = battleSystemGO.AddComponent<BattleSystem>();

        // Canvas
        var canvasGO = new GameObject("BattleCanvas");
        var canvas = canvasGO.AddComponent<Canvas>();
        canvas.renderMode = RenderMode.ScreenSpaceOverlay;
        var scaler = canvasGO.AddComponent<CanvasScaler>();
        scaler.uiScaleMode = CanvasScaler.ScaleMode.ScaleWithScreenSize;
        scaler.referenceResolution = new Vector2(1280, 720);
        scaler.screenMatchMode = CanvasScaler.ScreenMatchMode.MatchWidthOrHeight;
        scaler.matchWidthOrHeight = 0.5f;
        canvasGO.AddComponent<GraphicRaycaster>();

        // Background
        MakePanel(canvasGO.transform, "Background", Color.black, Vector2.zero, Vector2.one);

        // Sprite placeholders
        MakePlaceholder(canvasGO.transform, "EnemySpriteArea", "[Enemy Sprite]",
            new Vector2(0.48f, 0.36f), new Vector2(0.98f, 0.95f));
        MakePlaceholder(canvasGO.transform, "PlayerSpriteArea", "[Player Sprite]",
            new Vector2(0.02f, 0.28f), new Vector2(0.52f, 0.72f));

        // Enemy HUD (top-left)
        var enemyHudGO = MakePanel(canvasGO.transform, "EnemyHUD", new Color(0.15f, 0.15f, 0.15f),
            new Vector2(0.02f, 0.68f), new Vector2(0.44f, 0.97f));
        var enemyHud = enemyHudGO.AddComponent<BattleHUD>();
        WireHUD(enemyHud, enemyHudGO);

        // Player HUD (mid-right)
        var playerHudGO = MakePanel(canvasGO.transform, "PlayerHUD", new Color(0.15f, 0.15f, 0.15f),
            new Vector2(0.54f, 0.32f), new Vector2(0.98f, 0.62f));
        var playerHud = playerHudGO.AddComponent<BattleHUD>();
        WireHUD(playerHud, playerHudGO);

        // BattleUnits (no visual — just carry Pokemon + HUD reference)
        var enemyUnitGO = new GameObject("EnemyUnit");
        enemyUnitGO.transform.SetParent(canvasGO.transform, false);
        var enemyUnit = enemyUnitGO.AddComponent<BattleUnit>();
        SetBool(enemyUnit, "isPlayerUnit", false);
        SetRef(enemyUnit, "hud", enemyHud);

        var playerUnitGO = new GameObject("PlayerUnit");
        playerUnitGO.transform.SetParent(canvasGO.transform, false);
        var playerUnit = playerUnitGO.AddComponent<BattleUnit>();
        SetBool(playerUnit, "isPlayerUnit", true);
        SetRef(playerUnit, "hud", playerHud);

        // Dialog box (bottom strip)
        var dialogGO = MakePanel(canvasGO.transform, "DialogBox", new Color(0.08f, 0.08f, 0.18f),
            new Vector2(0f, 0f), new Vector2(1f, 0.28f));
        var dialogBox = dialogGO.AddComponent<BattleDialogBox>();

        var dialogText = MakeTMP(dialogGO.transform, "DialogText", "...", 20, TextAlignmentOptions.TopLeft);
        SetAnchors(dialogText.rectTransform, new Vector2(0.01f, 0.05f), new Vector2(0.62f, 0.95f));

        // Action selector (right 38% of dialog)
        var actionSelGO = MakePanel(dialogGO.transform, "ActionSelector", new Color(0.05f, 0.05f, 0.12f),
            new Vector2(0.62f, 0f), new Vector2(1f, 1f));

        var actionTexts = new List<TextMeshProUGUI>();
        string[] actionLabels = { "FIGHT", "BAG", "POKEMON", "RUN" };
        Vector2[] aMins = { new Vector2(0f, 0.5f), new Vector2(0.5f, 0.5f), new Vector2(0f, 0f), new Vector2(0.5f, 0f) };
        Vector2[] aMaxs = { new Vector2(0.5f, 1f), new Vector2(1f, 1f), new Vector2(0.5f, 0.5f), new Vector2(1f, 0.5f) };

        Button fightButton = null;
        for (int i = 0; i < 4; i++)
        {
            var btnGO = MakeButton(actionSelGO.transform, $"{actionLabels[i]}Btn", actionLabels[i],
                new Color(0.18f, 0.18f, 0.35f), aMins[i], aMaxs[i]);
            actionTexts.Add(btnGO.GetComponentInChildren<TextMeshProUGUI>());
            if (i == 0) fightButton = btnGO.GetComponent<Button>();
        }

        // Move selector (same position, hidden by default)
        var moveSelGO = MakePanel(dialogGO.transform, "MoveSelector", new Color(0.05f, 0.05f, 0.12f),
            new Vector2(0.62f, 0f), new Vector2(1f, 1f));
        moveSelGO.SetActive(false);

        var moveTexts = new List<TextMeshProUGUI>();
        var moveButtons = new Button[4];
        Vector2[] mMins = { new Vector2(0f, 0.55f), new Vector2(0.5f, 0.55f), new Vector2(0f, 0.18f), new Vector2(0.5f, 0.18f) };
        Vector2[] mMaxs = { new Vector2(0.5f, 1f),  new Vector2(1f, 1f),  new Vector2(0.5f, 0.55f), new Vector2(1f, 0.55f) };

        for (int i = 0; i < 4; i++)
        {
            var btnGO = MakeButton(moveSelGO.transform, $"MoveBtn{i}", $"Move {i + 1}",
                new Color(0.18f, 0.18f, 0.35f), mMins[i], mMaxs[i]);
            moveButtons[i] = btnGO.GetComponent<Button>();
            moveTexts.Add(btnGO.GetComponentInChildren<TextMeshProUGUI>());
        }

        var ppText = MakeTMP(moveSelGO.transform, "PPText", "PP --/--", 15, TextAlignmentOptions.BottomLeft);
        SetAnchors(ppText.rectTransform, new Vector2(0.02f, 0f), new Vector2(0.5f, 0.18f));

        var typeText = MakeTMP(moveSelGO.transform, "TypeText", "TYPE", 15, TextAlignmentOptions.BottomRight);
        SetAnchors(typeText.rectTransform, new Vector2(0.5f, 0f), new Vector2(0.98f, 0.18f));

        // Wire BattleDialogBox
        SetRef(dialogBox, "dialogText", dialogText);
        SetRef(dialogBox, "actionSelector", actionSelGO);
        SetRef(dialogBox, "moveSelector", moveSelGO);
        SetRef(dialogBox, "ppText", ppText);
        SetRef(dialogBox, "moveTypeText", typeText);
        SetList(dialogBox, "actionTexts", actionTexts);
        SetList(dialogBox, "moveTexts", moveTexts);

        // Wire BattleSystem
        SetRef(battleSystem, "playerUnit", playerUnit);
        SetRef(battleSystem, "enemyUnit", enemyUnit);
        SetRef(battleSystem, "dialogBox", dialogBox);

        // Wire buttons
        if (fightButton != null)
            UnityEventTools.AddPersistentListener(fightButton.onClick, battleSystem.OnFightSelected);
        for (int i = 0; i < 4; i++)
            UnityEventTools.AddIntPersistentListener(moveButtons[i].onClick, battleSystem.OnMoveSelected, i);

        // BattleTestStarter
        var starterGO = new GameObject("BattleTestStarter");
        var starter = starterGO.AddComponent<BattleTestStarter>();
        SetRef(starter, "battleSystem", battleSystem);

        // Save scene
        if (!AssetDatabase.IsValidFolder("Assets/_Project/Scenes"))
            AssetDatabase.CreateFolder("Assets/_Project", "Scenes");

        var scene = UnityEngine.SceneManagement.SceneManager.GetActiveScene();
        EditorSceneManager.SaveScene(scene, "Assets/_Project/Scenes/BattleScene.unity");
        AssetDatabase.Refresh();

        Selection.activeGameObject = canvasGO;
        Debug.Log("[BattleSceneSetup] Scene saved to Assets/_Project/Scenes/BattleScene.unity — press Play to test.");
    }

    // ── UI factories ──────────────────────────────────────────────────────────

    static GameObject MakePanel(Transform parent, string name, Color color, Vector2 min, Vector2 max)
    {
        var go = new GameObject(name, typeof(RectTransform), typeof(Image));
        go.transform.SetParent(parent, false);
        var rt = (RectTransform)go.transform;
        rt.anchorMin = min; rt.anchorMax = max;
        rt.offsetMin = rt.offsetMax = Vector2.zero;
        go.GetComponent<Image>().color = color;
        return go;
    }

    static void MakePlaceholder(Transform parent, string name, string label, Vector2 min, Vector2 max)
    {
        var panel = MakePanel(parent, name, new Color(0.25f, 0.25f, 0.25f, 0.35f), min, max);
        var tmp = MakeTMP(panel.transform, "Label", label, 20);
        tmp.color = new Color(1f, 1f, 1f, 0.4f);
    }

    static TextMeshProUGUI MakeTMP(Transform parent, string name, string text, int size,
        TextAlignmentOptions align = TextAlignmentOptions.Center)
    {
        var go = new GameObject(name, typeof(RectTransform));
        go.transform.SetParent(parent, false);
        var rt = (RectTransform)go.transform;
        rt.anchorMin = Vector2.zero; rt.anchorMax = Vector2.one;
        rt.offsetMin = rt.offsetMax = Vector2.zero;
        var tmp = go.AddComponent<TextMeshProUGUI>();
        tmp.text = text; tmp.fontSize = size; tmp.alignment = align; tmp.color = Color.white;
        return tmp;
    }

    static GameObject MakeButton(Transform parent, string name, string label, Color bg, Vector2 min, Vector2 max)
    {
        var go = new GameObject(name, typeof(RectTransform), typeof(Image), typeof(Button));
        go.transform.SetParent(parent, false);
        var rt = (RectTransform)go.transform;
        rt.anchorMin = min; rt.anchorMax = max;
        rt.offsetMin = rt.offsetMax = Vector2.zero;
        go.GetComponent<Image>().color = bg;

        var txtGO = new GameObject("Text", typeof(RectTransform));
        txtGO.transform.SetParent(go.transform, false);
        var txtRT = (RectTransform)txtGO.transform;
        txtRT.anchorMin = Vector2.zero; txtRT.anchorMax = Vector2.one;
        txtRT.offsetMin = new Vector2(4, 4); txtRT.offsetMax = new Vector2(-4, -4);
        var tmp = txtGO.AddComponent<TextMeshProUGUI>();
        tmp.text = label; tmp.fontSize = 18; tmp.alignment = TextAlignmentOptions.Center; tmp.color = Color.white;
        return go;
    }

    static void WireHUD(BattleHUD hud, GameObject hudGO)
    {
        var nameTMP = MakeTMP(hudGO.transform, "NameText", "Name", 20, TextAlignmentOptions.Left);
        SetAnchors(nameTMP.rectTransform, new Vector2(0.03f, 0.6f), new Vector2(0.65f, 0.96f));

        var levelTMP = MakeTMP(hudGO.transform, "LevelText", "Lv.5", 18, TextAlignmentOptions.Right);
        SetAnchors(levelTMP.rectTransform, new Vector2(0.65f, 0.6f), new Vector2(0.97f, 0.96f));

        var sliderGO = DefaultControls.CreateSlider(new DefaultControls.Resources());
        sliderGO.name = "HPSlider";
        sliderGO.transform.SetParent(hudGO.transform, false);
        var sliderRT = (RectTransform)sliderGO.transform;
        sliderRT.anchorMin = new Vector2(0.03f, 0.3f); sliderRT.anchorMax = new Vector2(0.97f, 0.6f);
        sliderRT.offsetMin = sliderRT.offsetMax = Vector2.zero;
        var slider = sliderGO.GetComponent<Slider>();
        slider.minValue = 0; slider.maxValue = 1; slider.value = 1;
        // Color fill green, background dark
        var fill = sliderGO.transform.Find("Fill Area/Fill");
        if (fill != null) fill.GetComponent<Image>().color = Color.green;
        var bgImg = sliderGO.transform.Find("Background");
        if (bgImg != null) bgImg.GetComponent<Image>().color = new Color(0.2f, 0.2f, 0.2f);

        var hpTMP = MakeTMP(hudGO.transform, "HPText", "10/10", 16, TextAlignmentOptions.Right);
        SetAnchors(hpTMP.rectTransform, new Vector2(0.03f, 0.02f), new Vector2(0.97f, 0.3f));

        SetRef(hud, "nameText", nameTMP);
        SetRef(hud, "levelText", levelTMP);
        SetRef(hud, "hpSlider", slider);
        SetRef(hud, "hpText", hpTMP);
    }

    // ── Serialized field helpers ──────────────────────────────────────────────

    static void SetRef<T>(Component comp, string field, T obj) where T : Object
    {
        var so = new SerializedObject(comp);
        var prop = so.FindProperty(field);
        if (prop == null) { Debug.LogWarning($"[BattleSceneSetup] '{field}' not found on {comp.GetType().Name}"); return; }
        prop.objectReferenceValue = obj;
        so.ApplyModifiedProperties();
    }

    static void SetBool(Component comp, string field, bool value)
    {
        var so = new SerializedObject(comp);
        var prop = so.FindProperty(field);
        if (prop == null) { Debug.LogWarning($"[BattleSceneSetup] '{field}' not found on {comp.GetType().Name}"); return; }
        prop.boolValue = value;
        so.ApplyModifiedProperties();
    }

    static void SetList<T>(Component comp, string field, List<T> items) where T : Object
    {
        var so = new SerializedObject(comp);
        var prop = so.FindProperty(field);
        if (prop == null) { Debug.LogWarning($"[BattleSceneSetup] '{field}' not found on {comp.GetType().Name}"); return; }
        prop.arraySize = items.Count;
        for (int i = 0; i < items.Count; i++)
            prop.GetArrayElementAtIndex(i).objectReferenceValue = items[i];
        so.ApplyModifiedProperties();
    }

    static void SetAnchors(RectTransform rt, Vector2 min, Vector2 max)
    {
        rt.anchorMin = min; rt.anchorMax = max;
        rt.offsetMin = rt.offsetMax = Vector2.zero;
    }
}
#endif
