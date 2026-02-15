import cv2
import numpy as np

def generate_traffic_video(filename="traffic.mp4", duration=10, fps=30):
    width, height = 640, 640
    fourcc = cv2.VideoWriter_fourcc(*'mp4v')
    out = cv2.VideoWriter(filename, fourcc, fps, (width, height))

    # Basic "Car" simulation state
    cars = []
    for _ in range(5):
        cars.append({
            "x": np.random.randint(200, 440),
            "y": np.random.randint(0, height),
            "speed": np.random.randint(2, 6),
            "color": (0, 255, 255) # Yellow-ish
        })

    print(f"Generating synthetic video: {filename}...")
    for frame_idx in range(duration * fps):
        frame = np.zeros((height, width, 3), dtype=np.uint8)
        
        # Draw Road
        cv2.rectangle(frame, (200, 0), (440, height), (50, 50, 50), -1)
        # Lane lines
        for y in range(0, height, 40):
            cv2.line(frame, (320, (y + frame_idx * 2) % height), (320, (y + frame_idx * 2 + 20) % height), (255, 255, 255), 2)

        # Draw Cars
        for car in cars:
            car["y"] += car["speed"]
            if car["y"] > height:
                car["y"] = -50
                car["x"] = np.random.randint(220, 420)
            
            # Draw Car
            cv2.rectangle(frame, (car["x"], car["y"]), (car["x"] + 40, car["y"] + 60), car["color"], -1)
            # Headlights
            cv2.circle(frame, (car["x"] + 10, car["y"] + 60), 5, (255, 255, 255), -1)
            cv2.circle(frame, (car["x"] + 30, car["y"] + 60), 5, (255, 255, 255), -1)

        out.write(frame)

    out.release()
    print("Video generation complete.")

if __name__ == "__main__":
    generate_traffic_video()
