# MolKanvas

**MolKanvas** is a desktop application for drawing, inspecting, and analyzing chemical structures. It is designed to provide a lightweight, offline-first workflow for common cheminformatics tasks, with a React/Electron frontend and an RDKit-based Python backend.

**Author:** Manh-Son Nguyen
**Version:** 1.0.0
**License:** MIT

---

## Overview

MolKanvas combines chemical structure drawing with basic molecular analysis in a single desktop application.

The application is built around three components:

* **Electron** — desktop application and system integration
* **React** — user interface
* **Python + RDKit** — molecular structure processing and cheminformatics calculations

Most structure-processing operations are performed locally. External services are only required for features that explicitly depend on online databases, such as ChEMBL queries.

---

## Features

### Structure editor

* Draw atoms and bonds
* Create common ring systems
* Support single, double, triple, and aromatic bonds
* Wedge and hashed bonds for stereochemical representation
* Edit and inspect molecular structures interactively

### SMILES and structure conversion

* Import structures from SMILES
* Generate 2D molecular depictions from molecular structures
* Convert molecular structures into graph representations
* Generate 3D conformations using RDKit

### Molecular properties

Calculate commonly used molecular descriptors, including:

* Molecular weight (MW)
* LogP
* Topological polar surface area (TPSA)
* Hydrogen-bond donors and acceptors
* Rotatable bonds
* Lipinski-related properties

### Stereochemistry

Analyze stereochemical information in a molecular structure, including:

* R/S configurations
* E/Z configurations
* Stereogenic centers
* Wedge/hash bond representations

### NMR prediction

MolKanvas provides local, structure-based prediction tools for:

* **¹H NMR**
* **¹³C NMR**

The prediction module is intended for preliminary spectral interpretation rather than replacement of experimental NMR data.

### IR prediction

The IR module identifies characteristic functional groups and estimates their corresponding IR absorption regions.

This feature is intended as a qualitative prediction tool for functional-group analysis.

### 3D visualization

Molecules can be inspected in three dimensions using **3Dmol.js**.

The viewer supports common molecular representations such as:

* Ball-and-stick
* Stick
* Sphere
* Cartoon representations where applicable

### BioDraw

MolKanvas includes graphical components for constructing simplified biological structures, such as:

* Lipid bilayers
* DNA
* Antibodies
* Receptor-like structures

These components are intended primarily for visualization and figure preparation.

### Peptide and DNA tools

The application provides utilities for converting:

* Amino-acid sequences
* Nucleotide sequences

into corresponding molecular representations.

### TLC simulator

A simple thin-layer chromatography (TLC) simulator is included for educational and visualization purposes.

Users can specify compounds and experimental parameters to generate a qualitative TLC representation.

### ChEMBL integration

MolKanvas can query **ChEMBL** for compound-related biological activity data.

Because ChEMBL is an external database, an internet connection is required for this functionality.

---

## Project structure

```text
molkanvas/
│
├── electron/
│   ├── main.cjs              # Electron main process and IPC handlers
│   └── preload.cjs           # Secure renderer/main-process bridge
│
├── src/
│   ├── App.tsx
│   ├── components/
│   └── store/
│
├── public/
│   ├── 3dmol/
│   └── icons/
│
├── ocr/                      # Python backend
│   ├── calc_props.py         # Molecular property calculations
│   ├── predict_nmr.py        # NMR prediction
│   ├── predict_ir.py         # IR prediction
│   ├── 2d_to_3d.py           # 2D/SMILES to 3D conversion
│   ├── smiles_to_graph.py    # Molecular graph conversion
│   └── worker.py             # Backend worker
│
├── index.html
├── package.json
├── .gitignore
├── README.md
└── install.bat
```

The entire `molkanvas` directory can be copied to another location without changing the project structure.

---

## Requirements

### Node.js

* Node.js 18 LTS or later

Download: https://nodejs.org/

### Python

* Python 3.10 or later
* `pip`
* Virtual environment support

Download: https://www.python.org/

On Windows, make sure **Add Python to PATH** is enabled during installation.

### Python dependencies

The main cheminformatics dependency is:

```text
RDKit
```

Additional Python dependencies may be added as the project develops.

---

## Installation

### Windows

The repository includes an installation script for Windows.

1. Open the `molkanvas` directory.
2. Run:

```text
install.bat
```

The installer creates the Python environment, installs the required Python packages, installs the Node.js dependencies, and prepares the application for development.

After installation, the application can be started using:

```text
start.bat
```

> The first installation may take several minutes depending on the machine and network connection.

---

### macOS / Linux

Clone or copy the repository and enter the project directory:

```bash
cd /path/to/molkanvas
```

Create the Python environment:

```bash
cd ocr

python3 -m venv .venv
source .venv/bin/activate

pip install rdkit

deactivate
cd ..
```

Install the Node.js dependencies:

```bash
npm install
```

Start the Electron application:

```bash
npm run app:dev
```

---

## Development

The application consists of a renderer process and a Python-based processing layer.

The general data flow is:

```text
React UI
   │
   │ IPC
   ▼
Electron Main Process
   │
   │ subprocess / IPC
   ▼
Python Backend
   │
   ▼
RDKit
```

Electron handles application-level operations and communication with the renderer. Computational chemistry operations are delegated to the Python backend where appropriate.

---

## Offline operation

MolKanvas is designed to perform core molecular operations locally.

The following types of operations can be performed without an internet connection:

* Structure editing
* SMILES processing
* Molecular property calculation
* 2D depiction
* 3D coordinate generation
* NMR prediction
* IR prediction
* Stereochemical analysis

Features that access external databases or services require an internet connection. In particular, **ChEMBL Search** requires network access.

---

## Scientific scope

MolKanvas is intended as a practical cheminformatics and chemical-structure visualization tool.

Predicted NMR and IR spectra should be treated as **computational estimates**. Their accuracy depends on the underlying models, molecular structure, and experimental conditions. They should not be interpreted as substitutes for experimentally measured spectra.

Similarly, the TLC simulator is a qualitative visualization tool and does not attempt to reproduce every experimental factor affecting chromatographic separation.

---

## License

MolKanvas is released under the **MIT License**.

See [`LICENSE`](LICENSE) for the full license text.

---

## Author

**Manh-Son Nguyen**

MolKanvas is developed as an independent cheminformatics software project combining molecular visualization, structure processing, and computational chemistry utilities.
