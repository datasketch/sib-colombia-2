import { useEffect, useRef } from 'react'
import DropDown from './Dropdown'

const ResponsiveNavbarMenu = ({ nav, menuIsActive, setMenuIsActive }) => {
  const refDropdown = useRef(null)
  useEffect(() => {
    document.addEventListener('click', handleClickOutside, true)
    return () => {
      document.removeEventListener('click', handleClickOutside, true)
    }
  }, [refDropdown])

  const handleClickOutside = ({ target }) => {
    if (refDropdown.current && !refDropdown.current.contains(target)) {
      setMenuIsActive(false)
    }
  }
  return (
    <ul ref={refDropdown} className={`lg:hidden fixed w-3/4 md:w-1/2 top-0 h-full bg-white z-40 pt-14 px-8 space-y-6 duration-500 ease-in ${menuIsActive ? 'right-0' : '-right-full'}`}>
      <div className='border-b border-black'>
        <button onClick={() => setMenuIsActive(false)} type='button' className='w-7 h-7 absolute right-8 top-4 cursor-pointer'>
          <img src='/images/icons/Icon X feather-menu.svg' alt='close icon' />
        </button>
      </div>
      {
        nav.map((item, i) => (
          <DropDown key={i}>
            <DropDown.Button className='font-lato text-sm md:text-md' {...item} arrow={!!item.childs?.length} src={'/images/icons/icon-up-arrow.svg'}>
              {item.label}
            </DropDown.Button>
            <DropDown.Items className="pt-2 pl-4 space-y-2">
              {item.childs?.map((el, key) =>
                <DropDown key={'SUB-' + key}>
                  <DropDown.Button className='font-lato text-sm md:text-md' arrow={!!item.children?.length} href={el.href} src={'/images/icons/icon-up-arrow.svg'}>
                    {el.label}
                  </DropDown.Button>
                  <DropDown.Items className='flex flex-col'>
                    {el.children?.map(ch =>
                      <DropDown.Item key={ch.label} className='text-black py-4.5 pl-2 hover:font-bold font-lato opacity-80 text-sm md:text-md w-full flex justify-between' color={item.color} href={ch.href}>
                        {ch.label}
                        {ch.children && <img src={item.icon} alt='icon arrow' />}
                      </DropDown.Item>)}
                  </DropDown.Items>
                </DropDown>
              )
              }
            </DropDown.Items>
          </DropDown>
        ))
      }
    </ul>

  )
}

export default ResponsiveNavbarMenu
