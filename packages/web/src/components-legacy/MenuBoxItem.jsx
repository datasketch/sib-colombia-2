import { MenuItem, SubMenu } from '@szhsin/react-menu'

export default function MenuBoxItem ({ child }) {
  const { children } = child

  return (
    !children || !children.length
      ? (
        <MenuItem value={child.label} aria-label={child.slug}> {child.label} </MenuItem>
        )
      : (
        <SubMenu label={child.label} itemProps={{ 'aria-label': child.slug }}>
          {child.children.map((grandChild, index) => (
            <MenuBoxItem key={index} child={grandChild} />
          ))}
        </SubMenu>
        )
  )
}
