import { useAppStore } from "./store";
import Titlebar from "./components/Titlebar";
import Menubar from "./components/Menubar";
import Toolbar from "./components/Toolbar";
import LayerPanel from "./components/LayerPanel";
import MapView from "./components/MapView";
import PropertyPanel from "./components/PropertyPanel";
import StatusBar from "./components/StatusBar";
import CommandPalette from "./components/CommandPalette";
import Wizard from "./components/Wizard";
import ContextMenu from "./components/ContextMenu";
import ImportPanel from "./components/ImportPanel";
import Toast from "./components/Toast";
import { useKeyboard } from "./hooks/useKeyboard";
import "./App.css";

function App() {
  const { wizardOpen, importPanelOpen } = useAppStore();
  useKeyboard();
  return (
    <>
      <Titlebar />
      <Menubar />
      <Toolbar />
      <div className="main">
        <LayerPanel />
        <MapView />
        <PropertyPanel />
      </div>
      <StatusBar />
      <CommandPalette />
      <ContextMenu />
      <Toast />
      {wizardOpen && <Wizard />}
      {importPanelOpen && <ImportPanel />}
    </>
  );
}
export default App;
