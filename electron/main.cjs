const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('node:path');
const fs = require('node:fs');
const os = require('node:os');
const { execFile, spawn } = require('node:child_process');

const isDev = process.env.NODE_ENV === 'development';

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    title: 'MolKanvas',
    titleBarStyle: 'hiddenInset', // Mac style window
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  if (isDev) {
    // Try to load from known Vite ports
    const devUrl = process.env.VITE_DEV_URL || 'http://localhost:5173';
    win.loadURL(devUrl);
  } else {
    win.loadFile(path.join(__dirname, '../dist/index.html'));
  }
}

app.whenReady().then(() => {
  ipcMain.handle('recognize-image', async (event, buffer, fileName) => {
    return new Promise((resolve, reject) => {
      const tempPath = path.join(os.tmpdir(), fileName || 'temp_image.png');
      try {
        fs.writeFileSync(tempPath, Buffer.from(buffer));
      } catch (err) {
        return reject('Cannot write temp file: ' + err.message);
      }

      // We are in chemdraw-web/electron, so the ocr worker is at ../ocr/worker.py
      const scriptPath = path.join(__dirname, '../ocr/worker.py');
      const venvPython = path.join(__dirname, '../ocr/.venv/bin/python');
      
      execFile(venvPython, [scriptPath, tempPath], (error, stdout, stderr) => {
        if (error) {
          console.error('OCR Error:', stderr || error);
          reject(stderr || error.message);
        } else {
          resolve(stdout.trim());
        }
      });
    });
  });

  // Handle 3D coordinates generation
  ipcMain.handle('generate-3d', async (event, jsonPayload) => {
    return new Promise((resolve, reject) => {
      const tempPath = path.join(os.tmpdir(), 'mol_graph_3d.json');
      try {
        fs.writeFileSync(tempPath, jsonPayload);
      } catch (err) {
        return reject('Cannot write temp file: ' + err.message);
      }

      const scriptPath = path.join(__dirname, '../ocr/2d_to_3d.py');
      const venvPython = path.join(__dirname, '../ocr/.venv/bin/python');
      
      execFile(venvPython, [scriptPath, tempPath], (error, stdout, stderr) => {
        if (error) {
          console.error('3D Gen Error:', stderr || error);
          reject(stderr || error.message);
        } else {
          resolve(stdout);
        }
      });
    });
  });

  // Handle 2D MOL generation
  ipcMain.handle('generate-2d-mol', async (event, jsonPayload) => {
    return new Promise((resolve, reject) => {
      const tempPath = path.join(os.tmpdir(), 'mol_graph_2d.json');
      try {
        fs.writeFileSync(tempPath, jsonPayload);
      } catch (err) {
        return reject('Cannot write temp file: ' + err.message);
      }

      const scriptPath = path.join(__dirname, '../ocr/export_2d.py');
      const venvPython = path.join(__dirname, '../ocr/.venv/bin/python');
      
      execFile(venvPython, [scriptPath, tempPath], (error, stdout, stderr) => {
        if (error) {
          console.error('2D Gen Error:', stderr || error);
          reject(stderr || error.message);
        } else {
          resolve(stdout);
        }
      });
    });
  });

  // Handle Calculate Properties
  ipcMain.handle('calculate-properties', async (event, jsonPayload) => {
    return new Promise((resolve, reject) => {
      const tempPath = path.join(os.tmpdir(), 'mol_props.json');
      try {
        fs.writeFileSync(tempPath, jsonPayload);
      } catch (err) {
        return reject('Cannot write temp file: ' + err.message);
      }

      const scriptPath = path.join(__dirname, '../ocr/calc_props.py');
      const venvPython = path.join(__dirname, '../ocr/.venv/bin/python');
      
      execFile(venvPython, [scriptPath, tempPath], (error, stdout, stderr) => {
        if (error) {
          console.error('Props Calc Error:', stderr || error);
          reject(stderr || error.message);
        } else {
          try {
            const result = JSON.parse(stdout);
            resolve(result);
          } catch (e) {
            reject('Invalid JSON output from Python: ' + stdout);
          }
        }
      });
    });
  });

  // Handle SMILES to Graph
  ipcMain.handle('smiles-to-graph', async (event, smiles) => {
    return new Promise((resolve, reject) => {
      const tempPath = path.join(os.tmpdir(), 'input_smiles.txt');
      try {
        fs.writeFileSync(tempPath, smiles);
      } catch (err) {
        return reject('Cannot write temp file: ' + err.message);
      }
      const scriptPath = path.join(__dirname, '../ocr/smiles_to_graph.py');
      const venvPython = path.join(__dirname, '../ocr/.venv/bin/python');
      execFile(venvPython, [scriptPath, tempPath], (error, stdout, stderr) => {
        if (error) {
          console.error('SMILES Error:', stderr || error);
          reject(stderr || error.message);
        } else {
          try { resolve(JSON.parse(stdout)); }
          catch (e) { reject('Invalid JSON: ' + stdout); }
        }
      });
    });
  });

  // Handle Clean Graph
  ipcMain.handle('clean-graph', async (event, jsonPayload) => {
    return new Promise((resolve, reject) => {
      const tempPath = path.join(os.tmpdir(), 'dirty_graph.json');
      try {
        fs.writeFileSync(tempPath, jsonPayload);
      } catch (err) {
        return reject('Cannot write temp file: ' + err.message);
      }
      const scriptPath = path.join(__dirname, '../ocr/clean_graph.py');
      const venvPython = path.join(__dirname, '../ocr/.venv/bin/python');
      execFile(venvPython, [scriptPath, tempPath], (error, stdout, stderr) => {
        if (error) {
          console.error('Clean Error:', stderr || error);
          reject(stderr || error.message);
        } else {
          try { resolve(JSON.parse(stdout)); }
          catch (e) { reject('Invalid JSON: ' + stdout); }
        }
      });
    });
  });

  // Handle Analyze Stereo
  ipcMain.handle('analyze-stereo', async (event, data) => {
    const pythonExecutable = path.join(__dirname, '../ocr/.venv/bin/python');
    const scriptPath = path.join(__dirname, '../ocr/analyze_stereo.py');

    return new Promise((resolve, reject) => {
      const process = spawn(pythonExecutable, [scriptPath]);
      let output = '';
      let errorOutput = '';

      process.stdout.on('data', (chunk) => { output += chunk.toString(); });
      process.stderr.on('data', (chunk) => { errorOutput += chunk.toString(); });

      process.on('close', (code) => {
        if (code !== 0) {
          console.error('Python script error:', errorOutput);
          resolve({ error: errorOutput || 'Python script exited with code ' + code });
        } else {
          try {
            resolve(JSON.parse(output));
          } catch (e) {
            resolve({ error: 'Failed to parse python output: ' + output });
          }
        }
      });

      process.stdin.write(JSON.stringify(data));
      process.stdin.end();
    });
  });

  ipcMain.handle('parse-sequence', async (event, data) => {
    const pythonExecutable = path.join(__dirname, '../ocr/.venv/bin/python');
    const scriptPath = path.join(__dirname, '../ocr/bio_sequence.py');

    return new Promise((resolve, reject) => {
      const process = spawn(pythonExecutable, [scriptPath]);
      let output = '';
      let errorOutput = '';

      process.stdout.on('data', (chunk) => { output += chunk.toString(); });
      process.stderr.on('data', (chunk) => { errorOutput += chunk.toString(); });

      process.on('close', (code) => {
        if (code !== 0) {
          console.error('Python script error:', errorOutput);
          resolve({ error: errorOutput || 'Python script exited with code ' + code });
        } else {
          try {
            resolve(JSON.parse(output));
          } catch (e) {
            resolve({ error: 'Failed to parse python output: ' + output });
          }
        }
      });

      process.stdin.write(JSON.stringify(data));
      process.stdin.end();
    });
  });

  // ChEMBL API Search
  ipcMain.handle('chembl-search', async (event, smiles) => {
    try {
      // 1. Search for molecule
      const searchUrl = `https://www.ebi.ac.uk/chembl/api/data/molecule.json?molecule_structures__canonical_smiles__flexmatch=${encodeURIComponent(smiles)}`;
      const searchRes = await fetch(searchUrl);
      if (!searchRes.ok) {
        const text = await searchRes.text();
        return { error: `ChEMBL returned ${searchRes.status}: ` + text.substring(0, 100) };
      }
      const searchData = await searchRes.json();
      
      if (!searchData.molecules || searchData.molecules.length === 0) {
        return { error: 'No matching compound found in ChEMBL database for this SMILES.' };
      }
      
      const mol = searchData.molecules[0];
      const chemblId = mol.molecule_chembl_id;
      
      // 2. Fetch bioactivities
      const actUrl = `https://www.ebi.ac.uk/chembl/api/data/activity.json?molecule_chembl_id=${chemblId}&standard_type__in=IC50,Ki,EC50,Kd&pchembl_value__isnull=false&limit=20`;
      const actRes = await fetch(actUrl);
      if (!actRes.ok) {
        const text = await actRes.text();
        return { error: `ChEMBL activity returned ${actRes.status}: ` + text.substring(0, 100) };
      }
      const actData = await actRes.json();
      
      return {
        molecule: mol,
        activities: actData.activities || []
      };
    } catch (err) {
      return { error: 'ChEMBL API request failed: ' + err.message };
    }
  });

  // NMR Prediction (Offline RDKit)
  ipcMain.handle('predict-nmr', async (event, jsonPayload) => {
    return new Promise((resolve, reject) => {
      const tempPath = path.join(os.tmpdir(), 'mol_nmr.json');
      try {
        fs.writeFileSync(tempPath, jsonPayload);
      } catch (err) {
        return reject('Cannot write temp file: ' + err.message);
      }

      const scriptPath = path.join(__dirname, '../ocr/predict_nmr.py');
      const venvPython = path.join(__dirname, '../ocr/.venv/bin/python');
      
      execFile(venvPython, [scriptPath, tempPath], (error, stdout, stderr) => {
        if (error) {
          console.error('NMR Calc Error:', stderr || error);
          reject(stderr || error.message);
        } else {
          try {
            resolve(JSON.parse(stdout));
          } catch(e) {
            reject('NMR calc failed to parse JSON: ' + stdout);
          }
        }
      });
    });
  });

  ipcMain.handle('predict-ir', async (event, jsonPayload, mode) => {
    return new Promise((resolve, reject) => {
      const tempPath = path.join(os.tmpdir(), 'mol_ir.json');
      try {
        fs.writeFileSync(tempPath, jsonPayload);
      } catch (err) {
        return reject('Cannot write temp file: ' + err.message);
      }

      const scriptPath = path.join(__dirname, '../ocr/predict_ir.py');
      const venvPython = path.join(__dirname, '../ocr/.venv/bin/python');
      const args = [scriptPath, tempPath, mode || 'IR'];
      
      execFile(venvPython, args, (error, stdout, stderr) => {
        if (error) {
          console.error('IR/13C Calc Error:', stderr || error);
          reject(stderr || error.message);
        } else {
          try {
            resolve(JSON.parse(stdout));
          } catch(e) {
            reject('Spectrum calc failed to parse JSON: ' + stdout);
          }
        }
      });
    });
  });

  // Handle File Saving
  ipcMain.handle('save-file', async (event, content, options) => {
    const mainWindow = BrowserWindow.getFocusedWindow();
    const { canceled, filePath } = await dialog.showSaveDialog(mainWindow, options);
    
    if (canceled || !filePath) return null;
    
    try {
      fs.writeFileSync(filePath, content);
      return filePath;
    } catch (err) {
      throw new Error(`Failed to save file: ${err.message}`);
    }
  });

  // Handle File Opening
  ipcMain.handle('open-file', async (event, options) => {
    const mainWindow = BrowserWindow.getFocusedWindow();
    const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, options);
    
    if (canceled || filePaths.length === 0) return null;
    
    try {
      const content = fs.readFileSync(filePaths[0], 'utf-8');
      return { path: filePaths[0], content };
    } catch (err) {
      throw new Error(`Failed to read file: ${err.message}`);
    }
  });

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
