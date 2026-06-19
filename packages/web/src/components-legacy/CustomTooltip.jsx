import { ClickAwayListener, styled, Tooltip, tooltipClasses } from '@mui/material'
import { useState } from 'react'

const LightTooltip = styled(({ className, ...props }) => (
  <Tooltip {...props} classes={{ popper: className }} />
))(({ theme }) => ({
  [`& .${tooltipClasses.tooltip}`]: {
    backgroundColor: theme.palette.common.white,
    color: 'rgba(0, 0, 0, 0.87)',
    boxShadow: theme.shadows[1],
    width: '500px'
  }
}))

const CustomTooltip = ({ title, children, placement }) => {
  const [open, setOpen] = useState(false)

  const handleClose = () => setOpen(false)

  const handleToggle = (e) => {
    e.stopPropagation()
    setOpen((prev) => !prev)
  }

  return (
    <ClickAwayListener onClickAway={handleClose}>
      <div className='inline-block'>
        <LightTooltip
          PopperProps={{ disablePortal: true }}
          onClose={handleClose}
          open={open}
          disableFocusListener
          disableHoverListener
          disableTouchListener
          title={title}
          placement={placement || 'right-start'}
        >
          <button type='button' className='inline-block cursor-pointer' onClick={handleToggle}>{children}</button>
        </LightTooltip>
      </div>
    </ClickAwayListener>
  )
}

export default CustomTooltip
