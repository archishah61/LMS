"use client";

import { memo, useMemo } from "react";
import {
  Play,
  Volume2,
  HelpCircle,
  FileText,
  Presentation,
  BookOpen,
} from "lucide-react";

const ContentTypeIcon = memo(({ type }) => {
  const iconMap = useMemo(
    () => ({
      video: <Play className="w-4 h-4 text-red-500" />,
      audio: <Volume2 className="w-4 h-4 text-blue-500" />,
      accordian: <HelpCircle className="w-4 h-4 text-green-500" />,
      general: <FileText className="w-4 h-4 text-gray-500" />,
      slide: <Presentation className="w-4 h-4 text-purple-500" />,
    }),
    []
  );

  return iconMap[type] || <BookOpen className="w-4 h-4 text-gray-500" />;
});

ContentTypeIcon.displayName = "ContentTypeIcon";

export default ContentTypeIcon;
