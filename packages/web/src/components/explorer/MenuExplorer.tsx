import { useState, ReactNode } from "react";
import type { TreeNode } from "../../api/types";
import { capitalize } from "../../lib/format";

interface Props {
  tree: TreeNode | null | undefined;
  /** Render function called with the currently-selected leaf node */
  children: (selectedSlug: string, selectedNode: TreeNode | null) => ReactNode;
  /** Initial selected child slug (defaults to first child) */
  initialSelected?: string;
}

/**
 * Tabbed tree navigation with breadcrumb support.
 * Port of MenuExplorer.jsx — simplified for the most common case
 * where the user picks a top-level child of the root tree.
 */
export function MenuExplorer({ tree, children, initialSelected }: Props) {
  const topChildren = tree?.children ?? [];
  const [selected, setSelected] = useState<string>(
    initialSelected ?? topChildren[0]?.slug ?? ""
  );

  const selectedNode = topChildren.find((c) => c.slug === selected) ?? null;

  if (topChildren.length === 0) {
    return (
      <div className="text-gray-500 italic text-center py-8">
        No hay datos disponibles.
      </div>
    );
  }

  return (
    <div>
      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-gray-200 mb-6">
        {topChildren.map((child) => {
          const isActive = child.slug === selected;
          return (
            <button
              key={child.slug}
              type="button"
              onClick={() => setSelected(child.slug)}
              className={`px-4 py-2 text-sm font-semibold rounded-t transition flex items-center gap-2 ${
                isActive
                  ? "bg-dartmouth-green text-white"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              {child.icon_white && isActive && (
                <img src={`/${child.icon_white}`} alt="" className="w-5 h-5" />
              )}
              {child.icon_black && !isActive && (
                <img src={`/${child.icon_black}`} alt="" className="w-5 h-5" />
              )}
              {child.label ?? capitalize(child.slug)}
            </button>
          );
        })}
      </div>

      {/* Body */}
      <div>{children(selected, selectedNode)}</div>
    </div>
  );
}
