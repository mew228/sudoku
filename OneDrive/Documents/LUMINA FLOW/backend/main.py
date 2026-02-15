import asyncio
import cv2
import json
from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from ai_core.detector import TrafficDetector
from pydantic import BaseModel

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global State
class SystemState:
    signal_status: str = "GREEN"  # GREEN, RED, OMNI-STOP

state = SystemState()

class SignalRequest(BaseModel):
    status: str

@app.get("/")
def read_root():
    return {"message": "LUMINA FLOW AI Kernel Active", "state": state.signal_status}

@app.post("/api/signal")
async def set_signal(req: SignalRequest):
    state.signal_status = req.status
    return {"status": "updated", "current_signal": state.signal_status}

# Initialize AI Core
detector = TrafficDetector()

@app.websocket("/ws/traffic")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    print("Client Connected to Neural Stream")
    
    # Open Video Stream
    cap = cv2.VideoCapture("traffic.mp4") 
    
    try:
        while True:
            ret, frame = cap.read()
            if not ret:
                cap.set(cv2.CAP_PROP_POS_FRAMES, 0) # Loop video
                continue
            
            # 1. Run AI Detection
            detections = detector.detect(frame)
            
            # Simple ID assignment for demo (real tracker would persist IDs)
            for i, d in enumerate(detections):
                d["id"] = i 
                d["speed"] = 0.5 if state.signal_status == "GREEN" else 0.0 # Stop cars if RED
                d["direction"] = 1

            # 2. Package Data with System State
            payload = {
                "system_status": state.signal_status,
                "vehicles": detections
            }

            # 3. Send Data to Client
            await websocket.send_json(payload)
            await asyncio.sleep(0.033) # ~30 FPS
            
    except Exception as e:
        print(f"WS Error: {e}")
    finally:
        cap.release()
