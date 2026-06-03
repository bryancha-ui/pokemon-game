using UnityEngine;

public class CameraFollow : MonoBehaviour
{
    [SerializeField] Transform target;
    [SerializeField] Vector3 offset = new Vector3(0f, 8f, -5f);
    [SerializeField] float smoothSpeed = 8f;

    void LateUpdate()
    {
        if (target == null) return;
        var desired = target.position + offset;
        transform.position = Vector3.Lerp(transform.position, desired, smoothSpeed * Time.deltaTime);
        transform.LookAt(target.position + Vector3.up * 1.5f);
    }
}
