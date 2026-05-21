"""
WebSocket-based real-time notification manager.
"""
import json
from typing import Dict, List
from fastapi import WebSocket


class NotificationManager:
    def __init__(self):
        self._connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, trainee_id: str, websocket: WebSocket):
        await websocket.accept()
        if trainee_id not in self._connections:
            self._connections[trainee_id] = []
        self._connections[trainee_id].append(websocket)

    def disconnect(self, trainee_id: str, websocket: WebSocket):
        if trainee_id in self._connections:
            try:
                self._connections[trainee_id].remove(websocket)
            except ValueError:
                pass
            if not self._connections[trainee_id]:
                del self._connections[trainee_id]

    async def send_to_trainee(self, trainee_id: str, payload: dict):
        sockets = list(self._connections.get(str(trainee_id), []))
        dead = []
        for ws in sockets:
            try:
                await ws.send_text(json.dumps(payload))
            except Exception:
                dead.append(ws)
        for ws in dead:
            self.disconnect(str(trainee_id), ws)


notification_manager = NotificationManager()