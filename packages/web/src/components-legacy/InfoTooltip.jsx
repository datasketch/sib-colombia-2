import { useState, useRef, useEffect } from 'react'
import classNames from 'classnames'
import ReactMarkdown from 'react-markdown'
import rehypeRaw from 'rehype-raw'

const InfoTooltip = ({ label, src, id, classname, place = 'left' }) => {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const labelText = Array.isArray(label) ? label.join(' ') : String(label || '')

  useEffect(() => {
    if (!open) return
    const handler = (e) => {
      if (!ref.current?.contains(e.target)) setOpen(false)
    }
    document.addEventListener('click', handler)
    return () => document.removeEventListener('click', handler)
  }, [open])

  const placeClass = {
    left: 'right-full top-0 mr-2',
    right: 'left-full top-0 ml-2',
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
  }[place]

  return (
    <div
      ref={ref}
      className={classNames('relative inline-flex bg-opacity-30 bg-white rounded-full p-1', classname)}
    >
      <button
        type='button'
        className='cursor-pointer'
        onClick={() => setOpen(!open)}
        onMouseEnter={() => setOpen(true)}
        aria-label='Información'
      >
        <img className='w-4 h-4' src={src} alt='icon info' />
      </button>
      {open && (
        <div
          className={`absolute z-50 bg-white text-black text-xs rounded shadow-lg p-3 max-w-xs whitespace-pre-line ${placeClass}`}
          onMouseLeave={() => setOpen(false)}
        >
          <ReactMarkdown
            rehypePlugins={[rehypeRaw]}
            components={{
              p: ({ children }) => <span>{children}</span>,
              a: ({ href, children }) => (
                <a href={href} target='_blank' rel='noreferrer' className='text-lemon underline'>
                  {children}
                </a>
              ),
            }}
          >
            {labelText}
          </ReactMarkdown>
        </div>
      )}
    </div>
  )
}

export default InfoTooltip
