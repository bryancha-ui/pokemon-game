using UnityEngine;

[RequireComponent(typeof(CharacterController))]
public class PlayerController : MonoBehaviour
{
    [SerializeField] float walkSpeed = 4f;
    [SerializeField] float runSpeed = 8f;
    [SerializeField] float gravity = -20f;
    [SerializeField] Transform cameraTransform;

    CharacterController cc;
    Vector3 velocity;
    bool inputEnabled = true;

    public PokemonParty Party { get; private set; }

    void Awake()
    {
        cc = GetComponent<CharacterController>();
        Party = GetComponent<PokemonParty>();
    }

    void Update()
    {
        if (!inputEnabled) return;
        HandleMovement();
    }

    void HandleMovement()
    {
        float h = Input.GetAxisRaw("Horizontal");
        float v = Input.GetAxisRaw("Vertical");
        bool running = Input.GetButton("Fire3"); // Left Shift by default

        Vector3 camForward = cameraTransform.forward;
        Vector3 camRight = cameraTransform.right;
        camForward.y = 0f;
        camRight.y = 0f;
        camForward.Normalize();
        camRight.Normalize();

        Vector3 moveDir = (camForward * v + camRight * h).normalized;
        float speed = running ? runSpeed : walkSpeed;

        if (cc.isGrounded && velocity.y < 0f)
            velocity.y = -2f;

        velocity.y += gravity * Time.deltaTime;
        cc.Move((moveDir * speed + velocity) * Time.deltaTime);

        if (moveDir.sqrMagnitude > 0.01f)
            transform.rotation = Quaternion.Slerp(transform.rotation,
                Quaternion.LookRotation(moveDir), 10f * Time.deltaTime);
    }

    public void EnableInput(bool enabled)
    {
        inputEnabled = enabled;
        if (!enabled) velocity = Vector3.zero;
    }
}
