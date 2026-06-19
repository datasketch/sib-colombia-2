import { useState, useRef, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'

const TooltipText = ({ label, md, id }) => {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const mdText = Array.isArray(md) ? md.join(' ') : String(md || '')

  useEffect(() => {
    if (!open) return
    const handler = (e) => {
      if (!ref.current?.contains(e.target)) setOpen(false)
    }
    document.addEventListener('click', handler)
    return () => document.removeEventListener('click', handler)
  }, [open])

  return (
    <span className='inline-block relative' ref={ref}>
      <span
        className='font-bold mx-0-5 inline-flex hover:underline cursor-help'
        onMouseEnter={() => setOpen(true)}
        onClick={() => setOpen(!open)}
      >
        {label}
      </span>
      {open && (
        <div
          className='absolute z-50 bg-white text-black text-xs rounded shadow-lg p-3 max-w-sm whitespace-pre-line top-full left-0 mt-1'
          onMouseLeave={() => setOpen(false)}
        >
          <ReactMarkdown
            components={{
              p: ({ children }) => <span>{children}</span>,
              a: ({ href, children }) => (
                <a href={href} target='_blank' rel='noreferrer' className='text-lemon underline'>
                  {children}
                </a>
              ),
            }}
          >
            {mdText}
          </ReactMarkdown>
        </div>
      )}
    </span>
  )
}

export default TooltipText
