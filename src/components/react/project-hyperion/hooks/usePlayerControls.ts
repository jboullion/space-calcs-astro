import { useState, useEffect } from "react";

interface PlayerControls {
  moveForward: boolean;
  moveBackward: boolean;
  moveLeft: boolean;
  moveRight: boolean;
  mouseX: number;
  mouseY: number;
  sprint: boolean;
}

const MOUSE_MOVEMENT_THRESHOLD = 0.5;

export function usePlayerControls() {
  const [movement, setMovement] = useState<PlayerControls>({
    moveForward: false,
    moveBackward: false,
    moveLeft: false,
    moveRight: false,
    mouseX: 0,
    mouseY: 0,
    sprint: false,
  });

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      switch (event.code) {
        case "KeyW":
        case "ArrowUp":
          setMovement((m) => ({ ...m, moveForward: true }));
          break;
        case "KeyS":
        case "ArrowDown":
          setMovement((m) => ({ ...m, moveBackward: true }));
          break;
        case "KeyA":
        case "ArrowLeft":
          setMovement((m) => ({ ...m, moveLeft: true }));
          break;
        case "KeyD":
        case "ArrowRight":
          setMovement((m) => ({ ...m, moveRight: true }));
          break;
        case "ShiftLeft":
          setMovement((m) => ({ ...m, sprint: true }));
          break;
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      switch (event.code) {
        case "KeyW":
        case "ArrowUp":
          setMovement((m) => ({ ...m, moveForward: false }));
          break;
        case "KeyS":
        case "ArrowDown":
          setMovement((m) => ({ ...m, moveBackward: false }));
          break;
        case "KeyA":
        case "ArrowLeft":
          setMovement((m) => ({ ...m, moveLeft: false }));
          break;
        case "KeyD":
        case "ArrowRight":
          setMovement((m) => ({ ...m, moveRight: false }));
          break;
        case "ShiftLeft":
          setMovement((m) => ({ ...m, sprint: false }));
          break;
      }
    };

    const handleMouseMove = (event: MouseEvent) => {
      if (document.pointerLockElement === document.body) {
        // Apply threshold to mouse movement
        const movementX =
          Math.abs(event.movementX) > MOUSE_MOVEMENT_THRESHOLD
            ? event.movementX
            : 0;
        const movementY =
          Math.abs(event.movementY) > MOUSE_MOVEMENT_THRESHOLD
            ? event.movementY
            : 0;

        setMovement((m) => ({
          ...m,
          mouseX: movementX,
          mouseY: movementY,
        }));
      } else {
        // Reset mouse movement when pointer is not locked
        setMovement((m) => ({
          ...m,
          mouseX: 0,
          mouseY: 0,
        }));
      }
    };

    const handleClick = () => {
      // Only request pointer lock if clicking on the canvas
      if (event?.target instanceof HTMLCanvasElement) {
        document.body.requestPointerLock();
      }
    };

    const handlePointerLockChange = () => {
      if (!document.pointerLockElement) {
        // Reset mouse movement when exiting pointer lock
        setMovement((m) => ({
          ...m,
          mouseX: 0,
          mouseY: 0,
        }));
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("click", handleClick);
    document.addEventListener("pointerlockchange", handlePointerLockChange);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("click", handleClick);
      document.removeEventListener(
        "pointerlockchange",
        handlePointerLockChange
      );
    };
  }, []);

  useEffect(() => {
    if (movement.mouseX !== 0 || movement.mouseY !== 0) {
      // Reset mouse movement values in the next frame
      const handle = requestAnimationFrame(() => {
        setMovement((m) => ({
          ...m,
          mouseX: 0,
          mouseY: 0,
        }));
      });
      return () => cancelAnimationFrame(handle);
    }
  }, [movement.mouseX, movement.mouseY]);

  return movement;
}
