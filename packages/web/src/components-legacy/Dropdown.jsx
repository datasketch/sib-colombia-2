import classNames from 'classnames'
import { Link } from 'react-router-dom'
import { createContext, useContext, useEffect, useRef, useState } from 'react'

const DropDownContext = createContext(null)

export default function DropDown ({ children, setRegions, ...restProps }) {
  const refDropdown = useRef(null)
  const [open, setOpen] = useState(false)

  const showMenu = ({ target }) => {
    setOpen((prevState) => !prevState)
    setRegions([])
  }

  useEffect(() => {
    document.addEventListener('click', handleClickOutside, true)
    return () => {
      document.removeEventListener('click', handleClickOutside, true)
    }
  }, [refDropdown])

  const handleClickOutside = ({ target }) => {
    if (refDropdown.current && !refDropdown.current.contains(target)) {
      setOpen(false)
    }
  }

  return (
    <DropDownContext.Provider value={{ open, setOpen, showMenu }}>
      <div {...restProps} ref={refDropdown} >{children}</div>
    </DropDownContext.Provider>
  )
}

DropDown.Button = function DropDownButton ({ children, href, arrow, className, src }) {
  const { showMenu, open } = useContext(DropDownContext)

  if (!arrow && href) {
    return <Link href={href}><a className={classNames(className || '')}>{children}</a></Link>
  }

  return (
    <button onClick={showMenu} type="button" value='open' className="cursor-pointer">
      <div className={classNames(className, 'flex gap-x-2 items-center')}>
        {children}
        {
          src
            ? <img className={classNames(open ? '' : 'rotate-180', 'h-2.5')} src={src} alt="arrow" />
            : <img className='h-2.5' src='/images/arrow-white.svg' alt="arrow" />
        }
      </div>
    </button>
  )
}

DropDown.Items = function DropDownItems (props) {
  const { children } = props
  const { open } = useContext(DropDownContext)

  return <ul className={classNames(open ? 'block' : 'hidden', props.className)}>{children}</ul>
}

DropDown.SubMenu = function DropdownSubMenu (props) {
  const { children } = props

  return (
    <div className={classNames(props.className || '')}>{children}</div>
  )
}

DropDown.Item = function DropDownItem (props) {
  const { children, href, className, color } = props

  if (href) {
    return (
      <Link href={href} >
        <a className={classNames(className, color ? `hover:text-${color}` : '')}> {children} </a>
      </Link>
    )
  }

  return (
    <li {...props} className={classNames(className, color ? `hover:text-${color}` : '')}>
      {children}
    </li>
  )
}
