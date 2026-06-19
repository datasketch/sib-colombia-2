/* eslint-disable no-unused-vars */
import classNames from 'classnames'
import { useContext, useEffect, useState } from 'react'
import { AppContext } from '../context/AppContext'

export default function Footer () {
  const [bgColor, setBgColor] = useState('bg-gradient-to-r from-lemon to-dartmouth-green')
  const { footerBgColor } = useContext(AppContext)
  useEffect(() => {

  }, [footerBgColor])

  return (
    <footer className={classNames(footerBgColor, 'bg-cover bg-center h-auto pt-6 pb-4 space-y-6')}>
      <div className="max-w-screen-xl px-20 mx-auto text-white ">
        <div className='flex flex-col gap-y-8 lg:flex-row justify-between'>
          <a href='https://biodiversidad.co' target='_blank' rel="noreferrer">
            <img className='lg:h-[50%] lg:w-2/3' src='/images/sib-icon.svg' alt='icon sib ' />
          </a>
          <div className="flex flex-col gap-y-6 lg:flex-row gap-x-16">
            <div className="flex text-center lg:text-left flex-col gap-y-2.5 text-sm font-lato">
              <b > Acerca de</b>
              <a target='_blank' href='/mas/acerca-de' rel="noreferrer">Esta versión</a>
              <a target='_blank' href='/mas/metodologia' rel="noreferrer">Metodología</a>
              <a target='_blank' href='https://gitlab.com/sib-colombia/cifras-biodiversidad' rel="noreferrer">Datos</a>
              <a target='_blank' href='/mas/acerca-de#como-citar' rel="noreferrer">Cómo citar</a>
              <a target='_blank' href='https://github.com/datasketch/humboldt-biodiversidad-en-cifras/issues' rel="noreferrer">Reportar inconsistencias</a>
            </div>
            <div className="text-center lg:text-left flex flex-col gap-y-2.5 text-sm font-lato">
              <b>Enlaces</b>
              <a target='_blank' href='https://biodiversidad.co/' rel="noreferrer">SiB colombia</a>
              <a target='_blank' href='https://biodiversidad.co/terminos-y-condiciones/politica-de-uso' rel="noreferrer">Términos y condiciones</a>
              <a target='_blank' href='https://biodiversidad.co/boletin' rel="noreferrer">Suscribirse al boletín</a>
            </div>

            <div className="text-center lg:text-left flex flex-col gap-y-2.5 text-sm font-lato">
              <b>Contacto</b>
              <a target='_blank' href='mailto:sib@humboldt.org.co' rel="noreferrer">sib@humboldt.org.co</a>
              <span>Calle 72 # 12 - 65 Piso 7</span>
              <span>Teléfonos de contacto: + 57 310 215 8291 +57 310 215 8287</span>
              <span>Bogotá D.C., Colombia</span>
              <div className="flex gap-x-4 justify-center lg:justify-start items-center">
                <a target='_blank' href='https://twitter.com/sibcolombia' rel="noreferrer">
                  <img src='/images/icons/icon-x.svg' className='h-5 w-5' alt="X (formerly Twitter)"/>
                </a>
                <a target='_blank' href='https://www.facebook.com/SibColombia' rel="noreferrer">
                  <img src='/images/icons/icon-fb.svg' className='h-5 w-6' alt="Facebook"/>
                </a>
                <a target='_blank' href='https://www.youtube.com/user/sibcolombia' rel="noreferrer">
                  <img src='/images/icons/icon-yt.svg' className='h-5 w-5' alt="YouTube"/>
                </a>
              </div>
            </div>

          </div>
        </div>
      </div>
      <div className="text-center w-6/12 lg:w-2/12 mx-auto">
        {/* <div className='underline text-sm font-lato text-white py-1'>
          Versión 2022-2
        </div> */}
        <div className="border-b border-b-white pb-2 " />
        <div className='py-2'>
          <a href='https://datasketch.co' target='_blank' rel="noreferrer">
            <img className='lg:h-6 mx-auto' src='/images/powered-by.svg' alt='icon powered by datasketch' />
          </a>
        </div>
      </div>
    </footer >
  )
}
