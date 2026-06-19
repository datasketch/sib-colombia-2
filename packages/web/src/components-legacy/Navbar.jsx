import { Link } from 'react-router-dom'
import DropDown from './Dropdown'
import ResponsiveNavbarMenu from './ResponsiveNavbarMenu'
import { useState } from 'react'
import classNames from 'classnames'
import { navigationData } from './lib/navigation'

export default function Navbar () {
  const [childrenRegions, setChildrenRegions] = useState([])
  const [menuIsActive, setMenuIsActive] = useState(false)

  // Array of departments with more information
  const highlightedDepartments = [
    'boyaca',
    'narino',
    'tolima',
    'santander',
    'amazonas',
    'caqueta',
    'guainia',
    'guaviare',
    'putumayo',
    'vaupes',
    'meta'
  ]

  // Helper to split array into N columns (top-to-bottom)
  function splitIntoColumns (arr, columns) {
    const perCol = Math.ceil(arr.length / columns)
    return Array.from({ length: columns }, (_, i) => arr.slice(i * perCol, (i + 1) * perCol))
  }

  const nav = navigationData

  const handleRegionsSelected = (children) => {
    if (!children) {
      setChildrenRegions([])
      return
    }
    setChildrenRegions(children)
  }

  // Create columns for the currently selected children
  const selectedColumns = splitIntoColumns(childrenRegions, 4)

  return (
    <header className="absolute top-0 left-0 w-full z-50 py-2">
      <div className='mx-auto w-10/12 max-w-[1300px] '>
        <div className='flex justify-between'>
          <div>
            <Link href="/">
              <a className='flex items-center'>
                <img className='min-h-[40px] min-w-[140px] w-1/2' src="/images/logo-biodiversidadcifras.svg" alt="Logo biodiversidadcifras" />
              </a>
            </Link>
          </div>
          <nav className='lg:self-end'>

            {/* DESKTOP */}
            <ul className={'hidden relative lg:grid lg:grid-cols-4 text-white gap-x-6'}>
              {nav.map((item, i) =>
                <DropDown key={'nav-' + i} setRegions={setChildrenRegions}>
                  <DropDown.Button {...item} arrow={!!item.childs?.length} className='font-lato text-sm'>
                    {item.label}
                  </DropDown.Button>
                  <DropDown.Items className='absolute top-[132%] bg-white w-40 flex flex-col gap-y-0.5 py-1.5 px-2.5'>
                    {item.childs?.map((el, key) =>
                      <div key={`${el.label}-${key}`}>
                        <div>
                          <DropDown.Item className='text-black  py-1.5 hover:font-bold font-lato opacity-80 text-sm w-full flex justify-between' onClick={() => handleRegionsSelected(el.children)} color={item.color} href={el.href}>
                            {el.label}
                            {el.children && <img src={item.icon} alt='icon arrow' />}
                          </DropDown.Item>
                        </div>
                        {childrenRegions.length !== 0 && childrenRegions.length > 6 && (
                          <div className={classNames('bg-white w-[741px] absolute top-0 px-7 py-5 grid grid-cols-4 gap-4 text-sm font-lato duration-400 ease-in -right-2/3')}>
                            {selectedColumns.map((col, colIdx) => (
                              <div key={colIdx} className="flex flex-col gap-2">
                                {col.map(({ label, href }, idx) => {
                                  const isHighlighted = highlightedDepartments.includes(href.replace('/', ''))
                                  return (
                                    <a
                                      href={href}
                                      key={href}
                                      className={
                                        isHighlighted
                                          ? 'text-dartmouth-green font-bold underline hover:text-dartmouth-green'
                                          : 'text-black hover:font-bold'
                                      }
                                    >
                                      {label}
                                    </a>
                                  )
                                })}
                              </div>
                            ))}
                          </div>
                        )}

                        {childrenRegions.length !== 0 && childrenRegions.length <= 6 && <div className={classNames('bg-white w-full h-full absolute top-0 left-full py-1.5 px-2 grid grid-cols-1 text-sm font-lato')}>
                          {childrenRegions?.map(({ label, href }, index) => {
                            // Only apply graying out logic for Regiones Naturales
                            const isRegionesNaturales = childrenRegions.length === 6 && childrenRegions.some(item => item.href === '/especial/region-amazonia')
                            const isAmazonia = href === '/especial/region-amazonia'

                            if (isRegionesNaturales) {
                              return (
                                <a
                                  href={isAmazonia ? href : '#'}
                                  key={index}
                                  className={`${isAmazonia ? `text-black hover:font-bold hover:text-${item.color}` : 'text-gray-400 cursor-not-allowed'}`}
                                  onClick={isAmazonia ? undefined : (e) => e.preventDefault()}
                                >
                                  {label}
                                </a>
                              )
                            } else {
                              // Normal behavior for other sections
                              return (
                                <a href={href} key={index} className={`text-black hover:font-bold hover:text-${item.color}`}>
                                  {label}
                                </a>
                              )
                            }
                          })}
                        </div>}
                      </div>
                    )
                    }
                  </DropDown.Items>
                </DropDown>
              )}
            </ul>

            {/* Movile */}
            <ResponsiveNavbarMenu nav={nav} setMenuIsActive={setMenuIsActive} menuIsActive={menuIsActive} />
          </nav>
          <button onClick={() => setMenuIsActive(!menuIsActive)} type='button' className='lg:hidden w-7 h-7 mt-2 cursor-pointer'>
            <img src='/images/icons/Icon feather-menu.svg' alt='hamburguer icon' />
          </button>
        </div>
        <div className='border-b border-white pb-2'></div>
      </div>
    </header>
  )
}
