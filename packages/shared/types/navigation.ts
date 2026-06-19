/** Recursive tree node for navigation menus */
export interface TreeNode {
  slug: string;
  label?: string;
  icon_white?: string;
  icon_black?: string;
  children?: TreeNode[];
  [key: string]: unknown;
}
