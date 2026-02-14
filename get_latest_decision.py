import json
from pathlib import Path

path = Path("agent_decision_log.json")
if path.exists():
    with open(path, "r") as f:
        data = json.load(f)
        if isinstance(data, list) and len(data) > 0:
            # Sort by timestamp if possible
            try:
                data.sort(key=lambda x: x.get("timestamp", ""), reverse=True)
            except: pass
            latest = data[0]
            print(f"Timestamp: {latest.get('timestamp')}")
            print(f"Summary: {json.dumps(latest.get('analysis_summary'), indent=2, ensure_ascii=False)}")
