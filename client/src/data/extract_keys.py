import os
import re
import json

directory = r"C:\Users\abhij\.gemini\antigravity\scratch\CROP2GO\client\src"
keys = set()

for root, _, files in os.walk(directory):
    for file in files:
        if file.endswith(('.jsx', '.js')):
            filepath = os.path.join(root, file)
            try:
                with open(filepath, 'r', encoding='utf-8') as f:
                    content = f.read()
                    matches = re.findall(r"t\(\s*['\"]([a-z_]+)['\"]\s*[,)]", content)
                    for match in matches:
                        keys.add(match)
            except Exception as e:
                pass

with open(r"C:\Users\abhij\.gemini\antigravity\scratch\CROP2GO\client\src\data\keys.json", 'w') as f:
    json.dump(list(keys), f)
