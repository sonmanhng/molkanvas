# MolKanvas ⚗️

> **Author:** Manh-Son Nguyen &nbsp;|&nbsp; **Version:** 1.0.0 &nbsp;|&nbsp; **License:** MIT

**MolKanvas** là phần mềm vẽ cấu trúc hóa học chuyên nghiệp, hoạt động hoàn toàn offline.  
Xây dựng bằng **Electron + React + Python (RDKit)**.

---

## Tính năng

| Tính năng | Mô tả |
|-----------|-------|
| 🖊️ **Vẽ cấu trúc** | Liên kết, vòng, stereo bond (wedge/hash) |
| 🔄 **SMILES / IUPAC** | Nhập SMILES → render cấu trúc; tra tên IUPAC |
| 🔬 **3D Visualization** | Xem cấu trúc 3D với 3Dmol.js |
| 📊 **NMR Prediction** | Dự đoán phổ ¹H NMR, ¹³C NMR (offline) |
| 🌡️ **IR Prediction** | Dự đoán phổ hồng ngoại theo nhóm chức |
| 🧫 **BioDraw** | Lipid bilayer, kháng thể, DNA, thụ thể |
| 🧬 **Peptide/DNA** | Nhập chuỗi amino acid / nucleotide → cấu trúc 2D |
| 🧪 **TLC Simulator** | Mô phỏng sắc ký bản mỏng |
| 💊 **ChEMBL Search** | Tra hoạt tính sinh học từ database ChEMBL |
| 🏷️ **Physicochemical** | MW, LogP, TPSA, Lipinski |
| 🎯 **Stereo Analysis** | Phân tích R/S, E/Z tự động |

---

## Cấu trúc dự án

Đây là thư mục làm việc chính của MolKanvas. Bạn có thể copy toàn bộ thư mục này đi bất cứ đâu.

```
molkanvas/                        ← Copy toàn bộ folder này
│
├── electron/                     ← Electron main process
│   ├── main.cjs                  ← Main process + IPC handlers
│   └── preload.cjs               ← Context bridge
├── src/                          ← React frontend
│   ├── App.tsx                   
│   ├── components/               
│   └── store/                    
├── public/                       ← Static assets (3Dmol.js, icons)
├── index.html                    
├── package.json                  
│
├── ocr/                          ← Backend Python (RDKit)
│   ├── calc_props.py             
│   ├── predict_nmr.py            
│   ├── predict_ir.py             
│   ├── 2d_to_3d.py              
│   ├── smiles_to_graph.py        
│   └── worker.py                 
│
├── .gitignore
├── README.md                     ← File này
└── install.bat                   ← Cài đặt Windows 1-click
```

---

## Cài đặt (Self-contained)

### Yêu cầu

| Phần mềm | Phiên bản | Link tải |
|----------|-----------|----------|
| **Node.js** | ≥ 18 LTS | https://nodejs.org |
| **Python** | ≥ 3.10 | https://www.python.org *(tick "Add to PATH")* |

---

### Windows — Cài 1-click

```
1. Mở folder molkanvas (thư mục chứa file này)
2. Double-click  install.bat
3. Chờ ~3-5 phút (cài đặt npm packages và python RDKit) → app tự khởi động
4. Lần sau: double-click  start.bat  để mở.
```

---

### MacOS / Linux

```bash
# Vào thư mục dự án
cd /path/to/molkanvas

# Cài Python dependencies
cd ocr
python3 -m venv .venv
source .venv/bin/activate
pip install rdkit
deactivate
cd ..


cd ocr
python3.11 -m venv .venv
source .venv/bin/activate
pip install rdkit DECIMER tensorflow scikit-image pillow scipy pyinstaller

# Cài Node + chạy app
npm install
npm run app:dev
```

---

