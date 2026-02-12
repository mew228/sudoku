from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from ultralytics import YOLO
from PIL import Image
import io
import numpy as np
import base64

app = FastAPI()

# Enable CORS for frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify the frontend domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load a pre-trained YOLOv8 model (Nano for speed, can be swapped for custom trained models)
# This will automatically download 'yolov8n.pt' on the first run
model = YOLO('yolov8n.pt') 

@app.get("/")
def read_root():
    return {"status": "Online", "model": "YOLOv8n"}

@app.post("/detect")
async def detect_objects(file: UploadFile = File(...)):
    # Read image file
    image_data = await file.read()
    image = Image.open(io.BytesIO(image_data))
    
    # Perform inference
    results = model(image)
    
    # Process results
    detections = []
    
    # We can also return the image with bounding boxes drawn
    # Plot returns a numpy array of the image with boxes
    res_plotted = results[0].plot()
    res_image = Image.fromarray(res_plotted[..., ::-1]) # RGB to BGR fix if needed, ultralytics returns BGR usually with cv2 but plot() might be RGB. 
    # Actually plot() returns BGR numpy array.
    
    # Convert plotted image to base64 for easy frontend display
    buffered = io.BytesIO()
    res_image.save(buffered, format="JPEG")
    img_str = base64.b64encode(buffered.getvalue()).decode("utf-8")
    
    # Extract JSON data
    for result in results:
        boxes = result.boxes
        for box in boxes:
            detections.append({
                "class": model.names[int(box.cls)],
                "confidence": float(box.conf),
                "bbox": box.xyxy.tolist()[0]
            })

    return {
        "detections": detections,
        "image_processed": f"data:image/jpeg;base64,{img_str}"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
