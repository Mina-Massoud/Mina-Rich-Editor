"use client";

import { useState } from "react";
import { EditorProvider } from "@/lib";
import { SimpleEditor } from "@/components/SimpleEditor";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ModeToggle } from "@/components/ui/mode-toggle";
import { Eye, Zap, Wrench } from "lucide-react";

export default function Home() {
  const [mode, setMode] = useState<"simple" | "mvp">("simple");
  const [readOnly, setReadOnly] = useState(false);

  return (
    <div>
      {/* Mode Switcher */}
      <Card className="fixed top-4 py-0 right-4 z-[100] shadow-lg">
        <CardContent className="p-3 space-y-3">
          {/* Read-only toggle */}
          <div className="flex items-center justify-between space-x-2">
            <Label
              htmlFor="view-only"
              className="flex items-center gap-2 cursor-pointer"
            >
              <Eye className="w-4 h-4" />
              <span className="text-sm">View Only</span>
            </Label>
            <Switch
              id="view-only"
              checked={readOnly}
              onCheckedChange={setReadOnly}
            />
          </div>

          <Separator />

          {/* Theme toggle */}
          <div className="flex items-center justify-between">
            <Label className="text-sm">Theme</Label>
            <ModeToggle />
          </div>
        </CardContent>
      </Card>

      {/* Render based on mode */}
      <EditorProvider debug={true}>
        <SimpleEditor readOnly={readOnly} />
      </EditorProvider>
    </div>
  );
}
