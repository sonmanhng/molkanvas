const { ipcRenderer } = require('electron');
async function test() {
  try {
    const res = await ipcRenderer.invoke('non-existent');
  } catch (err) {
    console.log("Error object:", err);
    console.log("err.message:", err.message);
  }
}
