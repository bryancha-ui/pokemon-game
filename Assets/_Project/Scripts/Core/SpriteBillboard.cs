using UnityEngine;

/// Rotates the sprite to always face the camera on the Y axis.
public class SpriteBillboard : MonoBehaviour
{
    void LateUpdate()
    {
        if (Camera.main == null) return;
        var dir = transform.position - Camera.main.transform.position;
        dir.y = 0f;
        if (dir != Vector3.zero)
            transform.rotation = Quaternion.LookRotation(dir);
    }
}
