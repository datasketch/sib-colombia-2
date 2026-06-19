import type { TreeNode } from "../types/navigation.ts";

interface FlatRow {
  slug: string;
  parent: string;
  label?: string;
  [key: string]: unknown;
}

/**
 * Build a tree structure from flat rows with parent-child relationships.
 * Port of data.tree::FromDataFrameNetwork + ToListExplicit from navigation.R.
 *
 * @param rows Flat array of objects with slug, parent, and other properties
 * @returns The root TreeNode (with children). If multiple roots, wraps in a virtual root.
 */
export function buildTree(rows: FlatRow[]): TreeNode {
  const nodeMap = new Map<string, TreeNode & { _parent?: string }>();

  // Index all rows by slug
  for (const row of rows) {
    const { slug, parent, ...rest } = row;
    nodeMap.set(slug, { slug, ...rest, _parent: parent } as TreeNode & {
      _parent?: string;
    });
  }

  // Find root(s) and attach children
  const roots: TreeNode[] = [];

  for (const [slug, node] of nodeMap) {
    const parentSlug = node._parent;
    delete node._parent;

    if (!parentSlug || parentSlug === "0" || !nodeMap.has(parentSlug)) {
      roots.push(node);
    } else {
      const parentNode = nodeMap.get(parentSlug)!;
      if (!parentNode.children) parentNode.children = [];
      parentNode.children.push(node);
    }
    // Keep the slug in the map for lookups
    nodeMap.set(slug, node);
  }

  if (roots.length === 1) {
    return roots[0];
  }

  // Multiple roots — wrap in virtual root
  return { slug: "root", children: roots };
}
