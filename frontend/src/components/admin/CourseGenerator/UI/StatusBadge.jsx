"use client";

import { memo, useMemo } from "react";

const StatusBadge = memo(({ status }) => {
  const colorMap = useMemo(
    () => ({
      active: "bg-green-100 text-green-800",
      inactive: "bg-gray-100 text-gray-800",
      draft: "bg-yellow-100 text-yellow-800",
      published: "bg-blue-100 text-blue-800",
    }),
    []
  );

  return (
    <span
      className={`px-2 py-1 text-xs font-medium rounded-full ${
        colorMap[status] || "bg-gray-100 text-gray-800"
      }`}
    >
      {status}
    </span>
  );
});

StatusBadge.displayName = "StatusBadge";

export default StatusBadge;
