import { Download, Upload } from "lucide-react";
import { Button } from "./ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';

interface BackupSyncProps {
  onExport: () => void;
  onImport: (data: any) => void;
}

export const BackupSync = ({ onExport, onImport }: BackupSyncProps) => {
  const { toast } = useToast();

  const handleExportToDevice = async () => {
    try {
      const data = {
        jars: localStorage.getItem('jarify_jars'),
        categories: localStorage.getItem('jarify_categories'),
        notes: localStorage.getItem('jarify_notes'),
        darkMode: localStorage.getItem('jarify_darkMode'),
        exportDate: new Date().toISOString(),
      };

      const jsonData = JSON.stringify(data, null, 2);
      const fileName = `jarify-backup-${new Date().toISOString().split('T')[0]}.json`;

      // Check if running on native mobile platform
      if (Capacitor.isNativePlatform()) {
        // Use Capacitor Filesystem for mobile
        await Filesystem.writeFile({
          path: fileName,
          data: jsonData,
          directory: Directory.Documents,
          encoding: Encoding.UTF8,
        });

        toast({
          title: "Backup Created",
          description: "Your data has been saved to Documents folder.",
        });
      } else {
        // Use browser download for web
        const blob = new Blob([jsonData], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        toast({
          title: "Backup Created",
          description: "Your data has been downloaded to your device.",
        });
      }
      
      onExport();
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Export Failed",
        description: "Failed to create backup file.",
        variant: "destructive",
      });
    }
  };


  const handleImportFromDevice = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        
        if (data.jars) localStorage.setItem('jarify_jars', data.jars);
        if (data.categories) localStorage.setItem('jarify_categories', data.categories);
        if (data.notes) localStorage.setItem('jarify_notes', data.notes);
        if (data.darkMode) localStorage.setItem('jarify_darkMode', data.darkMode);

        toast({
          title: "Restore Successful",
          description: "Your data has been restored. Refreshing...",
        });
        
        setTimeout(() => {
          window.location.reload();
        }, 1500);
        
        onImport(data);
      } catch (error) {
        toast({
          title: "Import Failed",
          description: "Invalid backup file format.",
          variant: "destructive",
        });
      }
    };
    reader.readAsText(file);
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          Backup & Sync
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Backup & Restore Data</DialogTitle>
          <DialogDescription>
            Save your data to device and restore when needed.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3 py-4">
          <Button onClick={handleExportToDevice} className="w-full justify-start gap-2">
            <Download className="h-4 w-4" />
            Backup to Device
          </Button>
          
          <div className="relative">
            <input
              type="file"
              accept=".json"
              onChange={handleImportFromDevice}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              id="import-file"
            />
            <Button variant="secondary" className="w-full justify-start gap-2 pointer-events-none">
              <Upload className="h-4 w-4" />
              Restore from Device
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
