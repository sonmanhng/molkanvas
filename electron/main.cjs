const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('node:path');
const fs = require('node:fs');
const os = require('node:os');
const { execFile, spawn } = require('node:child_process');

const isDev = process.env.NODE_ENV === 'development';

function getPythonExecutable() {
  if (app.isPackaged) {
    // In --onedir mode, the executable is inside the folder
    return path.join(process.resourcesPath, 'molkanvas-backend', 'molkanvas-backend');
  }
  return path.join(__dirname, '../ocr/.venv/bin/python3');
}

function getPythonArgs(commandName, additionalArgs = []) {
  if (app.isPackaged) {
    return [commandName, ...additionalArgs];
  } else {
    const cliPath = path.join(__dirname, '../ocr/cli.py');
    return [cliPath, commandName, ...additionalArgs];
  }
}

function runPythonCommand(commandName, args) {
  return new Promise((resolve, reject) => {
    const executable = getPythonExecutable();
    const cmdArgs = getPythonArgs(commandName, args);
    
    execFile(executable, cmdArgs, (error, stdout, stderr) => {
      if (error) {
        console.error(`[${commandName}] Error:`, stderr || error);
        reject(stderr || error.message);
      } else {
        resolve(stdout);
      }
    });
  });
}

function spawnPythonCommand(commandName) {
  const executable = getPythonExecutable();
  const cmdArgs = getPythonArgs(commandName);
  return spawn(executable, cmdArgs);
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    title: 'MolKanvas',
    titleBarStyle: 'hiddenInset',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  if (isDev) {
    const devUrl = process.env.VITE_DEV_URL || 'http://localhost:5173';
    win.loadURL(devUrl);
  } else {
    win.loadFile(path.join(__dirname, '../dist/index.html'));
  }
}

app.whenReady().then(() => {
  ipcMain.handle('recognize-image', async (event, buffer, fileName) => {
    const tempPath = path.join(os.tmpdir(), fileName || 'temp_image.png');
    fs.writeFileSync(tempPath, Buffer.from(buffer));
    try {
      const stdout = await runPythonCommand('worker', [tempPath]);
      return stdout.trim();
    } catch (err) {
      throw new Error(err);
    }
  });

  ipcMain.handle('generate-3d', async (event, jsonPayload) => {
    const tempPath = path.join(os.tmpdir(), 'mol_graph_3d.json');
    fs.writeFileSync(tempPath, jsonPayload);
    try {
      return await runPythonCommand('generate_3d', [tempPath]);
    } catch (err) {
      throw new Error(err);
    }
  });

  ipcMain.handle('generate-2d-mol', async (event, jsonPayload) => {
    const tempPath = path.join(os.tmpdir(), 'mol_graph_2d.json');
    fs.writeFileSync(tempPath, jsonPayload);
    try {
      return await runPythonCommand('export_2d', [tempPath]);
    } catch (err) {
      throw new Error(err);
    }
  });

  ipcMain.handle('calculate-properties', async (event, jsonPayload) => {
    const tempPath = path.join(os.tmpdir(), 'mol_graph_props.json');
    fs.writeFileSync(tempPath, jsonPayload);
    try {
      const stdout = await runPythonCommand('calc_props', [tempPath]);
      return JSON.parse(stdout);
    } catch (err) {
      throw new Error(err);
    }
  });

  ipcMain.handle('smiles-to-graph', async (event, smiles) => {
    const tempPath = path.join(os.tmpdir(), 'smiles_input.txt');
    fs.writeFileSync(tempPath, smiles);
    try {
      const stdout = await runPythonCommand('smiles_to_graph', [tempPath]);
      return JSON.parse(stdout);
    } catch (err) {
      throw new Error(err);
    }
  });

  ipcMain.handle('clean-graph', async (event, jsonPayload) => {
    const tempPath = path.join(os.tmpdir(), 'mol_graph_clean.json');
    fs.writeFileSync(tempPath, jsonPayload);
    try {
      const stdout = await runPythonCommand('clean_graph', [tempPath]);
      return JSON.parse(stdout);
    } catch (err) {
      throw new Error(err);
    }
  });

  ipcMain.handle('analyze-stereo', async (event, data) => {
    return new Promise((resolve) => {
      const process = spawnPythonCommand('analyze_stereo');
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
    return new Promise((resolve) => {
      const process = spawnPythonCommand('bio_sequence');
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
      
      const actUrl = `https://www.ebi.ac.uk/chembl/api/data/activity.json?molecule_chembl_id=${chemblId}&standard_type__in=IC50,Ki,EC50,Kd&pchembl_value__isnull=false&limit=20`;
      const actRes = await fetch(actUrl);
      if (!actRes.ok) {
        const text = await actRes.text();
        return { error: `ChEMBL activity returned ${actRes.status}: ` + text.substring(0, 100) };
      }
      const actData = await actRes.json();
      
      return { molecule: mol, activities: actData.activities || [] };
    } catch (err) {
      return { error: 'ChEMBL API request failed: ' + err.message };
    }
  });

  // NMR Prediction
  ipcMain.handle('predict-nmr', async (event, jsonPayload) => {
    const tempPath = path.join(os.tmpdir(), 'mol_nmr.json');
    fs.writeFileSync(tempPath, jsonPayload);
    try {
      const stdout = await runPythonCommand('predict_nmr', [tempPath]);
      return JSON.parse(stdout);
    } catch (err) {
      throw new Error(err);
    }
  });

  // IR Prediction
  ipcMain.handle('predict-ir', async (event, jsonPayload, mode) => {
    const tempPath = path.join(os.tmpdir(), 'mol_ir.json');
    fs.writeFileSync(tempPath, jsonPayload);
    try {
      const stdout = await runPythonCommand('predict_ir', [tempPath, mode || 'IR']);
      return JSON.parse(stdout);
    } catch (err) {
      throw new Error(err);
    }
  });

  // Analyze Conformers
  ipcMain.handle('analyze-conformers', async (event, smiles) => {
    try {
      const stdout = await runPythonCommand('conformer_analysis', [smiles]);
      return JSON.parse(stdout);
    } catch (err) {
      throw new Error(err);
    }
  });

  // Handle File Saving
  ipcMain.handle('save-file', async (event, content, options) => {
    const mainWindow = BrowserWindow.getFocusedWindow();
    const { canceled, filePath } = await dialog.showSaveDialog(mainWindow, options);
    
    if (canceled || !filePath) return null;
    
    try {
      if (typeof content === 'string' && content.startsWith('data:')) {
        const matches = content.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
        if (matches && matches.length === 3) {
          fs.writeFileSync(filePath, Buffer.from(matches[2], 'base64'));
        } else {
          fs.writeFileSync(filePath, content);
        }
      } else {
        fs.writeFileSync(filePath, content);
      }
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
