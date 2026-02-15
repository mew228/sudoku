from ultralytics import YOLO
import cv2
import typing

class TrafficDetector:
    def __init__(self, model_path="yolov8n.pt"):
        # Load standard YOLOv8 nano model (downloads automatically)
        print("Loading YOLOv8 model...")
        self.model = YOLO(model_path)
        # Class IDs for vehicles in COCO dataset:
        # 2: car, 3: motorcycle, 5: bus, 7: truck
        self.target_classes = [2, 3, 5, 7]

    def detect(self, frame) -> typing.List[dict]:
        results = self.model(frame, verbose=False) # Run inference
        detections = []
        
        for r in results:
            boxes = r.boxes
            for box in boxes:
                cls = int(box.cls[0])
                if cls in self.target_classes:
                    x1, y1, x2, y2 = box.xyxy[0].tolist()
                    conf = float(box.conf[0])
                    
                    # Normalize coordinates to -100 to 100 for our 3D scene
                    # Assuming frame is 640x640:
                    # x: 0->640 maps to -100->100
                    # z (y in video): 0->640 maps to -100->100
                    
                    x_norm = ((x1 + x2) / 2 / 640 * 200) - 100
                    z_norm = ((y1 + y2) / 2 / 640 * 200) - 100

                    detections.append({
                        "id": -1, # Tracker needs to assign ID
                        "x": x_norm,
                        "z": z_norm,
                        "class": self.model.names[cls],
                        "conf": conf
                    })
        return detections
