using UnityEngine;
using UnityEngine.UI;

public class WorldMapUI : MonoBehaviour
{
    [SerializeField] GameObject mapPanel;
    [SerializeField] Image mapImage;
    [SerializeField] RectTransform playerMarker;

    [Header("Map Bounds (match your map art)")]
    [SerializeField] Vector2 worldMin = new Vector2(-500f, -500f);
    [SerializeField] Vector2 worldMax = new Vector2(500f, 500f);

    Transform player;
    bool isOpen;

    void Start()
    {
        player = GameObject.FindGameObjectWithTag("Player")?.transform;
        mapPanel.SetActive(false);
    }

    void Update()
    {
        if (Input.GetKeyDown(KeyCode.M))
            Toggle();

        if (isOpen)
            UpdatePlayerMarker();
    }

    void Toggle()
    {
        isOpen = !isOpen;
        mapPanel.SetActive(isOpen);
        GameManager.Instance.SetState(isOpen ? GameState.Menu : GameState.Overworld);
    }

    void UpdatePlayerMarker()
    {
        if (player == null) return;

        float nx = Mathf.InverseLerp(worldMin.x, worldMax.x, player.position.x);
        float ny = Mathf.InverseLerp(worldMin.y, worldMax.y, player.position.z);

        var rect = mapImage.rectTransform;
        float px = Mathf.Lerp(rect.rect.xMin, rect.rect.xMax, nx);
        float py = Mathf.Lerp(rect.rect.yMin, rect.rect.yMax, ny);

        playerMarker.anchoredPosition = new Vector2(px, py);
    }

    // Call this from Inspector to assign your mapcharacter.jpg as the map sprite
    public void SetMapSprite(Sprite sprite)
    {
        mapImage.sprite = sprite;
    }
}
