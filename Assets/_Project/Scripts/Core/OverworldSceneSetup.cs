#if UNITY_EDITOR
using UnityEditor;
using UnityEditor.SceneManagement;
using UnityEngine;

public static class OverworldSceneSetup
{
    [MenuItem("PokemonKorea/Build Overworld Test Scene")]
    public static void Build()
    {
        if (!EditorSceneManager.SaveCurrentModifiedScenesIfUserWantsTo()) return;

        EditorSceneManager.NewScene(NewSceneSetup.EmptyScene, NewSceneMode.Single);

        // Ground plane
        var ground = GameObject.CreatePrimitive(PrimitiveType.Plane);
        ground.name = "Ground";
        ground.transform.localScale = new Vector3(5f, 1f, 5f);
        var groundMat = new Material(Shader.Find("Standard"));
        groundMat.color = new Color(0.3f, 0.6f, 0.25f); // grass green
        ground.GetComponent<Renderer>().sharedMaterial = groundMat;

        // Player
        var playerGO = new GameObject("Player");
        playerGO.tag = "Player";
        playerGO.transform.position = new Vector3(0f, 0.5f, 0f);

        var cc = playerGO.AddComponent<CharacterController>();
        cc.height = 1.8f;
        cc.center = new Vector3(0f, 0f, 0f);

        playerGO.AddComponent<PokemonParty>();

        // Sprite renderer for character graphic
        var spriteGO = new GameObject("Sprite");
        spriteGO.transform.SetParent(playerGO.transform, false);
        spriteGO.transform.localPosition = new Vector3(0f, 0.5f, 0f);
        spriteGO.transform.localScale = new Vector3(1.5f, 2f, 1f);
        var sr = spriteGO.AddComponent<SpriteRenderer>();

        // Load character sprite if already imported as Sprite type
        var sprite = AssetDatabase.LoadAssetAtPath<Sprite>(
            "Assets/_Project/Animations/Characters/characterboy.jpg");
        if (sprite != null)
        {
            sr.sprite = sprite;
        }
        else
        {
            Debug.LogWarning("[OverworldSceneSetup] Sprite not found — set Texture Type to 'Sprite (2D and UI)' on characterboy.jpg then run this again.");
        }

        // Billboard: always face camera on Y axis
        spriteGO.AddComponent<SpriteBillboard>();

        // Camera
        var camGO = new GameObject("Main Camera");
        camGO.tag = "MainCamera";
        camGO.AddComponent<Camera>();
        camGO.AddComponent<AudioListener>();
        camGO.transform.position = playerGO.transform.position + new Vector3(0f, 8f, -5f);
        camGO.transform.LookAt(playerGO.transform.position + Vector3.up * 1.5f);

        var follow = camGO.AddComponent<CameraFollow>();
        var so = new UnityEditor.SerializedObject(follow);
        so.FindProperty("target").objectReferenceValue = playerGO.transform;
        so.ApplyModifiedProperties();

        // Wire PlayerController last (needs camera + party already on player)
        var pc = playerGO.AddComponent<PlayerController>();
        var pcSo = new UnityEditor.SerializedObject(pc);
        pcSo.FindProperty("cameraTransform").objectReferenceValue = camGO.transform;
        pcSo.ApplyModifiedProperties();

        // Directional light
        var lightGO = new GameObject("Directional Light");
        var light = lightGO.AddComponent<Light>();
        light.type = LightType.Directional;
        light.intensity = 1f;
        lightGO.transform.rotation = Quaternion.Euler(50f, -30f, 0f);

        // Save
        if (!AssetDatabase.IsValidFolder("Assets/_Project/Scenes"))
            AssetDatabase.CreateFolder("Assets/_Project", "Scenes");

        var scene = UnityEngine.SceneManagement.SceneManager.GetActiveScene();
        EditorSceneManager.SaveScene(scene, "Assets/_Project/Scenes/OverworldTestScene.unity");
        AssetDatabase.Refresh();

        Selection.activeGameObject = playerGO;
        Debug.Log("[OverworldSceneSetup] Done — press Play and use WASD to move. Hold Left Shift to run.");
    }
}
#endif
