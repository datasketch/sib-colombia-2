import React, { useContext, useState, useEffect, useRef } from 'react'
import { Menu, MenuButton } from '@szhsin/react-menu'
import MenuBoxItem from './MenuBoxItem'
import '@szhsin/react-menu/dist/index.css'
import SimpleSlider from './Slider'
import { clearText } from './lib/functions'
import classNames from 'classnames'

const MenuExplorerContext = React.createContext({})

export default function MenuExplorer ({ children, tree, search, initialSelected = '', initialSelectedValue = '', ...restProps }) {
  const [breadcrumb, setBreadcrumb] = useState(initialSelected ? [initialSelected] : [])
  const [selected, setSelected] = useState(initialSelected)

  const [selectedValue, setSelectedValue] = useState(initialSelectedValue)

  const updateBreadcrumb = (e, parent) => {
    let { textContent, value } = e.target
    const slug = e.target.getAttribute('aria-label')

    if (selected === textContent) {
      return
    }
    if (textContent === 'Ver más') {
      textContent = clearText(value)
    }
    if (parent !== breadcrumb[0]) {
      setBreadcrumb([])
    }
    setBreadcrumb((prevState) => [...prevState, parent, textContent || value].reduce((acc, element) => {
      if (!acc.includes(element)) {
        acc.push(element)
      }
      return acc
    }, []))
    setSelected(textContent)
    setSelectedValue(slug || value || textContent.normalize('NFC').toLowerCase().replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '_'))
  }

  const resetBreadcrumb = ({ open }) => {
    if (open) {
      setBreadcrumb(breadcrumb.slice(0, 1))
    }
  }

  const firstPositionBC = (e) => {
    const { textContent, value } = e.target.closest('button')
    const slug = e.target.getAttribute('aria-label')
    setBreadcrumb([textContent])
    setSelected(textContent)
    setSelectedValue(slug || value || textContent.normalize('NFC').toLowerCase().replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '_'))
  }
  return (
    <MenuExplorerContext.Provider
      value={{
        selected,
        setSelected,
        selectedValue,
        setSelectedValue,
        breadcrumb,
        setBreadcrumb,
        updateBreadcrumb,
        resetBreadcrumb,
        firstPositionBC,
        tree,
        search
      }}
    >
      <div {...restProps}>{children}</div>
    </MenuExplorerContext.Provider>
  )
}

MenuExplorer.Title = function MenuExplorerTitle ({ children }) {
  return <>{children}</>
}

MenuExplorer.Tree = function MenuExplorerTree ({ className, ...restProps }) {
  // Early return for debugging
  if (typeof useContext !== 'function') {
    console.error('useContext is not available')
    return <div>React hook error</div>
  }

  if (!MenuExplorerContext) {
    console.error('MenuExplorerContext is not defined')
    return <div>Context error</div>
  }

  let context
  try {
    context = useContext(MenuExplorerContext)
    // console.log('Context retrieved:', context)
  } catch (error) {
    console.error('Error accessing MenuExplorerContext:', error)
    return <div>Error loading menu</div>
  }

  if (!context || typeof context !== 'object') {
    console.error('Invalid context object:', context)
    return <div>Invalid context</div>
  }

  if (!context.tree) {
    console.error('MenuExplorer.Tree must be used within a MenuExplorer component. Context:', context)
    return <div>Loading tree...</div>
  }

  const { tree, updateBreadcrumb, resetBreadcrumb, firstPositionBC, breadcrumb } = context
  const container = useRef(null)

  return (
    <div className={classNames(className)} {...restProps}>
      <SimpleSlider slidestoshow={restProps.slidestoshow || 5} responsive>
        {tree?.children?.map((leaf, i) => (
          <div className='px-2' key={i}>
            <div className='bg-transparent shadow-3 h-24 w-auto flex' key={breadcrumb[0]} ref={container}>
              <button className={`w-full h-full py-4 px-2.5 cursor-pointer ${breadcrumb[0] === leaf.label ? 'bg-gradient-to-r from-lemon to-dartmouth-green' : 'bg-white'}`} value={leaf.slug} onClick={firstPositionBC}>
                <div className="min-w-[80px]">
                  <img className="mx-auto h-4 w-9" src={breadcrumb[0] === leaf.label ? (leaf?.icon_white ? '/' + leaf?.icon_white : '/images/animales-cifras-icon-white.svg') : (leaf?.icon_white ? '/' + leaf?.icon_black : '/images/animales-cifras-icon-black.svg')} />
                  <p className={`w-full font-bold font-lato break-words ${breadcrumb[0] === leaf.label ? 'text-white' : 'text-black-3'}`}>
                    {leaf.label}
                  </p>
                </div>
              </button>
              <Menu
                portal
                menuButton={
                  leaf?.children
                    ? (<MenuButton
                      className={'cursor-pointer bg-opacity-100 '}>
                      <div className={classNames('flex items-center px-2.5', breadcrumb[0] !== leaf.label ? 'border-l border-l-dartmouth-green h-3/4' : '')}>
                        <img className='h-4 w-6' src="/images/green-arrow-down.svg" alt="arrow down" />
                      </div>
                    </MenuButton>)
                    : <div></div>
                }
                onClick={(e) => updateBreadcrumb(e, leaf.label)}
                onMenuChange={resetBreadcrumb}
              >
                {(leaf.children || []).map((child, index) => {
                  return <MenuBoxItem key={index} child={child} />
                })}
              </Menu>
            </div>
          </div>
        ))
        }
      </SimpleSlider >
    </div >
  )
}

MenuExplorer.Breadcrumb = function MenuExplorerBreadcrumb ({ className, ...restProps }) {
  const context = useContext(MenuExplorerContext)
  if (!context || !context.breadcrumb) {
    console.error('MenuExplorer.Breadcrumb must be used within a MenuExplorer component')
    return null
  }
  const { breadcrumb, updateBreadcrumb, resetBreadcrumb, parent } = context

  useEffect(() => {
  }, [breadcrumb])

  // const changebreadcrumb = ({ target }) => {
  //   const { textContent } = target.closest('p')
  //   const index = breadcrumb.findIndex((element) => element === textContent)
  //   setBreadcrumb(breadcrumb.slice(0, index + 1))
  //   setSelected(textContent)
  // }

  return (
    <div {...restProps} className={className}>
      {
        (breadcrumb || []).map((value, i) => {
          return (
            <div className='flex space-x-2 items-center' key={i}>
              <button value={value} type='button' className='cursor-pointer' onClick={e => updateBreadcrumb(e, parent)} onChange={resetBreadcrumb} aria-label={value}>
                <p className='py-2 font-lato font-bold'>
                  {value}
                </p>
              </button>
              <img src="/images/arrow-black.svg" alt="arrow-breadcrumbs" />
            </div>
          )
        })
      }
    </div>
  )
}

MenuExplorer.Body = function MenuExplorerBody ({ children, className, ...restProps }) {
  const context = useContext(MenuExplorerContext)
  if (!context || !context.search) {
    console.error('MenuExplorer.Body must be used within a MenuExplorer component')
    return null
  }
  const { selected, selectedValue, search, updateBreadcrumb } = context
  const normalizedSelectedValue = selectedValue?.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '_')
  const info = search?.find((item) => item.slug === normalizedSelectedValue)

  return (
    <div className={`${className} ${selected ? 'block' : 'hidden'}`} {...restProps}>
      {children(selected, info, updateBreadcrumb)}
    </div>
  )
}
