"use client";

import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Camera, Upload } from "lucide-react";

interface AvatarUploadProps {
  currentAvatar?: string;
  userName: string;
  onAvatarChange: (avatar: string) => void;
}

export function AvatarUpload({
  currentAvatar,
  userName,
  onAvatarChange,
}: AvatarUploadProps) {
  const [preview, setPreview] = useState<string>(currentAvatar || "");
  const [isUploading, setIsUploading] = useState(false);

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setPreview(result);
      onAvatarChange(result);
      setIsUploading(false);
    };
    reader.readAsDataURL(file);
  };

  const handleUrlChange = (url: string) => {
    setPreview(url);
    onAvatarChange(url);
  };

  return (
    <div className="flex flex-col items-center space-y-4">
      <div className="relative">
        <Avatar className="h-24 w-24 border-4 border-white shadow-lg">
          <AvatarImage src={preview} alt={userName} />
          <AvatarFallback className="text-lg font-semibold bg-gradient-to-br from-blue-500 to-purple-600 text-white">
            {getInitials(userName)}
          </AvatarFallback>
        </Avatar>

        <div className="absolute -bottom-2 -right-2">
          <Label htmlFor="avatar-upload" className="cursor-pointer">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg hover:bg-blue-700 transition-colors">
              <Camera className="h-4 w-4" />
            </div>
          </Label>
          <Input
            id="avatar-upload"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
            disabled={isUploading}
          />
        </div>
      </div>

      <div className="w-full max-w-sm space-y-2">
        <Label htmlFor="avatar-url" className="text-sm font-medium">
          Or paste image URL
        </Label>
        <div className="flex gap-2">
          <Input
            id="avatar-url"
            placeholder="https://example.com/avatar.jpg"
            value={preview}
            onChange={(e) => handleUrlChange(e.target.value)}
            className="flex-1"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => handleUrlChange("")}
            className="px-3"
          >
            Clear
          </Button>
        </div>
      </div>
    </div>
  );
}
