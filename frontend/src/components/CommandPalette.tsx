import { useState, useEffect, useRef } from 'react';
import { useAppStore } from '../store';

interface CommandItem {
  icon: string;
  label: string;
  shortcut?: string;
  category: string;
  action?: () => void;
}

export default function CommandPalette() {
  const { commandPaletteOpen, setCommandPaletteOpen, setViewMode, setActiveTool, setImportPanelOpen, addToast, setWizardOpen } = useAppStore();
  const [query, setQuery] = useState('');
  const [highlightIndex, setHighlightIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const allCommands: CommandItem[] = [
    { icon: '📋', label: '缩放至全图', shortcut: 'Home', category: '最近使用' },
    { icon: '📋', label: '添加图层', shortcut: 'Ctrl+L', category: '最近使用', action: () => setImportPanelOpen(true) },
    { icon: '🔍', label: '追踪上游管段', category: '推荐操作', action: () => { setActiveTool('traceup'); addToast('success', '上游追踪完成'); } },
    { icon: '🔍', label: '追踪下游管段', category: '推荐操作', action: () => { setActiveTool('tracedown'); addToast('success', '下游追踪完成'); } },
    { icon: '📊', label: '查看检测记录', category: '推荐操作' },
    { icon: '🔬', label: 'SewerAI 缺陷分析', category: '推荐操作' },
    { icon: '📹', label: 'POSM CCTV 回放', category: '推荐操作' },
    { icon: '▢', label: '切换到 2D', shortcut: '1', category: '视图', action: () => setViewMode('2d') },
    { icon: '◇', label: '切换到 3D', shortcut: '2', category: '视图', action: () => setViewMode('3d') },
    { icon: '≡', label: '纵断面', shortcut: '3', category: '视图', action: () => setViewMode('profile') },
    { icon: '⊞', label: '分屏', shortcut: '4', category: '视图', action: () => setViewMode('split') },
    { icon: '📍', label: '更改坐标系统', category: '项目设置', action: () => { setWizardOpen(true); useAppStore.getState().setWizardStep(1); } },
    { icon: '🗺️', label: '底图管理器', category: '项目设置' },
    { icon: '📥', label: '导入数据', category: '项目设置', action: () => setImportPanelOpen(true) },
    { icon: '📤', label: '导出 Shapefile', shortcut: 'Ctrl+E', category: '项目设置', action: () => addToast('success', '导出完成') },
    { icon: '🖨', label: '打印布局', shortcut: 'Ctrl+P', category: '项目设置' },
  ];

  const filtered = query
    ? allCommands.filter(c => c.label.toLowerCase().includes(query.toLowerCase()))
    : allCommands;

  const categories: { name: string; items: typeof filtered }[] = [];
  const catMap = new Map<string, typeof filtered>();
  for (const cmd of filtered) {
    if (!catMap.has(cmd.category)) catMap.set(cmd.category, []);
    catMap.get(cmd.category)!.push(cmd);
  }
  catMap.forEach((items, name) => categories.push({ name, items }));

  const flatItems = categories.flatMap(c => c.items);

  useEffect(() => {
    if (commandPaletteOpen) {
      setQuery('');
      setHighlightIndex(0);
      setTimeout(() => inputRef.current?.focus(), 80);
    }
  }, [commandPaletteOpen]);

  useEffect(() => { setHighlightIndex(0); }, [query]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') setCommandPaletteOpen(false);
    else if (e.key === 'ArrowDown') { e.preventDefault(); setHighlightIndex(i => Math.min(i + 1, flatItems.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setHighlightIndex(i => Math.max(i - 1, 0)); }
    else if (e.key === 'Enter') {
      e.preventDefault();
      const cmd = flatItems[highlightIndex];
      if (cmd) { cmd.action?.(); setCommandPaletteOpen(false); }
    }
  };

  if (!commandPaletteOpen) return null;

  let flatIdx = -1;

  return (
    <div className="cbg show" onClick={e => { if (e.target === e.currentTarget) setCommandPaletteOpen(false); }}>
      <div className="cpl">
        <div className="cin">
          <svg viewBox="0 0 16 16"><circle cx="7" cy="7" r="5" /><line x1="11" y1="11" x2="14" y2="14" /></svg>
          <input ref={inputRef} type="text" placeholder="输入命令、图层名或坐标..." value={query} onChange={e => setQuery(e.target.value)} onKeyDown={handleKeyDown} />
        </div>
        <div className="crl">
          {categories.map(cat => (
            <div key={cat.name}>
              <div className="cs">{cat.name}</div>
              {cat.items.map(item => {
                flatIdx++;
                const idx = flatIdx;
                return (
                  <div
                    key={item.label}
                    className={`ci2${idx === highlightIndex ? ' hl' : ''}`}
                    onClick={() => { item.action?.(); setCommandPaletteOpen(false); }}
                    onMouseEnter={() => setHighlightIndex(idx)}
                  >
                    <div className="ic">{item.icon}</div>
                    <span>{item.label}</span>
                    {item.shortcut && (
                      <span className="sk">{item.shortcut.split('+').map((k, i) => (
                        <span key={k}>{i > 0 ? '+' : ''}<kbd>{k}</kbd></span>
                      ))}</span>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
          {flatItems.length === 0 && (
            <div style={{ textAlign: 'center', padding: 20, color: 'var(--t4)', fontSize: 12 }}>没有匹配的命令</div>
          )}
        </div>
      </div>
    </div>
  );
}
