import { useState, useEffect, useRef } from 'react';
import { Button } from './ui/button';
import { Download, Upload, Save, Check } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';

interface SaveManagerProps {
  onExport: () => void;
  onImport: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export function SaveManager({ onExport, onImport }: SaveManagerProps) {
  const [lastSaved, setLastSaved] = useState<Date | null>(() => {
    const saved = localStorage.getItem('dnd_last_save');
    return saved ? new Date(saved) : null;
  });
  const [showSaved, setShowSaved] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-save every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      localStorage.setItem('dnd_last_save', now.toISOString());
      setLastSaved(now);
      setShowSaved(true);
      setTimeout(() => setShowSaved(false), 2000);
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, []);

  // Save on any change to localStorage
  useEffect(() => {
    const handleStorageChange = () => {
      const now = new Date();
      localStorage.setItem('dnd_last_save', now.toISOString());
      setLastSaved(now);
    };

    // Listen for custom storage events
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const getTimeSinceLastSave = () => {
    if (!lastSaved) return 'Never';
    const seconds = Math.floor((Date.now() - lastSaved.getTime()) / 1000);
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="flex items-center gap-2">
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={onImport}
        className="hidden"
      />
      
      {showSaved ? (
        <div className="flex items-center gap-1 text-green-400 animate-in fade-in">
          <Check className="h-4 w-4" />
          <span className="text-sm">Saved</span>
        </div>
      ) : (
        <span className="text-slate-400 text-sm">
          Auto-saved {getTimeSinceLastSave()}
        </span>
      )}

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="bg-slate-800 border-slate-600 text-white hover:bg-slate-700">
            <Save className="h-4 w-4 mr-1" />
            Save
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="bg-slate-800 border-slate-600 text-white">
          <DropdownMenuItem 
            onClick={onExport}
            className="hover:bg-slate-700 cursor-pointer"
          >
            <Download className="h-4 w-4 mr-2" />
            Export to File
          </DropdownMenuItem>
          <DropdownMenuItem 
            onClick={handleImportClick}
            className="hover:bg-slate-700 cursor-pointer"
          >
            <Upload className="h-4 w-4 mr-2" />
            Import from File
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
