const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  recognizeImage: (buffer, fileName) => ipcRenderer.invoke('recognize-image', buffer, fileName),
  generate3D: (jsonPayload) => ipcRenderer.invoke('generate-3d', jsonPayload),
  generate2DMol: (jsonPayload) => ipcRenderer.invoke('generate-2d-mol', jsonPayload),
  calculateProperties: (jsonPayload) => ipcRenderer.invoke('calculate-properties', jsonPayload),
  smilesToGraph: (smiles) => ipcRenderer.invoke('smiles-to-graph', smiles),
  cleanGraph: (jsonPayload) => ipcRenderer.invoke('clean-graph', jsonPayload),
  analyzeStereo: (jsonPayload) => ipcRenderer.invoke('analyze-stereo', jsonPayload),
  parseSequence: (data) => ipcRenderer.invoke('parse-sequence', data),
  chemblSearch: (smiles) => ipcRenderer.invoke('chembl-search', smiles),
  predictNmr: (jsonPayload) => ipcRenderer.invoke('predict-nmr', jsonPayload),
  predictIr: (jsonPayload, mode) => ipcRenderer.invoke('predict-ir', jsonPayload, mode),
  analyzeConformers: (smiles) => ipcRenderer.invoke('analyze-conformers', smiles),
  saveFile: (content, options) => ipcRenderer.invoke('save-file', content, options),
  openFile: (options) => ipcRenderer.invoke('open-file', options)
});
