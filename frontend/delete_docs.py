import shutil
import os

paths = [
    r"c:\Users\anmol\Desktop\BhoomiLedger\frontend\src\app\dashboard\documents",
    r"c:\Users\anmol\Desktop\BhoomiLedger\frontend\src\app\dashboard\admin-documents",
    r"c:\Users\anmol\Desktop\BhoomiLedger\frontend\src\app\portal\dashboard\documents"
]

for p in paths:
    if os.path.exists(p):
        shutil.rmtree(p)
